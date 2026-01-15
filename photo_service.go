package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// PhotoService handles photo attachments
type PhotoService struct {
	ctx context.Context
}

// NewPhotoService creates a new PhotoService
func NewPhotoService() *PhotoService {
	return &PhotoService{}
}

// SetContext sets the Wails runtime context
func (s *PhotoService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// UploadPhoto opens a file dialog to select a photo and stores it
func (s *PhotoService) UploadPhoto(entityType string, entityID int64, notes string) (*Photo, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	selectedPath, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title: "Select Photo",
		Filters: []runtime.FileFilter{
			{DisplayName: "Images", Pattern: "*.jpg;*.jpeg;*.png;*.gif;*.webp"},
		},
	})
	if err != nil {
		return nil, err
	}
	if selectedPath == "" {
		return nil, nil // User cancelled
	}

	homeDir, _ := os.UserHomeDir()
	photoDir := filepath.Join(homeDir, ".farmland", "photos")
	if err := os.MkdirAll(photoDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create photo directory: %w", err)
	}

	ext := filepath.Ext(selectedPath)
	filename := fmt.Sprintf("%s_%d_%d%s", entityType, entityID, time.Now().UnixNano(), ext)
	targetPath := filepath.Join(photoDir, filename)

	if err := s.copyFile(selectedPath, targetPath); err != nil {
		return nil, fmt.Errorf("failed to copy photo: %w", err)
	}

	res, err := db.Exec(`
		INSERT INTO photos (entity_type, entity_id, filename, path, notes)
		VALUES (?, ?, ?, ?, ?)
	`, entityType, entityID, filename, targetPath, notes)
	if err != nil {
		return nil, fmt.Errorf("failed to save photo record: %w", err)
	}

	id, _ := res.LastInsertId()

	return &Photo{
		ID:         id,
		EntityType: entityType,
		EntityID:   entityID,
		Filename:   filename,
		Path:       targetPath,
		Notes:      notes,
		CreatedAt:  time.Now(),
	}, nil
}

// GetPhotos returns all photos for an entity
func (s *PhotoService) GetPhotos(entityType string, entityID int64) ([]Photo, error) {
	rows, err := db.Query(`
		SELECT id, entity_type, entity_id, filename, path, notes, created_at
		FROM photos
		WHERE entity_type = ? AND entity_id = ?
		ORDER BY created_at DESC
	`, entityType, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var photos []Photo
	for rows.Next() {
		var p Photo
		var createdAt string
		if err := rows.Scan(&p.ID, &p.EntityType, &p.EntityID, &p.Filename, &p.Path, &p.Notes, &createdAt); err != nil {
			continue
		}
		p.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		photos = append(photos, p)
	}

	return photos, nil
}

// BindPhotos updates photos from a temporary ID to a permanent record ID
func (s *PhotoService) BindPhotos(entityType string, oldID, newID int64) error {
	_, err := db.Exec(`
		UPDATE photos 
		SET entity_id = ? 
		WHERE entity_type = ? AND entity_id = ?
	`, newID, entityType, oldID)
	return err
}

// DeletePhoto deletes a photo record and the file
func (s *PhotoService) DeletePhoto(id int64) error {
	var path string
	err := db.QueryRow("SELECT path FROM photos WHERE id = ?", id).Scan(&path)
	if err != nil {
		return err
	}

	_, err = db.Exec("DELETE FROM photos WHERE id = ?", id)
	if err != nil {
		return err
	}

	_ = os.Remove(path)
	return nil
}

// GetPhotoBase64 returns the base64 encoded data of a photo
func (s *PhotoService) GetPhotoBase64(id int64) (string, error) {
	var path string
	err := db.QueryRow("SELECT path FROM photos WHERE id = ?", id).Scan(&path)
	if err != nil {
		return "", err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}

	mimeType := "image/jpeg"
	ext := filepath.Ext(path)
	switch ext {
	case ".png":
		mimeType = "image/png"
	case ".gif":
		mimeType = "image/gif"
	case ".webp":
		mimeType = "image/webp"
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
}

// copyFile copies a file from src to dst
func (s *PhotoService) copyFile(src, dst string) error {
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
