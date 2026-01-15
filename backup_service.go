package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// BackupService handles database backup and restore operations
type BackupService struct {
	ctx context.Context
}

// NewBackupService creates a new BackupService
func NewBackupService() *BackupService {
	return &BackupService{}
}

// SetContext sets the Wails runtime context
func (s *BackupService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// BackupInfo contains information about a backup
type BackupInfo struct {
	Path      string `json:"path"`
	Size      int64  `json:"size"`
	Timestamp string `json:"timestamp"`
}

// CreateBackup creates a backup of the database to a user-selected location
func (s *BackupService) CreateBackup() (*BackupInfo, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	// Get source database path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	dbPath := filepath.Join(homeDir, ".farmland", "farmland.db")

	// Check if database exists
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("database file not found")
	}

	// Generate default filename with timestamp
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	defaultName := fmt.Sprintf("farmland-backup-%s.db", timestamp)

	// Open save dialog
	savePath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Save Database Backup",
		DefaultFilename: defaultName,
		Filters: []runtime.FileFilter{
			{DisplayName: "SQLite Database", Pattern: "*.db"},
			{DisplayName: "All Files", Pattern: "*.*"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open save dialog: %w", err)
	}
	if savePath == "" {
		return nil, nil // User cancelled
	}

	// Copy database to backup location
	if err := copyFile(dbPath, savePath); err != nil {
		return nil, fmt.Errorf("failed to create backup: %w", err)
	}

	// Get file info
	info, err := os.Stat(savePath)
	if err != nil {
		return nil, err
	}

	return &BackupInfo{
		Path:      savePath,
		Size:      info.Size(),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// RestoreBackup restores the database from a user-selected backup file
func (s *BackupService) RestoreBackup() (*BackupInfo, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	// Open file dialog to select backup
	openPath, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title: "Select Backup File to Restore",
		Filters: []runtime.FileFilter{
			{DisplayName: "SQLite Database", Pattern: "*.db"},
			{DisplayName: "All Files", Pattern: "*.*"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open file dialog: %w", err)
	}
	if openPath == "" {
		return nil, nil // User cancelled
	}

	// Validate backup file
	info, err := os.Stat(openPath)
	if err != nil {
		return nil, fmt.Errorf("invalid backup file: %w", err)
	}

	// Get database path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}
	dbPath := filepath.Join(homeDir, ".farmland", "farmland.db")

	// Create backup of current database before restore
	if _, err := os.Stat(dbPath); err == nil {
		backupPath := dbPath + ".pre-restore"
		_ = copyFile(dbPath, backupPath)
	}

	// Close current database connection
	if db != nil {
		_ = db.Close()
	}

	// Copy backup to database location
	if err := copyFile(openPath, dbPath); err != nil {
		return nil, fmt.Errorf("failed to restore backup: %w", err)
	}

	// Reinitialize database
	if err := InitDatabase(); err != nil {
		return nil, fmt.Errorf("failed to reinitialize database: %w", err)
	}

	return &BackupInfo{
		Path:      openPath,
		Size:      info.Size(),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetDatabaseInfo returns information about the current database
func (s *BackupService) GetDatabaseInfo() (*BackupInfo, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	dbPath := filepath.Join(homeDir, ".farmland", "farmland.db")

	info, err := os.Stat(dbPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	return &BackupInfo{
		Path:      dbPath,
		Size:      info.Size(),
		Timestamp: info.ModTime().Format(time.RFC3339),
	}, nil
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
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
