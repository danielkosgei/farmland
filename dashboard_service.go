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
	_ = db.QueryRow(`SELECT COUNT(*) FROM animals WHERE status = 'active'`).Scan(&stats.TotalAnimals)

	// Active dairy cows
	_ = db.QueryRow(`SELECT COUNT(*) FROM animals WHERE status = 'active' AND gender = 'female' AND type IN ('cow', 'heifer')`).Scan(&stats.ActiveCows)

	// Today's milk
	today := time.Now().Format("2006-01-02")
	var todayMilk sql.NullFloat64
	_ = db.QueryRow(`SELECT SUM(total_liters) FROM milk_records WHERE date = ?`, today).Scan(&todayMilk)
	stats.TodayMilkLiters = todayMilk.Float64

	// Month's milk
	startOfMonth := time.Now().Format("2006-01") + "-01"
	var monthMilk sql.NullFloat64
	_ = db.QueryRow(`SELECT SUM(total_liters) FROM milk_records WHERE date >= ?`, startOfMonth).Scan(&monthMilk)
	stats.MonthMilkLiters = monthMilk.Float64

	// Active fields
	_ = db.QueryRow(`SELECT COUNT(*) FROM fields WHERE status IN ('planted', 'growing', 'ready_harvest')`).Scan(&stats.ActiveFields)

	// Total field acres
	var totalAcres sql.NullFloat64
	_ = db.QueryRow(`SELECT SUM(size_acres) FROM fields`).Scan(&totalAcres)
	stats.TotalFieldsAcres = totalAcres.Float64

	// Month income
	var monthIncome sql.NullFloat64
	_ = db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'income' AND date >= ?`, startOfMonth).Scan(&monthIncome)
	stats.MonthIncome = monthIncome.Float64

	// Month expenses
	var monthExpenses sql.NullFloat64
	_ = db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND date >= ?`, startOfMonth).Scan(&monthExpenses)
	stats.MonthExpenses = monthExpenses.Float64

	// Low stock items
	_ = db.QueryRow(`SELECT COUNT(*) FROM inventory_items WHERE quantity < minimum_stock`).Scan(&stats.LowStockItems)

	// Pending vet visits
	_ = db.QueryRow(`SELECT COUNT(*) FROM vet_records WHERE next_due_date IS NOT NULL AND next_due_date != '' AND next_due_date >= date('now') AND next_due_date <= date('now', '+30 days')`).Scan(&stats.PendingVetVisits)

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
			_ = rows.Scan(&a.Type, &a.Description, &a.Date)
			activities = append(activities, a)
		}
	}

	// Recent milk sales
	rows2, _ := db.Query(`SELECT 'sale' as type, 'Sold ' || liters || ' liters to ' || COALESCE(buyer_name, 'customer') as description, created_at FROM milk_sales ORDER BY created_at DESC LIMIT 3`)
	if rows2 != nil {
		defer rows2.Close()
		for rows2.Next() {
			var a RecentActivity
			_ = rows2.Scan(&a.Type, &a.Description, &a.Date)
			activities = append(activities, a)
		}
	}

	// Recent vet records
	rows3, _ := db.Query(`SELECT 'vet' as type, vr.record_type || ' for ' || a.name as description, vr.created_at FROM vet_records vr JOIN animals a ON vr.animal_id = a.id ORDER BY vr.created_at DESC LIMIT 3`)
	if rows3 != nil {
		defer rows3.Close()
		for rows3.Next() {
			var a RecentActivity
			_ = rows3.Scan(&a.Type, &a.Description, &a.Date)
			activities = append(activities, a)
		}
	}

	return activities, nil
}

// GetMilkProductionChart returns milk production data for specified timeframe
func (s *DashboardService) GetMilkProductionChart(timeframe string) ([]map[string]interface{}, error) {
	var query string
	switch timeframe {
	case "month":
		query = `SELECT date, SUM(total_liters) as total FROM milk_records WHERE date >= date('now', 'localtime', '-29 days') GROUP BY date ORDER BY date`
	case "year":
		query = `SELECT strftime('%Y-%m', date) as period, SUM(total_liters) as total FROM milk_records WHERE date >= date('now', 'localtime', '-11 months', 'start of month') GROUP BY period ORDER BY period`
	default: // week
		query = `SELECT date, SUM(total_liters) as total FROM milk_records WHERE date >= date('now', 'localtime', '-6 days') GROUP BY date ORDER BY date`
	}

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]interface{}
	for rows.Next() {
		var label string
		var total float64
		_ = rows.Scan(&label, &total)
		data = append(data, map[string]interface{}{"date": label, "liters": total})
	}

	return s.fillChartGaps(data, timeframe), nil
}

// fillChartGaps ensures that the returned data has an entry for every day/month in the range
func (s *DashboardService) fillChartGaps(data []map[string]interface{}, timeframe string) []map[string]interface{} {
	now := time.Now().Local()
	var result []map[string]interface{}
	dataMap := make(map[string]float64)
	for _, d := range data {
		dataMap[d["date"].(string)] = d["liters"].(float64)
	}

	switch timeframe {
	case "year":
		// Show last 12 months
		for i := 11; i >= 0; i-- {
			d := now.AddDate(0, -i, 0)
			period := d.Format("2006-01")
			val := 0.0
			if v, ok := dataMap[period]; ok {
				val = v
			}
			result = append(result, map[string]interface{}{"date": period, "liters": val})
		}
	case "month":
		// Show last 30 days
		for i := 29; i >= 0; i-- {
			d := now.AddDate(0, 0, -i)
			date := d.Format("2006-01-02")
			val := 0.0
			if v, ok := dataMap[date]; ok {
				val = v
			}
			result = append(result, map[string]interface{}{"date": date, "liters": val})
		}
	default: // week
		// Show last 7 days
		for i := 6; i >= 0; i-- {
			d := now.AddDate(0, 0, -i)
			date := d.Format("2006-01-02")
			val := 0.0
			if v, ok := dataMap[date]; ok {
				val = v
			}
			result = append(result, map[string]interface{}{"date": date, "liters": val})
		}
	}

	return result
}
