package main

import (
	"database/sql"
	"fmt"
)

// HealthService handles veterinary/health-related operations
type HealthService struct{}

// NewHealthService creates a new HealthService
func NewHealthService() *HealthService {
	return &HealthService{}
}

// GetVetRecords returns vet records, optionally filtered by animal
func (s *HealthService) GetVetRecords(animalId int64) ([]VetRecord, error) {
	query := `
		SELECT vr.id, vr.animal_id, a.name, vr.date, vr.record_type, vr.description, vr.diagnosis, 
			   vr.treatment, vr.medicine, vr.dosage, vr.vet_name, vr.cost, vr.next_due_date, vr.notes, vr.created_at
		FROM vet_records vr
		JOIN animals a ON vr.animal_id = a.id
	`
	args := []interface{}{}

	if animalId > 0 {
		query += " WHERE vr.animal_id = ?"
		args = append(args, animalId)
	}
	query += " ORDER BY vr.date DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []VetRecord
	for rows.Next() {
		var r VetRecord
		var description, diagnosis, treatment, medicine, dosage, vetName, nextDueDate, notes sql.NullString
		err := rows.Scan(&r.ID, &r.AnimalID, &r.AnimalName, &r.Date, &r.RecordType, &description, &diagnosis,
			&treatment, &medicine, &dosage, &vetName, &r.Cost, &nextDueDate, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		r.Description = description.String
		r.Diagnosis = diagnosis.String
		r.Treatment = treatment.String
		r.Medicine = medicine.String
		r.Dosage = dosage.String
		r.VetName = vetName.String
		r.NextDueDate = nextDueDate.String
		r.Notes = notes.String
		records = append(records, r)
	}
	return records, nil
}

// AddVetRecord adds a new vet record
func (s *HealthService) AddVetRecord(record VetRecord) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO vet_records (animal_id, date, record_type, description, diagnosis, treatment, medicine, dosage, vet_name, cost, next_due_date, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, record.AnimalID, record.Date, record.RecordType, record.Description, record.Diagnosis, record.Treatment,
		record.Medicine, record.Dosage, record.VetName, record.Cost, record.NextDueDate, record.Notes)
	if err != nil {
		return 0, err
	}

	id, _ := result.LastInsertId()
	// Automatically record in finances if there's a cost
	if record.Cost > 0 {
		_ = addTransactionInternal(record.Date, "expense", "veterinary",
			fmt.Sprintf("Vet: %s for Animal #%d", record.RecordType, record.AnimalID),
			record.Cost, fmt.Sprintf("vet_record:%d", id))
	}

	return id, nil
}

// UpdateVetRecord updates an existing vet record
func (s *HealthService) UpdateVetRecord(record VetRecord) error {
	_, err := db.Exec(`
		UPDATE vet_records SET animal_id = ?, date = ?, record_type = ?, description = ?, diagnosis = ?, 
			treatment = ?, medicine = ?, dosage = ?, vet_name = ?, cost = ?, next_due_date = ?, notes = ?
		WHERE id = ?
	`, record.AnimalID, record.Date, record.RecordType, record.Description, record.Diagnosis, record.Treatment,
		record.Medicine, record.Dosage, record.VetName, record.Cost, record.NextDueDate, record.Notes, record.ID)
	return err
}

// DeleteVetRecord deletes a vet record
func (s *HealthService) DeleteVetRecord(id int64) error {
	_, err := db.Exec(`DELETE FROM vet_records WHERE id = ?`, id)
	return err
}

// GetUpcomingVaccinations returns records with upcoming due dates
func (s *HealthService) GetUpcomingVaccinations() ([]VetRecord, error) {
	rows, err := db.Query(`
		SELECT vr.id, vr.animal_id, a.name, vr.date, vr.record_type, vr.description, vr.diagnosis, 
			   vr.treatment, vr.medicine, vr.dosage, vr.vet_name, vr.cost, vr.next_due_date, vr.notes, vr.created_at
		FROM vet_records vr
		JOIN animals a ON vr.animal_id = a.id
		WHERE vr.next_due_date IS NOT NULL AND vr.next_due_date != '' AND vr.next_due_date >= date('now')
		ORDER BY vr.next_due_date ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []VetRecord
	for rows.Next() {
		var r VetRecord
		var description, diagnosis, treatment, medicine, dosage, vetName, nextDueDate, notes sql.NullString
		err := rows.Scan(&r.ID, &r.AnimalID, &r.AnimalName, &r.Date, &r.RecordType, &description, &diagnosis,
			&treatment, &medicine, &dosage, &vetName, &r.Cost, &nextDueDate, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		r.Description = description.String
		r.Diagnosis = diagnosis.String
		r.Treatment = treatment.String
		r.Medicine = medicine.String
		r.Dosage = dosage.String
		r.VetName = vetName.String
		r.NextDueDate = nextDueDate.String
		r.Notes = notes.String
		records = append(records, r)
	}
	return records, nil
}

// GetPendingVetVisitsCount returns count of upcoming vet visits
func (s *HealthService) GetPendingVetVisitsCount() (int, error) {
	var count int
	err := db.QueryRow(`
		SELECT COUNT(*) FROM vet_records 
		WHERE next_due_date IS NOT NULL AND next_due_date != '' AND next_due_date >= date('now') AND next_due_date <= date('now', '+30 days')
	`).Scan(&count)
	return count, err
}

// GetRecordTypes returns available vet record types
func (s *HealthService) GetRecordTypes() []string {
	return []string{
		"treatment",
		"vaccination",
		"checkup",
		"deworming",
		"artificial_insemination",
		"pregnancy_check",
		"hoof_trimming",
		"other",
	}
}

// GetCommonMedicines returns common medicines/vaccines
func (s *HealthService) GetCommonMedicines() []string {
	return []string{
		"Foot and Mouth Disease Vaccine",
		"East Coast Fever Vaccine",
		"Lumpy Skin Disease Vaccine",
		"Anthrax Vaccine",
		"Blackquarter Vaccine",
		"Brucellosis Vaccine",
		"Albendazole (Dewormer)",
		"Ivermectin",
		"Oxytetracycline",
		"Penicillin",
		"Multivitamins",
		"Calcium Borogluconate",
		"Magnesium Sulphate",
	}
}
