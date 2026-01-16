package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ExportService handles data export operations
type ExportService struct {
	ctx context.Context
}

// NewExportService creates a new ExportService
func NewExportService() *ExportService {
	return &ExportService{}
}

// SetContext sets the Wails runtime context
func (s *ExportService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// ExportResult contains information about an export operation
type ExportResult struct {
	Path    string `json:"path"`
	Records int    `json:"records"`
}

// ExportMilkRecordsCSV exports milk records to CSV
func (s *ExportService) ExportMilkRecordsCSV(startDate, endDate string) (*ExportResult, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	timestamp := time.Now().Format("2006-01-02")
	filename := fmt.Sprintf("farmland-milk-records-%s.csv", timestamp)

	savePath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Export Milk Records to CSV",
		DefaultFilename: filename,
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV Files", Pattern: "*.csv"},
		},
	})
	if err != nil {
		return nil, err
	}
	if savePath == "" {
		return nil, nil
	}

	query := `
		SELECT mr.id, a.name, mr.date, mr.morning_liters, mr.evening_liters, mr.total_liters, mr.notes
		FROM milk_records mr
		JOIN animals a ON mr.animal_id = a.id
		WHERE 1=1
	`
	args := []interface{}{}
	if startDate != "" {
		query += " AND mr.date >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND mr.date <= ?"
		args = append(args, endDate)
	}
	query += " ORDER BY mr.date DESC, a.name"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	file, err := os.Create(savePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{"ID", "Animal", "Date", "Morning (L)", "Evening (L)", "Total (L)", "Notes"}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	count := 0
	for rows.Next() {
		var id int64
		var animalName, date, notes interface{}
		var morning, evening, total float64
		if err := rows.Scan(&id, &animalName, &date, &morning, &evening, &total, &notes); err != nil {
			continue
		}
		record := []string{
			fmt.Sprintf("%d", id),
			toString(animalName),
			toString(date),
			fmt.Sprintf("%.2f", morning),
			fmt.Sprintf("%.2f", evening),
			fmt.Sprintf("%.2f", total),
			toString(notes),
		}
		if err := writer.Write(record); err != nil {
			continue
		}
		count++
	}

	return &ExportResult{Path: savePath, Records: count}, nil
}

// ExportFinancesCSV exports financial transactions to CSV
func (s *ExportService) ExportFinancesCSV(startDate, endDate string) (*ExportResult, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	timestamp := time.Now().Format("2006-01-02")
	filename := fmt.Sprintf("farmland-finances-%s.csv", timestamp)

	savePath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Export Financial Records to CSV",
		DefaultFilename: filename,
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV Files", Pattern: "*.csv"},
		},
	})
	if err != nil {
		return nil, err
	}
	if savePath == "" {
		return nil, nil
	}

	query := `SELECT id, date, type, category, amount, description, notes FROM transactions WHERE 1=1`
	args := []interface{}{}
	if startDate != "" {
		query += " AND date >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND date <= ?"
		args = append(args, endDate)
	}
	query += " ORDER BY date DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	file, err := os.Create(savePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{"ID", "Date", "Type", "Category", "Amount (KES)", "Description", "Notes"}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	count := 0
	for rows.Next() {
		var id int64
		var date, txType, category, description, notes interface{}
		var amount float64
		if err := rows.Scan(&id, &date, &txType, &category, &amount, &description, &notes); err != nil {
			continue
		}
		record := []string{
			fmt.Sprintf("%d", id),
			toString(date),
			toString(txType),
			toString(category),
			fmt.Sprintf("%.2f", amount),
			toString(description),
			toString(notes),
		}
		if err := writer.Write(record); err != nil {
			continue
		}
		count++
	}

	return &ExportResult{Path: savePath, Records: count}, nil
}

func (s *ExportService) ExportAnimalsCSV() (*ExportResult, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	// Generate filename
	timestamp := time.Now().Format("2006-01-02")
	filename := fmt.Sprintf("farmland-livestock-inventory-%s.csv", timestamp)

	savePath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Export Comprehensive Livestock Inventory",
		DefaultFilename: filename,
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV Files", Pattern: "*.csv"},
		},
	})
	if err != nil {
		return nil, err
	}
	if savePath == "" {
		return nil, nil // Cancelled
	}

	// Query animals with production and health aggregate metrics
	rows, err := db.Query(`
		SELECT 
			a.id, a.tag_number, a.name, a.type, a.breed, a.date_of_birth, a.gender,
			m.name as mother_name, f.name as father_name, a.status, a.notes, a.created_at,
			(SELECT COUNT(*) FROM milk_records WHERE animal_id = a.id) as milk_count,
			(SELECT COALESCE(SUM(total_liters), 0) FROM milk_records WHERE animal_id = a.id) as milk_total,
			(SELECT MAX(date) FROM vet_records WHERE animal_id = a.id) as last_vet,
			(SELECT COALESCE(SUM(cost), 0) FROM vet_records WHERE animal_id = a.id) as vet_total_cost
		FROM animals a
		LEFT JOIN animals m ON a.mother_id = m.id
		LEFT JOIN animals f ON a.father_id = f.id
		ORDER BY a.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Create file
	file, err := os.Create(savePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write rich header
	header := []string{
		"System ID", "Tag Number", "Name", "Type", "Breed", "Gender", "Date of Birth", "Status",
		"Mother", "Father", "Milk Records Count", "Total Production (Liters)",
		"Last Vet Visit", "Total Vet Cost (KES)", "Notes", "Registry Date",
	}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	count := 0
	for rows.Next() {
		var id int64
		var tagNumber, name, animalType, breed, dob, gender, motherName, fatherName, status, notes, createdAt interface{}
		var milkCount int
		var milkTotal float64
		var lastVet interface{}
		var vetTotal float64

		err := rows.Scan(
			&id, &tagNumber, &name, &animalType, &breed, &dob, &gender,
			&motherName, &fatherName, &status, &notes, &createdAt,
			&milkCount, &milkTotal, &lastVet, &vetTotal,
		)
		if err != nil {
			continue
		}

		record := []string{
			fmt.Sprintf("%d", id),
			toString(tagNumber),
			toString(name),
			toString(animalType),
			toString(breed),
			toString(gender),
			toString(dob),
			toString(status),
			toString(motherName),
			toString(fatherName),
			fmt.Sprintf("%d", milkCount),
			fmt.Sprintf("%.2f", milkTotal),
			toString(lastVet),
			fmt.Sprintf("%.2f", vetTotal),
			toString(notes),
			toString(createdAt),
		}
		if err := writer.Write(record); err != nil {
			continue
		}
		count++
	}

	return &ExportResult{Path: savePath, Records: count}, nil
}

// GetExportDirectory returns the default export directory
func (s *ExportService) GetExportDirectory() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "Documents")
}

// toString converts interface to string safely
func toString(v interface{}) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	case []byte:
		return string(val)
	case time.Time:
		return val.Format("2006-01-02 15:04:05")
	default:
		return fmt.Sprintf("%v", v)
	}
}
