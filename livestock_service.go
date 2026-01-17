package main

import (
	"database/sql"
	"fmt"
	"time"
)

// LivestockService handles animal and milk-related operations
type LivestockService struct{}

// NewLivestockService creates a new LivestockService
func NewLivestockService() *LivestockService {
	return &LivestockService{}
}

// GetAllAnimals returns all animals
func (s *LivestockService) GetAllAnimals() ([]Animal, error) {
	rows, err := db.Query(`
		SELECT a.id, a.tag_number, a.name, a.type, a.breed, a.date_of_birth, a.gender, 
			   a.mother_id, m.name, a.father_id, f.name,
			   a.status, a.notes, a.created_at, a.updated_at
		FROM animals a
		LEFT JOIN animals m ON a.mother_id = m.id
		LEFT JOIN animals f ON a.father_id = f.id
		ORDER BY a.date_of_birth ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var animals []Animal
	for rows.Next() {
		var a Animal
		var tagNumber, breed, dateOfBirth, gender, notes sql.NullString
		var motherID, fatherID sql.NullInt64
		var motherName, fatherName sql.NullString
		err := rows.Scan(&a.ID, &tagNumber, &a.Name, &a.Type, &breed, &dateOfBirth, &gender,
			&motherID, &motherName, &fatherID, &fatherName,
			&a.Status, &notes, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		a.TagNumber = tagNumber.String
		a.Breed = breed.String
		a.DateOfBirth = dateOfBirth.String
		a.Gender = gender.String
		a.Notes = notes.String
		if motherID.Valid {
			a.MotherID = &motherID.Int64
		}
		if fatherID.Valid {
			a.FatherID = &fatherID.Int64
		}
		a.MotherName = motherName.String
		a.FatherName = fatherName.String
		animals = append(animals, a)
	}
	return animals, nil
}

// GetAnimal returns a single animal by ID with parent info
func (s *LivestockService) GetAnimal(id int64) (*Animal, error) {
	var a Animal
	var tagNumber, breed, dateOfBirth, gender, notes sql.NullString
	var motherID, fatherID sql.NullInt64
	var motherName, fatherName sql.NullString
	err := db.QueryRow(`
		SELECT a.id, a.tag_number, a.name, a.type, a.breed, a.date_of_birth, a.gender,
			   a.mother_id, m.name, a.father_id, f.name,
			   a.status, a.notes, a.created_at, a.updated_at
		FROM animals a
		LEFT JOIN animals m ON a.mother_id = m.id
		LEFT JOIN animals f ON a.father_id = f.id
		WHERE a.id = ?
	`, id).Scan(&a.ID, &tagNumber, &a.Name, &a.Type, &breed, &dateOfBirth, &gender,
		&motherID, &motherName, &fatherID, &fatherName,
		&a.Status, &notes, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	a.TagNumber = tagNumber.String
	a.Breed = breed.String
	a.DateOfBirth = dateOfBirth.String
	a.Gender = gender.String
	a.Notes = notes.String
	if motherID.Valid {
		a.MotherID = &motherID.Int64
	}
	if fatherID.Valid {
		a.FatherID = &fatherID.Int64
	}
	a.MotherName = motherName.String
	a.FatherName = fatherName.String
	return &a, nil
}

// AddAnimal adds a new animal
func (s *LivestockService) AddAnimal(animal Animal) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO animals (tag_number, name, type, breed, date_of_birth, gender, mother_id, father_id, status, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, animal.TagNumber, animal.Name, animal.Type, animal.Breed, animal.DateOfBirth, animal.Gender,
		animal.MotherID, animal.FatherID, animal.Status, animal.Notes)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateAnimal updates an existing animal
func (s *LivestockService) UpdateAnimal(animal Animal) error {
	_, err := db.Exec(`
		UPDATE animals SET tag_number = ?, name = ?, type = ?, breed = ?, date_of_birth = ?, 
			gender = ?, mother_id = ?, father_id = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, animal.TagNumber, animal.Name, animal.Type, animal.Breed, animal.DateOfBirth,
		animal.Gender, animal.MotherID, animal.FatherID, animal.Status, animal.Notes, animal.ID)
	return err
}

// DeleteAnimal deletes an animal
func (s *LivestockService) DeleteAnimal(id int64) error {
	_, err := db.Exec(`DELETE FROM animals WHERE id = ?`, id)
	return err
}

