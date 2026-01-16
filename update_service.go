package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	GitHubOwner = "danielkosgei"
	GitHubRepo  = "farmland"
)

// UpdateService handles checking for and applying updates
type UpdateService struct {
	downloadProgress float64
	downloadedFile   string
	isDownloading    bool
	downloadError    string
	latestAssetName  string
}

// NewUpdateService creates a new UpdateService
func NewUpdateService() *UpdateService {
	return &UpdateService{}
}

// UpdateInfo contains information about an available update
type UpdateInfo struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	HasUpdate      bool   `json:"hasUpdate"`
	ReleaseNotes   string `json:"releaseNotes"`
	DownloadURL    string `json:"downloadUrl"`
	AssetName      string `json:"assetName"`
	AssetSize      int64  `json:"assetSize"`
	PublishedAt    string `json:"publishedAt"`
}

// GitHubRelease represents the GitHub API response
type GitHubRelease struct {
	TagName     string        `json:"tag_name"`
	Name        string        `json:"name"`
	Body        string        `json:"body"`
	PublishedAt string        `json:"published_at"`
	Assets      []GitHubAsset `json:"assets"`
}

// GitHubAsset represents a release asset
type GitHubAsset struct {
	Name               string `json:"name"`
	Size               int64  `json:"size"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// GetCurrentVersion returns the current app version
func (s *UpdateService) GetCurrentVersion() string {
	return Version
}

// CheckForUpdates checks GitHub releases for a newer version
func (s *UpdateService) CheckForUpdates() (*UpdateInfo, error) {
	// Disable update checks in dev mode to prevent lock issues and unhelpful prompts
	if Version == "dev" {
		return &UpdateInfo{
			CurrentVersion: Version,
			LatestVersion:  Version,
			HasUpdate:      false,
		}, nil
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", GitHubOwner, GitHubRepo)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "Farmland-App")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch releases: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return &UpdateInfo{
			CurrentVersion: Version,
			LatestVersion:  Version,
			HasUpdate:      false,
		}, nil
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("failed to parse release: %w", err)
	}

	// Find the correct asset for this platform
	var downloadURL string
	var assetSize int64
	var foundAsset GitHubAsset

	// Try multiple naming patterns to be robust
	patterns := s.getAssetPatterns()

	// First pass: try to find an exact match for one of our patterns
	for _, pattern := range patterns {
		for _, asset := range release.Assets {
			if asset.Name == pattern {
				foundAsset = asset
				goto found
			}
		}
	}

	// Second pass: fallback to "contains" if no exact match (useful for versioned filenames)
	for _, pattern := range patterns {
		basePattern := strings.TrimSuffix(pattern, ".exe")
		basePattern = strings.TrimSuffix(basePattern, ".zip")
		basePattern = strings.TrimSuffix(basePattern, ".tar.gz")

		isInstallerPattern := strings.Contains(strings.ToLower(pattern), "installer")

		for _, asset := range release.Assets {
			assetNameLower := strings.ToLower(asset.Name)
			patternLower := strings.ToLower(basePattern)

			// If lookin for a binary, strictly ignore installers.
			// If looking for an installer, strictly ignore non-installers.
			isAssetInstaller := strings.Contains(assetNameLower, "installer")
			if isInstallerPattern != isAssetInstaller {
				continue
			}

			if strings.Contains(assetNameLower, patternLower) {
				foundAsset = asset
				goto found
			}
		}
	}

found:
	if foundAsset.Name != "" {
		downloadURL = foundAsset.BrowserDownloadURL
		assetSize = foundAsset.Size
	}

	info := &UpdateInfo{
		CurrentVersion: Version,
		LatestVersion:  release.TagName,
		HasUpdate:      s.isNewerVersion(release.TagName, Version),
		ReleaseNotes:   release.Body,
		DownloadURL:    downloadURL,
		AssetName:      foundAsset.Name,
		AssetSize:      assetSize,
		PublishedAt:    release.PublishedAt,
	}

	return info, nil
}

// getAssetPatterns returns possible asset names for this platform
func (s *UpdateService) getAssetPatterns() []string {
	switch runtime.GOOS {
	case "windows":
		return []string{
			"farmland-windows-amd64.exe",
			"farmland.exe",
		}
	case "darwin":
		if runtime.GOARCH == "arm64" {
			return []string{"farmland-darwin-arm64.zip", "farmland-macos-arm64.zip"}
		}
		return []string{"farmland-darwin-amd64.zip", "farmland-macos-amd64.zip"}
	case "linux":
		return []string{
			"farmland-linux-amd64.deb",
			"farmland-linux-amd64.rpm",
			"farmland-linux-amd64.tar.gz",
		}
	default:
		return []string{}
	}
}

// isNewerVersion compares semantic versions (v1.0.0 format)
func (s *UpdateService) isNewerVersion(latest, current string) bool {
	// Strip 'v' prefix
	latest = strings.TrimPrefix(latest, "v")
	current = strings.TrimPrefix(current, "v")

	// Handle dev version
	if current == "dev" {
		return true
	}

	// Simple string comparison (works for semantic versions)
	latestParts := strings.Split(latest, ".")
	currentParts := strings.Split(current, ".")

	for i := 0; i < 3; i++ {
		var lp, cp string
		if i < len(latestParts) {
			lp = latestParts[i]
		}
		if i < len(currentParts) {
			cp = currentParts[i]
		}
		if lp > cp {
			return true
		} else if lp < cp {
			return false
		}
	}
	return false
}

// GetDownloadProgress returns current download progress (0-100)
func (s *UpdateService) GetDownloadProgress() float64 {
	return s.downloadProgress
}

// DownloadStatus represents the current download state
type DownloadStatus struct {
	Progress   float64 `json:"progress"`
	IsComplete bool    `json:"isComplete"`
	IsError    bool    `json:"isError"`
	ErrorMsg   string  `json:"errorMsg"`
}

// GetDownloadStatus returns current download status
func (s *UpdateService) GetDownloadStatus() DownloadStatus {
	return DownloadStatus{
		Progress:   s.downloadProgress,
		IsComplete: s.downloadProgress >= 100 && !s.isDownloading,
		IsError:    s.downloadError != "",
		ErrorMsg:   s.downloadError,
	}
}

// StartDownload starts downloading the update asynchronously
func (s *UpdateService) StartDownload(url string) {
	s.downloadProgress = 0
	s.isDownloading = true
	s.downloadError = ""
	s.downloadedFile = ""
	s.latestAssetName = filepath.Base(url)

	go func() {
		defer func() { s.isDownloading = false }()

		resp, err := http.Get(url)
		if err != nil {
			s.downloadError = fmt.Sprintf("failed to download: %v", err)
			return
		}
		defer resp.Body.Close()

		// Create temp file
		tempDir := os.TempDir()
		tempFile := filepath.Join(tempDir, "farmland-update"+s.getExtension(url))

		out, err := os.Create(tempFile)
		if err != nil {
			s.downloadError = fmt.Sprintf("failed to create temp file: %v", err)
			return
		}
		defer out.Close()

		// Download with progress
		totalSize := resp.ContentLength
		var downloaded int64

		buf := make([]byte, 32*1024)
		for {
			n, err := resp.Body.Read(buf)
			if n > 0 {
				_, writeErr := out.Write(buf[:n])
				if writeErr != nil {
					s.downloadError = fmt.Sprintf("write error: %v", writeErr)
					return
				}
				downloaded += int64(n)
				if totalSize > 0 {
					s.downloadProgress = float64(downloaded) / float64(totalSize) * 100
				}
			}
			if err == io.EOF {
				break
			}
			if err != nil {
				s.downloadError = fmt.Sprintf("download error: %v", err)
				return
			}
		}

		s.downloadProgress = 100
		s.downloadedFile = tempFile
	}()
}

// DownloadUpdate downloads the update synchronously (for backwards compatibility)
func (s *UpdateService) DownloadUpdate(url string) (string, error) {
	s.StartDownload(url)

	// Wait for download to complete
	for s.isDownloading {
		// Sleep briefly to avoid busy waiting
		time.Sleep(100 * time.Millisecond)
	}

	if s.downloadError != "" {
		return "", fmt.Errorf("download failed: %s", s.downloadError)
	}

	return s.downloadedFile, nil
}

// getExtension returns the file extension for a given filename
func (s *UpdateService) getExtension(filename string) string {
	if strings.HasSuffix(filename, ".tar.gz") {
		return ".tar.gz"
	}
	return filepath.Ext(filename)
}

// ApplyUpdate replaces the current executable with the downloaded one
func (s *UpdateService) ApplyUpdate() error {
	if s.downloadedFile == "" {
		return fmt.Errorf("no update file found - please download again")
	}

	// Verify update file exists
	if _, err := os.Stat(s.downloadedFile); err != nil {
		return fmt.Errorf("update file is missing or inaccessible: %w", err)
	}

	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("could not determine current application path: %w", err)
	}

	// On Windows: Use rename strategy to bypass file lock
	if runtime.GOOS == "windows" {
		// Use a unique name for the old exe to avoid conflicts
		oldExe := currentExe + "." + time.Now().Format("20060102150405") + ".old"

		// 1. Rename current executable to .old
		if err := os.Rename(currentExe, oldExe); err != nil {
			// If access is denied, try to perform the operation with administrative privileges
			if strings.Contains(err.Error(), "Access is denied") {
				// Use println for simple status output during update
				println("Access denied for rename, attempting elevated update...")

				// Build a PowerShell command to do both the rename and the move
				// We use Start-Process with -Verb RunAs to trigger UAC
				psCmd := fmt.Sprintf(
					"Move-Item -Path '%s' -Destination '%s' -Force; Move-Item -Path '%s' -Destination '%s' -Force; Remove-Item -Path '%s' -Force",
					currentExe, oldExe, s.downloadedFile, currentExe, s.downloadedFile,
				)

				err := exec.Command("powershell", "-Command", "Start-Process", "powershell", "-ArgumentList", fmt.Sprintf("-Command \"%s\"", psCmd), "-Verb", "RunAs", "-Wait").Run()
				if err != nil {
					return fmt.Errorf("failed to perform elevated update: %w (did you decline the UAC prompt?)", err)
				}

				s.downloadedFile = ""
				return nil
			}
			return fmt.Errorf("failed to move current version to %s: %w (check permissions)", filepath.Base(oldExe), err)
		}

		// 2. Copy the new binary to the original path
		if err := s.copyFile(s.downloadedFile, currentExe); err != nil {
			// Try to restore the old one if copy fails
			_ = os.Rename(oldExe, currentExe)

			// If copy failed due to permissions, try elevated
			if strings.Contains(err.Error(), "Access is denied") {
				psCmd := fmt.Sprintf("Move-Item -Path '%s' -Destination '%s' -Force; Remove-Item -Path '%s' -Force", s.downloadedFile, currentExe, s.downloadedFile)
				err := exec.Command("powershell", "-Command", "Start-Process", "powershell", "-ArgumentList", fmt.Sprintf("-Command \"%s\"", psCmd), "-Verb", "RunAs", "-Wait").Run()
				if err == nil {
					s.downloadedFile = ""
					return nil
				}
			}
			return fmt.Errorf("failed to install new binary: %w", err)
		}

		// Success - cleanup
		if s.downloadedFile != "" {
			_ = os.Remove(s.downloadedFile)
		}
		s.downloadedFile = ""
		return nil
	}

	// For Linux/macOS
	if err := s.copyFile(s.downloadedFile, currentExe); err != nil {
		return fmt.Errorf("failed to copy update to %s: %w", currentExe, err)
	}

	_ = os.Chmod(currentExe, 0755)
	if s.downloadedFile != "" {
		_ = os.Remove(s.downloadedFile)
	}
	s.downloadedFile = ""
	return nil
}

// copyFile copies src to dst
func (s *UpdateService) copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source: %w", err)
	}
	defer func() { _ = in.Close() }()

	out, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination: %w", err)
	}
	defer func() { _ = out.Close() }()

	_, err = io.Copy(out, in)
	if err != nil {
		return fmt.Errorf("failed to copy content: %w", err)
	}
	return nil
}

// RestartApp restarts the application
func (s *UpdateService) RestartApp() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	cmd := exec.Command(exe)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return err
	}

	os.Exit(0)
	return nil
}

// GetPlatformInfo returns current OS and architecture
func (s *UpdateService) GetPlatformInfo() map[string]string {
	return map[string]string{
		"os":   runtime.GOOS,
		"arch": runtime.GOARCH,
	}
}

// IsInstalled checks if the app is running from a permanent installation directory
func (s *UpdateService) IsInstalled() bool {
	if runtime.GOOS != "windows" {
		return true // Only handle Windows for now
	}

	exe, err := os.Executable()
	if err != nil {
		return true
	}

	appData := os.Getenv("LOCALAPPDATA")
	if appData == "" {
		return true
	}

	installPath := filepath.Join(appData, "Farmland")
	return strings.HasPrefix(strings.ToLower(exe), strings.ToLower(installPath))
}

// InstallToSystem moves the current executable to a permanent location and creates shortcuts
func (s *UpdateService) InstallToSystem() error {
	if runtime.GOOS != "windows" {
		return nil
	}

	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get current path: %w", err)
	}

	appData := os.Getenv("LOCALAPPDATA")
	if appData == "" {
		return fmt.Errorf("could not find LocalAppData directory")
	}

	installDir := filepath.Join(appData, "Farmland")
	if err := os.MkdirAll(installDir, 0755); err != nil {
		return fmt.Errorf("failed to create install directory: %w", err)
	}

	targetExe := filepath.Join(installDir, "farmland.exe")

	// If already running from the target, nothing to do
	if strings.EqualFold(currentExe, targetExe) {
		return nil
	}

	// 1. Copy self to target
	if err := s.copyFile(currentExe, targetExe); err != nil {
		return fmt.Errorf("failed to copy executable to %s: %w", targetExe, err)
	}

	// 2. Create Desktop Shortcut via PowerShell
	desktop := filepath.Join(os.Getenv("USERPROFILE"), "Desktop", "Farmland.lnk")
	s.createShortcut(targetExe, desktop)

	// 3. Create Start Menu Shortcut
	startMenu := filepath.Join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Farmland.lnk")
	s.createShortcut(targetExe, startMenu)

	// 4. Launch the installed version and exit
	cmd := exec.Command(targetExe)
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to launch installed version: %w", err)
	}

	os.Exit(0)
	return nil
}

// createShortcut uses PowerShell to create a Windows shortcut
func (s *UpdateService) createShortcut(target, shortcutPath string) {
	cmdStr := fmt.Sprintf(
		"$s = New-Object -ComObject WScript.Shell; $g = $s.CreateShortcut('%s'); $g.TargetPath = '%s'; $g.WorkingDirectory = '%s'; $g.Save()",
		shortcutPath, target, filepath.Dir(target),
	)
	_ = exec.Command("powershell", "-Command", cmdStr).Run()
}

// runAsAdmin triggers the Windows UAC prompt to run the given path as administrator
func (s *UpdateService) runAsAdmin(path string) error {
	// Use PowerShell to start the process with 'RunAs' verb (elevation)
	// We wrap the path in single quotes to handle spaces correctly
	cmd := exec.Command("powershell", "-Command",
		fmt.Sprintf("Start-Process -FilePath '%s' -Verb RunAs", path))

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("elevation failed: %w (did you decline the prompt?)", err)
	}
	return nil
}
