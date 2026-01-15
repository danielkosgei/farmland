package main

import (
	"database/sql"
	"time"
)

// DashboardService provides dashboard statistics
type DashboardService struct {
	livestock *LivestockService
	crops     *CropsService
	inventory *InventoryService
	health    *HealthService
	financial *FinancialService
}

// NewDashboardService creates a new DashboardService
func NewDashboardService(l *LivestockService, c *CropsService, i *InventoryService, h *HealthService, f *FinancialService) *DashboardService {
	return &DashboardService{livestock: l, crops: c, inventory: i, health: h, financial: f}
}

// GetDashboardStats returns overview statistics
func (s *DashboardService) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{}

	// Total animals
	db.QueryRow(`SELECT COUNT(*) FROM animals WHERE status = 'active'`).Scan(&stats.TotalAnimals)

	// Active dairy cows
	db.QueryRow(`SELECT COUNT(*) FROM animals WHERE status = 'active' AND gender = 'female' AND type IN ('cow', 'heifer')`).Scan(&stats.ActiveCows)

	// Today's milk
	today := time.Now().Format("2006-01-02")
	var todayMilk sql.NullFloat64
	db.QueryRow(`SELECT SUM(total_liters) FROM milk_records WHERE date = ?`, today).Scan(&todayMilk)
	stats.TodayMilkLiters = todayMilk.Float64

	// Month's milk
	startOfMonth := time.Now().Format("2006-01") + "-01"
	var monthMilk sql.NullFloat64
	db.QueryRow(`SELECT SUM(total_liters) FROM milk_records WHERE date >= ?`, startOfMonth).Scan(&monthMilk)
	stats.MonthMilkLiters = monthMilk.Float64

	// Active fields
	db.QueryRow(`SELECT COUNT(*) FROM fields WHERE status IN ('planted', 'growing', 'ready_harvest')`).Scan(&stats.ActiveFields)

	// Total field acres
	var totalAcres sql.NullFloat64
	db.QueryRow(`SELECT SUM(size_acres) FROM fields`).Scan(&totalAcres)
	stats.TotalFieldsAcres = totalAcres.Float64

	// Month income
	var monthIncome sql.NullFloat64
	db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'income' AND date >= ?`, startOfMonth).Scan(&monthIncome)
	stats.MonthIncome = monthIncome.Float64

	// Month expenses
	var monthExpenses sql.NullFloat64
	db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND date >= ?`, startOfMonth).Scan(&monthExpenses)
	stats.MonthExpenses = monthExpenses.Float64

	// Low stock items
	db.QueryRow(`SELECT COUNT(*) FROM inventory_items WHERE quantity < minimum_stock`).Scan(&stats.LowStockItems)

	// Pending vet visits
	db.QueryRow(`SELECT COUNT(*) FROM vet_records WHERE next_due_date IS NOT NULL AND next_due_date != '' AND next_due_date >= date('now') AND next_due_date <= date('now', '+30 days')`).Scan(&stats.PendingVetVisits)

	return stats, nil
}

// GetRecentActivity returns recent activity across all modules
func (s *DashboardService) GetRecentActivity() ([]RecentActivity, error) {
	var activities []RecentActivity

	// Recent milk records
	rows, _ := db.Query(`SELECT 'milk' as type, a.name || ' produced ' || mr.total_liters || ' liters' as description, mr.created_at FROM milk_records mr JOIN animals a ON mr.animal_id = a.id ORDER BY mr.created_at DESC LIMIT 3`)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var a RecentActivity
			rows.Scan(&a.Type, &a.Description, &a.Date)
			activities = append(activities, a)
		}
	}

	// Recent milk sales
	rows2, _ := db.Query(`SELECT 'sale' as type, 'Sold ' || liters || ' liters to ' || COALESCE(buyer_name, 'customer') as description, created_at FROM milk_sales ORDER BY created_at DESC LIMIT 3`)
	if rows2 != nil {
		defer rows2.Close()
		for rows2.Next() {
			var a RecentActivity
			rows2.Scan(&a.Type, &a.Description, &a.Date)
			activities = append(activities, a)
		}
	}

	// Recent vet records
	rows3, _ := db.Query(`SELECT 'vet' as type, vr.record_type || ' for ' || a.name as description, vr.created_at FROM vet_records vr JOIN animals a ON vr.animal_id = a.id ORDER BY vr.created_at DESC LIMIT 3`)
	if rows3 != nil {
		defer rows3.Close()
		for rows3.Next() {
			var a RecentActivity
			rows3.Scan(&a.Type, &a.Description, &a.Date)
			activities = append(activities, a)
		}
	}

	return activities, nil
}

// GetMilkProductionChart returns milk production data for last 7 days
func (s *DashboardService) GetMilkProductionChart() ([]map[string]interface{}, error) {
	rows, err := db.Query(`SELECT date, SUM(total_liters) as total FROM milk_records WHERE date >= date('now', '-7 days') GROUP BY date ORDER BY date`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var date string
		var total float64
		rows.Scan(&date, &total)
		data = append(data, map[string]interface{}{"date": date, "liters": total})
	}
	return data, nil
}
