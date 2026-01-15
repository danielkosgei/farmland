package main

import (
	"context"
	"fmt"
	"time"

	"github.com/gen2brain/beeep"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// NotificationService handles reminder and alert notifications
type NotificationService struct {
	ctx          context.Context
	lastNotified map[string]time.Time
}

// NewNotificationService creates a new NotificationService
func NewNotificationService() *NotificationService {
	return &NotificationService{
		lastNotified: make(map[string]time.Time),
	}
}

// SetContext sets the context for the service
func (s *NotificationService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// StartBackgroundWorker starts the notification poller
func (s *NotificationService) StartBackgroundWorker() {
	go func() {
		// Initial wait to let app settle
		time.Sleep(10 * time.Second)

		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()

		for {
			s.CheckAndNotify()
			select {
			case <-ticker.C:
				continue
			}
		}
	}()
}

// CheckAndNotify checks for urgent alerts and triggers desktop notifications
func (s *NotificationService) CheckAndNotify() {
	notifs, err := s.GetAllNotifications()
	if err != nil {
		return
	}

	for _, n := range notifs {
		// Only notify for high priority items due today or low stock
		isUrgent := n.Priority == "high" && (n.DaysUntil <= 0 || n.Type == "low_stock")

		if isUrgent {
			key := fmt.Sprintf("%s_%d", n.Type, n.ID)

			// Don't notify more than once every 24 hours for the same item
			if last, exists := s.lastNotified[key]; exists && time.Since(last) < 24*time.Hour {
				continue
			}

			s.Notify(n.Title, n.Description)
			s.lastNotified[key] = time.Now()

			// Small delay between multiple notifications to avoid clogging
			time.Sleep(2 * time.Second)
		}
	}
}

// Notify triggers a desktop notification
func (s *NotificationService) Notify(title, message string) error {
	// Emit event to frontend as well
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "desktop_notification", map[string]string{
			"title":   title,
			"message": message,
		})
	}

	// Trigger system notification
	// Use App Icon if possible, but beeep defaults to app icon on Windows if compiled correctly
	return beeep.Notify(title, message, "")
}

// TestNotification sends a test desktop notification
func (s *NotificationService) TestNotification() string {
	err := s.Notify("Farmland Notification Test", "If you see this, desktop notifications are working perfectly!")
	if err != nil {
		return "Error: " + err.Error()
	}
	return "Test notification sent successfully"
}

// Reminder represents an upcoming task or event
type Reminder struct {
	ID          int64  `json:"id"`
	Type        string `json:"type"` // vaccination, vet_followup, breeding, low_stock
	Title       string `json:"title"`
	Description string `json:"description"`
	DueDate     string `json:"dueDate"`
	DaysUntil   int    `json:"daysUntil"`
	Priority    string `json:"priority"`   // high, medium, low
	EntityType  string `json:"entityType"` // animal, field, inventory
	EntityID    int64  `json:"entityId"`
	EntityName  string `json:"entityName"`
}

// GetUpcomingReminders returns all upcoming reminders
func (s *NotificationService) GetUpcomingReminders() ([]Reminder, error) {
	reminders := []Reminder{}

	// Get upcoming vaccinations (next 14 days)
	vaccinations, err := s.getUpcomingVaccinations(14)
	if err == nil {
		reminders = append(reminders, vaccinations...)
	}

	// Get vet follow-ups
	followups, err := s.getVetFollowups()
	if err == nil {
		reminders = append(reminders, followups...)
	}

	// Get pregnant animals due soon (next 14 days)
	pregnancies, err := s.getUpcomingBirths(14)
	if err == nil {
		reminders = append(reminders, pregnancies...)
	}

	return reminders, nil
}

