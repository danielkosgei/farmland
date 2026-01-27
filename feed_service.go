package main

import (
	"database/sql"
)

// FeedService handles feed-related operations
type FeedService struct{}

// NewFeedService creates a new FeedService
func NewFeedService() *FeedService {
	return &FeedService{}
}

// GetAllFeedTypes returns all feed types
func (s *FeedService) GetAllFeedTypes() ([]FeedType, error) {
	rows, err := db.Query(`
		SELECT id, name, category, nutritional_info, cost_per_kg, notes
		FROM feed_types ORDER BY category, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedTypes []FeedType
	for rows.Next() {
		var f FeedType
		var category, nutritionalInfo, notes sql.NullString
		err := rows.Scan(&f.ID, &f.Name, &category, &nutritionalInfo, &f.CostPerKg, &notes)
		if err != nil {
			return nil, err
		}
		f.Category = category.String
		f.NutritionalInfo = nutritionalInfo.String
		f.Notes = notes.String
		feedTypes = append(feedTypes, f)
	}
	return feedTypes, nil
}

// AddFeedType adds a new feed type
func (s *FeedService) AddFeedType(feedType FeedType) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO feed_types (name, category, nutritional_info, cost_per_kg, notes)
		VALUES (?, ?, ?, ?, ?)
	`, feedType.Name, feedType.Category, feedType.NutritionalInfo, feedType.CostPerKg, feedType.Notes)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateFeedType updates an existing feed type
func (s *FeedService) UpdateFeedType(feedType FeedType) error {
	_, err := db.Exec(`
		UPDATE feed_types SET name = ?, category = ?, nutritional_info = ?, cost_per_kg = ?, notes = ?
		WHERE id = ?
	`, feedType.Name, feedType.Category, feedType.NutritionalInfo, feedType.CostPerKg, feedType.Notes, feedType.ID)
	return err
}

// DeleteFeedType deletes a feed type
func (s *FeedService) DeleteFeedType(id int64) error {
	_, err := db.Exec(`DELETE FROM feed_types WHERE id = ?`, id)
	return err
}

// GetFeedRecords returns feed records within a date range
func (s *FeedService) GetFeedRecords(startDate, endDate string) ([]FeedRecord, error) {
	query := `
		SELECT fr.id, fr.date, fr.feed_type_id, ft.name, fr.quantity_kg, fr.unit, fr.animal_count, fr.feeding_time, fr.notes, fr.created_at
		FROM feed_records fr
		JOIN feed_types ft ON fr.feed_type_id = ft.id
		WHERE 1=1
	`
	args := []interface{}{}

	if startDate != "" {
		query += " AND fr.date >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND fr.date <= ?"
		args = append(args, endDate)
	}
	query += " ORDER BY fr.date DESC, fr.feeding_time"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []FeedRecord
	for rows.Next() {
		var r FeedRecord
		var feedingTime, notes, unit sql.NullString
		err := rows.Scan(&r.ID, &r.Date, &r.FeedTypeID, &r.FeedTypeName, &r.QuantityKg, &unit, &r.AnimalCount, &feedingTime, &notes, &r.CreatedAt)
		if err != nil {
			return nil, err
		}
		r.FeedingTime = feedingTime.String
		r.Notes = notes.String
		r.Unit = unit.String
		if r.Unit == "" {
			r.Unit = "kg" // Default for old records
		}
		records = append(records, r)
	}
	return records, nil
}

// AddFeedRecord adds a new feed record
func (s *FeedService) AddFeedRecord(record FeedRecord) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO feed_records (date, feed_type_id, quantity_kg, unit, animal_count, feeding_time, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, record.Date, record.FeedTypeID, record.QuantityKg, record.Unit, record.AnimalCount, record.FeedingTime, record.Notes)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateFeedRecord updates an existing feed record
func (s *FeedService) UpdateFeedRecord(record FeedRecord) error {
	_, err := db.Exec(`
		UPDATE feed_records SET date = ?, feed_type_id = ?, quantity_kg = ?, unit = ?, animal_count = ?, feeding_time = ?, notes = ?
		WHERE id = ?
	`, record.Date, record.FeedTypeID, record.QuantityKg, record.Unit, record.AnimalCount, record.FeedingTime, record.Notes, record.ID)
	return err
}

// DeleteFeedRecord deletes a feed record
func (s *FeedService) DeleteFeedRecord(id int64) error {
	_, err := db.Exec(`DELETE FROM feed_records WHERE id = ?`, id)
	return err
}
