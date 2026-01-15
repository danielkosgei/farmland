package main

import (
	"database/sql"
	"time"
)

// BreedingService handles breeding and pregnancy-related operations
type BreedingService struct{}

// NewBreedingService creates a new BreedingService
func NewBreedingService() *BreedingService {
	return &BreedingService{}
}

// GetAllBreedingRecords returns all breeding records
func (s *BreedingService) GetAllBreedingRecords() ([]BreedingRecord, error) {
	rows, err := db.Query(`
		SELECT br.id, br.female_id, f.name, br.male_id, m.name, br.breeding_date, 
			   br.breeding_method, br.sire_source, br.expected_due_date, br.actual_birth_date,
			   br.offspring_id, o.name, br.pregnancy_status, br.notes, br.created_at
		FROM breeding_records br
		LEFT JOIN animals f ON br.female_id = f.id
		LEFT JOIN animals m ON br.male_id = m.id
		LEFT JOIN animals o ON br.offspring_id = o.id
		ORDER BY br.breeding_date DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []BreedingRecord
	for rows.Next() {
		var r BreedingRecord
		var maleID, offspringID sql.NullInt64
		var maleName, offspringName, sireSource, expectedDue, actualBirth, notes sql.NullString
		err := rows.Scan(&r.ID, &r.FemaleID, &r.FemaleName, &maleID, &maleName,
			&r.BreedingDate, &r.BreedingMethod, &sireSource, &expectedDue, &actualBirth,
			&offspringID, &offspringName, &r.PregnancyStatus, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		if maleID.Valid {
			r.MaleID = &maleID.Int64
		}
		if maleName.Valid {
			r.MaleName = maleName.String
		}
		if offspringID.Valid {
			r.OffspringID = &offspringID.Int64
		}
		if offspringName.Valid {
			r.OffspringName = offspringName.String
		}
		r.SireSource = sireSource.String
		r.ExpectedDueDate = expectedDue.String
		r.ActualBirthDate = actualBirth.String
		r.Notes = notes.String
		records = append(records, r)
	}
	return records, nil
}

// GetBreedingRecord returns a single breeding record
func (s *BreedingService) GetBreedingRecord(id int64) (*BreedingRecord, error) {
	var r BreedingRecord
	var maleID, offspringID sql.NullInt64
	var maleName, offspringName, sireSource, expectedDue, actualBirth, notes sql.NullString
	err := db.QueryRow(`
		SELECT br.id, br.female_id, f.name, br.male_id, m.name, br.breeding_date, 
			   br.breeding_method, br.sire_source, br.expected_due_date, br.actual_birth_date,
			   br.offspring_id, o.name, br.pregnancy_status, br.notes, br.created_at
		FROM breeding_records br
		LEFT JOIN animals f ON br.female_id = f.id
		LEFT JOIN animals m ON br.male_id = m.id
		LEFT JOIN animals o ON br.offspring_id = o.id
		WHERE br.id = ?
	`, id).Scan(&r.ID, &r.FemaleID, &r.FemaleName, &maleID, &maleName,
		&r.BreedingDate, &r.BreedingMethod, &sireSource, &expectedDue, &actualBirth,
		&offspringID, &offspringName, &r.PregnancyStatus, &notes, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	if maleID.Valid {
		r.MaleID = &maleID.Int64
	}
	if maleName.Valid {
		r.MaleName = maleName.String
	}
	if offspringID.Valid {
		r.OffspringID = &offspringID.Int64
	}
	if offspringName.Valid {
		r.OffspringName = offspringName.String
	}
	r.SireSource = sireSource.String
	r.ExpectedDueDate = expectedDue.String
	r.ActualBirthDate = actualBirth.String
	r.Notes = notes.String
	return &r, nil
}

// GetBreedingHistoryForAnimal returns breeding records for an animal (as mother or father)
func (s *BreedingService) GetBreedingHistoryForAnimal(animalID int64) ([]BreedingRecord, error) {
	rows, err := db.Query(`
		SELECT br.id, br.female_id, f.name, br.male_id, m.name, br.breeding_date, 
			   br.breeding_method, br.sire_source, br.expected_due_date, br.actual_birth_date,
			   br.offspring_id, o.name, br.pregnancy_status, br.notes, br.created_at
		FROM breeding_records br
		LEFT JOIN animals f ON br.female_id = f.id
		LEFT JOIN animals m ON br.male_id = m.id
		LEFT JOIN animals o ON br.offspring_id = o.id
		WHERE br.female_id = ? OR br.male_id = ?
		ORDER BY br.breeding_date DESC
	`, animalID, animalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []BreedingRecord
	for rows.Next() {
		var r BreedingRecord
		var maleID, offspringID sql.NullInt64
		var maleName, offspringName, sireSource, expectedDue, actualBirth, notes sql.NullString
		err := rows.Scan(&r.ID, &r.FemaleID, &r.FemaleName, &maleID, &maleName,
			&r.BreedingDate, &r.BreedingMethod, &sireSource, &expectedDue, &actualBirth,
			&offspringID, &offspringName, &r.PregnancyStatus, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		if maleID.Valid {
			r.MaleID = &maleID.Int64
		}
		if maleName.Valid {
			r.MaleName = maleName.String
		}
		if offspringID.Valid {
			r.OffspringID = &offspringID.Int64
		}
		if offspringName.Valid {
			r.OffspringName = offspringName.String
		}
		r.SireSource = sireSource.String
		r.ExpectedDueDate = expectedDue.String
		r.ActualBirthDate = actualBirth.String
		r.Notes = notes.String
		records = append(records, r)
	}
	return records, nil
}

// AddBreedingRecord adds a new breeding record
func (s *BreedingService) AddBreedingRecord(record BreedingRecord) (int64, error) {
	// Calculate expected due date if not provided (280 days for cows)
	if record.ExpectedDueDate == "" && record.BreedingDate != "" {
		breedingDate, err := time.Parse("2006-01-02", record.BreedingDate)
		if err == nil {
			record.ExpectedDueDate = breedingDate.AddDate(0, 0, 280).Format("2006-01-02")
		}
	}

	result, err := db.Exec(`
		INSERT INTO breeding_records (female_id, male_id, breeding_date, breeding_method, 
			sire_source, expected_due_date, actual_birth_date, offspring_id, pregnancy_status, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, record.FemaleID, record.MaleID, record.BreedingDate, record.BreedingMethod,
		record.SireSource, record.ExpectedDueDate, record.ActualBirthDate,
		record.OffspringID, record.PregnancyStatus, record.Notes)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateBreedingRecord updates an existing breeding record
func (s *BreedingService) UpdateBreedingRecord(record BreedingRecord) error {
	_, err := db.Exec(`
		UPDATE breeding_records SET female_id = ?, male_id = ?, breeding_date = ?, 
			breeding_method = ?, sire_source = ?, expected_due_date = ?, actual_birth_date = ?, 
			offspring_id = ?, pregnancy_status = ?, notes = ?
		WHERE id = ?
	`, record.FemaleID, record.MaleID, record.BreedingDate, record.BreedingMethod,
		record.SireSource, record.ExpectedDueDate, record.ActualBirthDate,
		record.OffspringID, record.PregnancyStatus, record.Notes, record.ID)
	return err
}

// DeleteBreedingRecord deletes a breeding record
func (s *BreedingService) DeleteBreedingRecord(id int64) error {
	_, err := db.Exec(`DELETE FROM breeding_records WHERE id = ?`, id)
	return err
}

// GetPregnantAnimals returns animals with pending/confirmed pregnancies
func (s *BreedingService) GetPregnantAnimals() ([]BreedingRecord, error) {
	rows, err := db.Query(`
		SELECT br.id, br.female_id, f.name, br.male_id, m.name, br.breeding_date, 
			   br.breeding_method, br.sire_source, br.expected_due_date, br.actual_birth_date,
			   br.offspring_id, o.name, br.pregnancy_status, br.notes, br.created_at
		FROM breeding_records br
		LEFT JOIN animals f ON br.female_id = f.id
		LEFT JOIN animals m ON br.male_id = m.id
		LEFT JOIN animals o ON br.offspring_id = o.id
		WHERE br.pregnancy_status IN ('pending', 'confirmed')
		ORDER BY br.expected_due_date ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []BreedingRecord
	for rows.Next() {
		var r BreedingRecord
		var maleID, offspringID sql.NullInt64
		var maleName, offspringName, sireSource, expectedDue, actualBirth, notes sql.NullString
		err := rows.Scan(&r.ID, &r.FemaleID, &r.FemaleName, &maleID, &maleName,
			&r.BreedingDate, &r.BreedingMethod, &sireSource, &expectedDue, &actualBirth,
			&offspringID, &offspringName, &r.PregnancyStatus, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		if maleID.Valid {
			r.MaleID = &maleID.Int64
		}
		if maleName.Valid {
			r.MaleName = maleName.String
		}
		if offspringID.Valid {
			r.OffspringID = &offspringID.Int64
		}
		if offspringName.Valid {
			r.OffspringName = offspringName.String
		}
		r.SireSource = sireSource.String
		r.ExpectedDueDate = expectedDue.String
		r.ActualBirthDate = actualBirth.String
		r.Notes = notes.String
		records = append(records, r)
	}
	return records, nil
}

// RecordBirth links a calf to a breeding record and updates pregnancy status
func (s *BreedingService) RecordBirth(breedingID, offspringID int64, birthDate string) error {
	// Update breeding record
	_, err := db.Exec(`
		UPDATE breeding_records 
		SET offspring_id = ?, actual_birth_date = ?, pregnancy_status = 'delivered'
		WHERE id = ?
	`, offspringID, birthDate, breedingID)
	if err != nil {
		return err
	}

	// Get breeding record to set parent IDs on offspring
	var femaleID, maleID sql.NullInt64
	err = db.QueryRow(`SELECT female_id, male_id FROM breeding_records WHERE id = ?`, breedingID).Scan(&femaleID, &maleID)
	if err != nil {
		return err
	}

	// Update offspring's parent references
	_, err = db.Exec(`UPDATE animals SET mother_id = ?, father_id = ? WHERE id = ?`,
		femaleID, maleID, offspringID)
	return err
}

// UpdatePregnancyStatus updates the status of a breeding record
func (s *BreedingService) UpdatePregnancyStatus(id int64, status string) error {
	_, err := db.Exec(`UPDATE breeding_records SET pregnancy_status = ? WHERE id = ?`, status, id)
	return err
}