// GetLowStockAlerts returns items with stock below minimum
func (s *NotificationService) GetLowStockAlerts() ([]Reminder, error) {
	reminders := []Reminder{}

	rows, err := db.Query(`
		SELECT id, name, quantity, unit, minimum_stock 
		FROM inventory 
		WHERE quantity <= minimum_stock AND minimum_stock > 0
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var name, unit string
		var quantity, minStock float64
		if err := rows.Scan(&id, &name, &quantity, &unit, &minStock); err != nil {
			continue
		}
		reminders = append(reminders, Reminder{
			ID:          id,
			Type:        "low_stock",
			Title:       "Low Stock Alert",
			Description: name + " is running low",
			Priority:    "high",
			EntityType:  "inventory",
			EntityID:    id,
			EntityName:  name,
		})
	}

	return reminders, nil
}

// getUpcomingVaccinations returns animals needing vaccination soon
func (s *NotificationService) getUpcomingVaccinations(days int) ([]Reminder, error) {
	reminders := []Reminder{}
	today := time.Now()
	futureDate := today.AddDate(0, 0, days).Format("2006-01-02")
	todayStr := today.Format("2006-01-02")

	rows, err := db.Query(`
		SELECT hr.id, hr.animal_id, a.name, hr.next_date, hr.treatment_type, hr.notes
		FROM health_records hr
		JOIN animals a ON hr.animal_id = a.id
		WHERE hr.next_date IS NOT NULL 
		AND hr.next_date BETWEEN ? AND ?
		AND a.status = 'active'
		ORDER BY hr.next_date
	`, todayStr, futureDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id, animalID int64
		var animalName, nextDate, treatmentType, notes string
		if err := rows.Scan(&id, &animalID, &animalName, &nextDate, &treatmentType, &notes); err != nil {
			continue
		}

		dueDate, _ := time.Parse("2006-01-02", nextDate)
		daysUntil := int(dueDate.Sub(today).Hours() / 24)

		priority := "medium"
		if daysUntil <= 3 {
			priority = "high"
		}

		reminders = append(reminders, Reminder{
			ID:          id,
			Type:        "vaccination",
			Title:       treatmentType + " Due",
			Description: animalName + " - " + treatmentType,
			DueDate:     nextDate,
			DaysUntil:   daysUntil,
			Priority:    priority,
			EntityType:  "animal",
			EntityID:    animalID,
			EntityName:  animalName,
		})
	}

	return reminders, nil
}

// getVetFollowups returns scheduled vet follow-ups
func (s *NotificationService) getVetFollowups() ([]Reminder, error) {
	reminders := []Reminder{}
	today := time.Now()
	futureDate := today.AddDate(0, 0, 7).Format("2006-01-02")
	todayStr := today.Format("2006-01-02")

	rows, err := db.Query(`
		SELECT hr.id, hr.animal_id, a.name, hr.next_date, hr.treatment_type
		FROM health_records hr
		JOIN animals a ON hr.animal_id = a.id
		WHERE hr.next_date IS NOT NULL 
		AND hr.next_date BETWEEN ? AND ?
		AND hr.treatment_type = 'checkup'
		AND a.status = 'active'
		ORDER BY hr.next_date
	`, todayStr, futureDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id, animalID int64
		var animalName, nextDate, treatmentType string
		if err := rows.Scan(&id, &animalID, &animalName, &nextDate, &treatmentType); err != nil {
			continue
		}

		dueDate, _ := time.Parse("2006-01-02", nextDate)
		daysUntil := int(dueDate.Sub(today).Hours() / 24)

		reminders = append(reminders, Reminder{
			ID:          id,
			Type:        "vet_followup",
			Title:       "Vet Follow-up",
			Description: animalName + " needs a checkup",
			DueDate:     nextDate,
			DaysUntil:   daysUntil,
			Priority:    "medium",
			EntityType:  "animal",
			EntityID:    animalID,
			EntityName:  animalName,
		})
	}

	return reminders, nil
}

// getUpcomingBirths returns pregnant animals due soon
func (s *NotificationService) getUpcomingBirths(days int) ([]Reminder, error) {
	reminders := []Reminder{}
	today := time.Now()
	futureDate := today.AddDate(0, 0, days).Format("2006-01-02")
	todayStr := today.Format("2006-01-02")

	rows, err := db.Query(`
		SELECT br.id, br.female_id, a.name, br.expected_due_date
		FROM breeding_records br
		JOIN animals a ON br.female_id = a.id
		WHERE br.pregnancy_status IN ('pending', 'confirmed')
		AND br.expected_due_date IS NOT NULL
		AND br.expected_due_date BETWEEN ? AND ?
		ORDER BY br.expected_due_date
	`, todayStr, futureDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id, animalID int64
		var animalName, dueDate string
		if err := rows.Scan(&id, &animalID, &animalName, &dueDate); err != nil {
			continue
		}

		dueDateParsed, _ := time.Parse("2006-01-02", dueDate)
		daysUntil := int(dueDateParsed.Sub(today).Hours() / 24)

		priority := "medium"
		if daysUntil <= 7 {
			priority = "high"
		}

		reminders = append(reminders, Reminder{
			ID:          id,
			Type:        "breeding",
			Title:       "Expected Birth",
			Description: animalName + " is due soon",
			DueDate:     dueDate,
			DaysUntil:   daysUntil,
			Priority:    priority,
			EntityType:  "animal",
			EntityID:    animalID,
			EntityName:  animalName,
		})
	}

	return reminders, nil
}

// GetAllNotifications returns all reminders and alerts combined
func (s *NotificationService) GetAllNotifications() ([]Reminder, error) {
	allNotifs := []Reminder{}

	reminders, _ := s.GetUpcomingReminders()
	allNotifs = append(allNotifs, reminders...)

	lowStock, _ := s.GetLowStockAlerts()
	allNotifs = append(allNotifs, lowStock...)

	return allNotifs, nil
}
