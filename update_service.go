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

		for _, asset := range release.Assets {
			if strings.Contains(strings.ToLower(asset.Name), strings.ToLower(basePattern)) {
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
			"farmland-windows-amd64-installer.exe",
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
		return fmt.Errorf("no update downloaded")
	}

	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get current executable: %w", err)
	}

	// On Windows, if it's an INSTALLER, we execute it.
	// We check the filename to be sure.
	if runtime.GOOS == "windows" && strings.Contains(strings.ToLower(s.downloadedFile), "installer") {
		// Launch installer as a separate process
		cmd := exec.Command(s.downloadedFile)
		if err := cmd.Start(); err != nil {
			return fmt.Errorf("failed to launch installer: %w", err)
		}
		// The app will be closed by RestartApp (which the UI calls)
		// but we can also just return nil here as the installer will handle replacement
		return nil
	}

	// For Linux/macOS, we need to extract the binary from the archive first.
	// [TODO] Add tar.gz/zip extraction logic here.
	// For now, we'll try to find the binary if it's already extracted or just raw copy if not.

	if err := s.copyFile(s.downloadedFile, currentExe); err != nil {
		return fmt.Errorf("failed to install update: %w", err)
	}

	_ = os.Chmod(currentExe, 0755)
	_ = os.Remove(s.downloadedFile)

	s.downloadedFile = ""
	return nil
}

// copyFile copies src to dst
func (s *UpdateService) copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
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
