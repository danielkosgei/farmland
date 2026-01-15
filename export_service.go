package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/jung-kurt/gofpdf"
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

// ExportAnimalsCSV exports all animals to a CSV file
func (s *ExportService) ExportAnimalsCSV() (*ExportResult, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	// Generate filename
	timestamp := time.Now().Format("2006-01-02")
	filename := fmt.Sprintf("farmland-animals-%s.csv", timestamp)

	savePath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Export Animals to CSV",
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

	// Query animals
	rows, err := db.Query(`
		SELECT a.id, a.tag_number, a.name, a.type, a.breed, a.date_of_birth, a.gender,
			   m.name, f.name, a.status, a.notes, a.created_at
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

	// Write header
	header := []string{"ID", "Tag Number", "Name", "Type", "Breed", "Date of Birth", "Gender", "Mother", "Father", "Status", "Notes", "Created At"}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	count := 0
	for rows.Next() {
		var id int64
		var tagNumber, name, animalType, breed, dob, gender, motherName, fatherName, status, notes, createdAt interface{}
		if err := rows.Scan(&id, &tagNumber, &name, &animalType, &breed, &dob, &gender, &motherName, &fatherName, &status, &notes, &createdAt); err != nil {
			continue
		}

		record := []string{
			fmt.Sprintf("%d", id),
			toString(tagNumber),
			toString(name),
			toString(animalType),
			toString(breed),
			toString(dob),
			toString(gender),
			toString(motherName),
			toString(fatherName),
			toString(status),
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

// ExportAnimalsPDF exports all animals to a PDF file
func (s *ExportService) ExportAnimalsPDF() (*ExportResult, error) {
	if s.ctx == nil {
		return nil, fmt.Errorf("context not set")
	}

	timestamp := time.Now().Format("2006-01-02")
	filename := fmt.Sprintf("farmland-animals-%s.pdf", timestamp)

	savePath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		Title:           "Export Animals to PDF",
		DefaultFilename: filename,
		Filters: []runtime.FileFilter{
			{DisplayName: "PDF Files", Pattern: "*.pdf"},
		},
	})
	if err != nil {
		return nil, err
	}
	if savePath == "" {
		return nil, nil // Cancelled
	}

	// Query animals
	rows, err := db.Query(`
		SELECT tag_number, name, type, breed, gender, status
		FROM animals
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Create PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 20)
	pdf.SetTextColor(22, 101, 52) // Dark green (#166534)
	pdf.Cell(0, 15, "Farmland - Animal Inventory")
	pdf.Ln(12)

	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(100, 100, 100)
	pdf.Cell(0, 5, fmt.Sprintf("Generated on: %s", time.Now().Format("Jan 02, 2006 15:04")))
	pdf.Ln(10)

	// Table Header
	pdf.SetFillColor(240, 240, 240)
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(0, 0, 0)
	cols := []float64{30, 40, 30, 30, 25, 30}
	headers := []string{"Tag", "Name", "Type", "Breed", "Gender", "Status"}

	for i, h := range headers {
		pdf.CellFormat(cols[i], 10, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Table Data
	pdf.SetFont("Arial", "", 10)
	count := 0
	for rows.Next() {
		var tag, name, aType, breed, gender, status interface{}
		if err := rows.Scan(&tag, &name, &aType, &breed, &gender, &status); err != nil {
			continue
		}

		pdf.CellFormat(cols[0], 8, toString(tag), "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[1], 8, toString(name), "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[2], 8, toString(aType), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[3], 8, toString(breed), "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[4], 8, toString(gender), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[5], 8, toString(status), "1", 0, "C", false, 0, "")
		pdf.Ln(-1)
		count++
	}

	err = pdf.OutputFileAndClose(savePath)
	if err != nil {
		return nil, err
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
