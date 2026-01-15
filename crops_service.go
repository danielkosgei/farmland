package main

import (
	"database/sql"
)

// CropsService handles field and crop-related operations
type CropsService struct{}

// NewCropsService creates a new CropsService
func NewCropsService() *CropsService {
	return &CropsService{}
}

// GetAllFields returns all fields
func (s *CropsService) GetAllFields() ([]Field, error) {
	rows, err := db.Query(`
		SELECT id, name, size_acres, location, soil_type, current_crop, status, notes, created_at, updated_at
		FROM fields ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fields []Field
	for rows.Next() {
		var f Field
		var location, soilType, currentCrop, notes sql.NullString
		var sizeAcres sql.NullFloat64
		err := rows.Scan(&f.ID, &f.Name, &sizeAcres, &location, &soilType, &currentCrop, &f.Status, &notes, &f.CreatedAt, &f.UpdatedAt)
		if err != nil {
			return nil, err
		}
		f.SizeAcres = sizeAcres.Float64
		f.Location = location.String
		f.SoilType = soilType.String
		f.CurrentCrop = currentCrop.String
		f.Notes = notes.String
		fields = append(fields, f)
	}
	return fields, nil
}

// GetField returns a single field by ID
func (s *CropsService) GetField(id int64) (*Field, error) {
	var f Field
	var location, soilType, currentCrop, notes sql.NullString
	var sizeAcres sql.NullFloat64
	err := db.QueryRow(`
		SELECT id, name, size_acres, location, soil_type, current_crop, status, notes, created_at, updated_at
		FROM fields WHERE id = ?
	`, id).Scan(&f.ID, &f.Name, &sizeAcres, &location, &soilType, &currentCrop, &f.Status, &notes, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	f.SizeAcres = sizeAcres.Float64
	f.Location = location.String
	f.SoilType = soilType.String
	f.CurrentCrop = currentCrop.String
	f.Notes = notes.String
	return &f, nil
}

// AddField adds a new field
func (s *CropsService) AddField(field Field) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO fields (name, size_acres, location, soil_type, current_crop, status, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, field.Name, field.SizeAcres, field.Location, field.SoilType, field.CurrentCrop, field.Status, field.Notes)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateField updates an existing field
func (s *CropsService) UpdateField(field Field) error {
	_, err := db.Exec(`
		UPDATE fields SET name = ?, size_acres = ?, location = ?, soil_type = ?, current_crop = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, field.Name, field.SizeAcres, field.Location, field.SoilType, field.CurrentCrop, field.Status, field.Notes, field.ID)
	return err
}

// DeleteField deletes a field
func (s *CropsService) DeleteField(id int64) error {
	_, err := db.Exec(`DELETE FROM fields WHERE id = ?`, id)
	return err
}

// GetCropRecords returns crop records for a field or all if fieldId is 0
func (s *CropsService) GetCropRecords(fieldId int64) ([]CropRecord, error) {
	query := `
		SELECT cr.id, cr.field_id, f.name, cr.crop_type, cr.variety, cr.planting_date, cr.expected_harvest, 
			   cr.actual_harvest, cr.seed_cost, cr.fertilizer_cost, cr.labor_cost, cr.yield_kg, cr.yield_value, cr.status, cr.notes, cr.created_at
		FROM crop_records cr
		JOIN fields f ON cr.field_id = f.id
	`
	args := []interface{}{}

	if fieldId > 0 {
		query += " WHERE cr.field_id = ?"
		args = append(args, fieldId)
	}
	query += " ORDER BY cr.planting_date DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []CropRecord
	for rows.Next() {
		var r CropRecord
		var variety, plantingDate, expectedHarvest, actualHarvest, notes sql.NullString
		err := rows.Scan(&r.ID, &r.FieldID, &r.FieldName, &r.CropType, &variety, &plantingDate, &expectedHarvest,
			&actualHarvest, &r.SeedCost, &r.FertilizerCost, &r.LaborCost, &r.YieldKg, &r.YieldValue, &r.Status, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		r.Variety = variety.String
		r.PlantingDate = plantingDate.String
		r.ExpectedHarvest = expectedHarvest.String
		r.ActualHarvest = actualHarvest.String
		r.Notes = notes.String
		records = append(records, r)
	}
	return records, nil
}

// AddCropRecord adds a new crop record
func (s *CropsService) AddCropRecord(record CropRecord) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO crop_records (field_id, crop_type, variety, planting_date, expected_harvest, actual_harvest, 
			seed_cost, fertilizer_cost, labor_cost, yield_kg, yield_value, status, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, record.FieldID, record.CropType, record.Variety, record.PlantingDate, record.ExpectedHarvest, record.ActualHarvest,
		record.SeedCost, record.FertilizerCost, record.LaborCost, record.YieldKg, record.YieldValue, record.Status, record.Notes)
	if err != nil {
		return 0, err
	}

	// Update field's current crop and status
	if record.Status == "planted" || record.Status == "growing" {
		_, _ = db.Exec(`UPDATE fields SET current_crop = ?, status = ? WHERE id = ?`, record.CropType, record.Status, record.FieldID)
	}

	return result.LastInsertId()
}

// UpdateCropRecord updates an existing crop record
func (s *CropsService) UpdateCropRecord(record CropRecord) error {
	_, err := db.Exec(`
		UPDATE crop_records SET field_id = ?, crop_type = ?, variety = ?, planting_date = ?, expected_harvest = ?, 
			actual_harvest = ?, seed_cost = ?, fertilizer_cost = ?, labor_cost = ?, yield_kg = ?, yield_value = ?, status = ?, notes = ?
		WHERE id = ?
	`, record.FieldID, record.CropType, record.Variety, record.PlantingDate, record.ExpectedHarvest, record.ActualHarvest,
		record.SeedCost, record.FertilizerCost, record.LaborCost, record.YieldKg, record.YieldValue, record.Status, record.Notes, record.ID)
	return err
}

// DeleteCropRecord deletes a crop record
func (s *CropsService) DeleteCropRecord(id int64) error {
	_, err := db.Exec(`DELETE FROM crop_records WHERE id = ?`, id)
	return err
}

// GetActiveCropsCount returns count of fields with active crops
func (s *CropsService) GetActiveCropsCount() (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM fields WHERE status IN ('planted', 'growing', 'ready_harvest')`).Scan(&count)
	return count, err
}

// GetTotalFieldsAcres returns total acres of all fields
func (s *CropsService) GetTotalFieldsAcres() (float64, error) {
	var total sql.NullFloat64
	err := db.QueryRow(`SELECT SUM(size_acres) FROM fields`).Scan(&total)
	return total.Float64, err
}

// GetKenyanCropTypes returns common Kenyan crops for dropdown
func (s *CropsService) GetKenyanCropTypes() []string {
	return []string{
		"Maize",
		"Beans",
		"Sukuma Wiki (Kale)",
		"Spinach",
		"Cabbage",
		"Tomatoes",
		"Onions",
		"Potatoes",
		"Sweet Potatoes",
		"Cassava",
		"Sorghum",
		"Millet",
		"Groundnuts",
		"Cowpeas",
		"Green Grams",
		"Pigeon Peas",
		"Bananas",
		"Napier Grass",
		"Rhodes Grass",
		"Lucerne",
	}
}