// GetOffspring returns all children of an animal
func (s *LivestockService) GetOffspring(parentID int64) ([]Animal, error) {
	rows, err := db.Query(`
		SELECT a.id, a.tag_number, a.name, a.type, a.breed, a.date_of_birth, a.gender,
			   a.mother_id, m.name, a.father_id, f.name,
			   a.status, a.notes, a.created_at, a.updated_at
		FROM animals a
		LEFT JOIN animals m ON a.mother_id = m.id
		LEFT JOIN animals f ON a.father_id = f.id
		WHERE a.mother_id = ? OR a.father_id = ?
		ORDER BY a.date_of_birth DESC
	`, parentID, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var animals []Animal
	for rows.Next() {
		var a Animal
		var tagNumber, breed, dateOfBirth, gender, notes sql.NullString
		var motherID, fatherID sql.NullInt64
		var motherName, fatherName sql.NullString
		err := rows.Scan(&a.ID, &tagNumber, &a.Name, &a.Type, &breed, &dateOfBirth, &gender,
			&motherID, &motherName, &fatherID, &fatherName,
			&a.Status, &notes, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		a.TagNumber = tagNumber.String
		a.Breed = breed.String
		a.DateOfBirth = dateOfBirth.String
		a.Gender = gender.String
		a.Notes = notes.String
		if motherID.Valid {
			a.MotherID = &motherID.Int64
		}
		if fatherID.Valid {
			a.FatherID = &fatherID.Int64
		}
		a.MotherName = motherName.String
		a.FatherName = fatherName.String
		animals = append(animals, a)
	}
	return animals, nil
}

// GetFemaleAnimals returns female animals for breeding selection
func (s *LivestockService) GetFemaleAnimals() ([]Animal, error) {
	rows, err := db.Query(`
		SELECT id, tag_number, name, type, breed, date_of_birth, gender, status, notes, created_at, updated_at
		FROM animals WHERE gender = 'female' AND status = 'active'
		ORDER BY date_of_birth ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var animals []Animal
	for rows.Next() {
		var a Animal
		var tagNumber, breed, dateOfBirth, gender, notes sql.NullString
		err := rows.Scan(&a.ID, &tagNumber, &a.Name, &a.Type, &breed, &dateOfBirth, &gender, &a.Status, &notes, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		a.TagNumber = tagNumber.String
		a.Breed = breed.String
		a.DateOfBirth = dateOfBirth.String
		a.Gender = gender.String
		a.Notes = notes.String
		animals = append(animals, a)
	}
	return animals, nil
}

// GetMaleAnimals returns male animals for breeding selection
func (s *LivestockService) GetMaleAnimals() ([]Animal, error) {
	rows, err := db.Query(`
		SELECT id, tag_number, name, type, breed, date_of_birth, gender, status, notes, created_at, updated_at
		FROM animals WHERE gender = 'male' AND status = 'active'
		ORDER BY date_of_birth ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var animals []Animal
	for rows.Next() {
		var a Animal
		var tagNumber, breed, dateOfBirth, gender, notes sql.NullString
		err := rows.Scan(&a.ID, &tagNumber, &a.Name, &a.Type, &breed, &dateOfBirth, &gender, &a.Status, &notes, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		a.TagNumber = tagNumber.String
		a.Breed = breed.String
		a.DateOfBirth = dateOfBirth.String
		a.Gender = gender.String
		a.Notes = notes.String
		animals = append(animals, a)
	}
	return animals, nil
}

// GetMilkRecords returns milk records for an animal or all if animalId is 0
func (s *LivestockService) GetMilkRecords(animalId int64, startDate, endDate string) ([]MilkRecord, error) {
	query := `
		SELECT mr.id, mr.animal_id, a.name, mr.date, mr.morning_liters, mr.evening_liters, mr.total_liters, mr.notes, mr.created_at
		FROM milk_records mr
		JOIN animals a ON mr.animal_id = a.id
		WHERE 1=1
	`
	args := []interface{}{}

	if animalId > 0 {
		query += " AND mr.animal_id = ?"
		args = append(args, animalId)
	}
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

	var records []MilkRecord
	for rows.Next() {
		var r MilkRecord
		var notes sql.NullString
		err := rows.Scan(&r.ID, &r.AnimalID, &r.AnimalName, &r.Date, &r.MorningLiters, &r.EveningLiters, &r.TotalLiters, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		r.Notes = notes.String
		records = append(records, r)
	}
	return records, nil
}

// AddMilkRecord adds a new milk record
func (s *LivestockService) AddMilkRecord(record MilkRecord) (int64, error) {
	total := record.MorningLiters + record.EveningLiters
	result, err := db.Exec(`
		INSERT INTO milk_records (animal_id, date, morning_liters, evening_liters, total_liters, notes)
		VALUES (?, ?, ?, ?, ?, ?)
	`, record.AnimalID, record.Date, record.MorningLiters, record.EveningLiters, total, record.Notes)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateMilkRecord updates an existing milk record
func (s *LivestockService) UpdateMilkRecord(record MilkRecord) error {
	total := record.MorningLiters + record.EveningLiters
	_, err := db.Exec(`
		UPDATE milk_records SET animal_id = ?, date = ?, morning_liters = ?, evening_liters = ?, total_liters = ?, notes = ?
		WHERE id = ?
	`, record.AnimalID, record.Date, record.MorningLiters, record.EveningLiters, total, record.Notes, record.ID)
	return err
}

// DeleteMilkRecord deletes a milk record
func (s *LivestockService) DeleteMilkRecord(id int64) error {
	_, err := db.Exec(`DELETE FROM milk_records WHERE id = ?`, id)
	return err
}

// GetMilkSales returns milk sales within a date range
func (s *LivestockService) GetMilkSales(startDate, endDate string) ([]MilkSale, error) {
	query := `
		SELECT id, date, buyer_name, liters, price_per_liter, total_amount, is_paid, notes, created_at
		FROM milk_sales WHERE 1=1
	`
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

	var sales []MilkSale
	for rows.Next() {
		var s MilkSale
		var buyerName, notes sql.NullString
		err := rows.Scan(&s.ID, &s.Date, &buyerName, &s.Liters, &s.PricePerLiter, &s.TotalAmount, &s.IsPaid, &notes, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		s.BuyerName = buyerName.String
		s.Notes = notes.String
		sales = append(sales, s)
	}
	return sales, nil
}

// AddMilkSale adds a new milk sale
func (s *LivestockService) AddMilkSale(sale MilkSale) (int64, error) {
	total := sale.Liters * sale.PricePerLiter
	result, err := db.Exec(`
		INSERT INTO milk_sales (date, buyer_name, liters, price_per_liter, total_amount, is_paid, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, sale.Date, sale.BuyerName, sale.Liters, sale.PricePerLiter, total, sale.IsPaid, sale.Notes)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}

	// Automatically record in finances
	if err := addTransactionInternal(sale.Date, "income", "milk_sales",
		fmt.Sprintf("Milk Sale: %.1fL to %s", sale.Liters, sale.BuyerName),
		total, fmt.Sprintf("milk_sale:%d", id)); err != nil {
		_ = err // Log error but continue
	}

	return id, nil
}

// UpdateMilkSale updates an existing milk sale
func (s *LivestockService) UpdateMilkSale(sale MilkSale) error {
	total := sale.Liters * sale.PricePerLiter
	_, err := db.Exec(`
		UPDATE milk_sales SET date = ?, buyer_name = ?, liters = ?, price_per_liter = ?, total_amount = ?, is_paid = ?, notes = ?
		WHERE id = ?
	`, sale.Date, sale.BuyerName, sale.Liters, sale.PricePerLiter, total, sale.IsPaid, sale.Notes, sale.ID)
	return err
}

// DeleteMilkSale deletes a milk sale
func (s *LivestockService) DeleteMilkSale(id int64) error {
	_, err := db.Exec(`DELETE FROM milk_sales WHERE id = ?`, id)
	return err
}

// GetTodayMilkTotal returns total milk produced today
func (s *LivestockService) GetTodayMilkTotal() (float64, error) {
	today := time.Now().Format("2006-01-02")
	var total sql.NullFloat64
	err := db.QueryRow(`SELECT SUM(total_liters) FROM milk_records WHERE date = ?`, today).Scan(&total)
	if err != nil {
		return 0, err
	}
	return total.Float64, nil
}

// GetMonthMilkTotal returns total milk produced this month
func (s *LivestockService) GetMonthMilkTotal() (float64, error) {
	startOfMonth := time.Now().Format("2006-01") + "-01"
	var total sql.NullFloat64
	err := db.QueryRow(`SELECT SUM(total_liters) FROM milk_records WHERE date >= ?`, startOfMonth).Scan(&total)
	if err != nil {
		return 0, err
	}
	return total.Float64, nil
}

// GetDailyCows returns cows that can be milked (female, active, not calves)
func (s *LivestockService) GetDairyCows() ([]Animal, error) {
	rows, err := db.Query(`
		SELECT id, tag_number, name, type, breed, date_of_birth, gender, status, notes, created_at, updated_at
		FROM animals 
		WHERE gender = 'female' AND status = 'active' AND type IN ('cow', 'heifer')
		ORDER BY date_of_birth ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var animals []Animal
	for rows.Next() {
		var a Animal
		var tagNumber, breed, dateOfBirth, gender, notes sql.NullString
		err := rows.Scan(&a.ID, &tagNumber, &a.Name, &a.Type, &breed, &dateOfBirth, &gender, &a.Status, &notes, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		a.TagNumber = tagNumber.String
		a.Breed = breed.String
		a.DateOfBirth = dateOfBirth.String
		a.Gender = gender.String
		a.Notes = notes.String
		animals = append(animals, a)
	}
	return animals, nil
}
