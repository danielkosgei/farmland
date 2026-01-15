package main

import (
	"database/sql"
	"time"
)

// FinancialService handles financial/transaction-related operations
type FinancialService struct{}

// NewFinancialService creates a new FinancialService
func NewFinancialService() *FinancialService {
	return &FinancialService{}
}

// GetTransactions returns transactions with optional filters
func (s *FinancialService) GetTransactions(startDate, endDate, transactionType, category string) ([]Transaction, error) {
	query := `SELECT id, date, type, category, description, amount, payment_method, related_entity, notes, created_at FROM transactions WHERE 1=1`
	args := []interface{}{}
	if startDate != "" {
		query += " AND date >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND date <= ?"
		args = append(args, endDate)
	}
	if transactionType != "" {
		query += " AND type = ?"
		args = append(args, transactionType)
	}
	if category != "" {
		query += " AND category = ?"
		args = append(args, category)
	}
	query += " ORDER BY date DESC, created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var t Transaction
		var description, paymentMethod, relatedEntity, notes sql.NullString
		err := rows.Scan(&t.ID, &t.Date, &t.Type, &t.Category, &description, &t.Amount, &paymentMethod, &relatedEntity, &notes, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		t.Description = description.String
		t.PaymentMethod = paymentMethod.String
		t.RelatedEntity = relatedEntity.String
		t.Notes = notes.String
		transactions = append(transactions, t)
	}
	return transactions, nil
}

// AddTransaction adds a new transaction
func (s *FinancialService) AddTransaction(transaction Transaction) (int64, error) {
	result, err := db.Exec(`INSERT INTO transactions (date, type, category, description, amount, payment_method, related_entity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		transaction.Date, transaction.Type, transaction.Category, transaction.Description, transaction.Amount, transaction.PaymentMethod, transaction.RelatedEntity, transaction.Notes)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateTransaction updates an existing transaction
func (s *FinancialService) UpdateTransaction(transaction Transaction) error {
	_, err := db.Exec(`UPDATE transactions SET date = ?, type = ?, category = ?, description = ?, amount = ?, payment_method = ?, related_entity = ?, notes = ? WHERE id = ?`,
		transaction.Date, transaction.Type, transaction.Category, transaction.Description, transaction.Amount, transaction.PaymentMethod, transaction.RelatedEntity, transaction.Notes, transaction.ID)
	return err
}

// DeleteTransaction deletes a transaction
func (s *FinancialService) DeleteTransaction(id int64) error {
	_, err := db.Exec(`DELETE FROM transactions WHERE id = ?`, id)
	return err
}

// GetMonthlyIncome returns total income for the current month
func (s *FinancialService) GetMonthlyIncome() (float64, error) {
	startOfMonth := time.Now().Format("2006-01") + "-01"
	var total sql.NullFloat64
	err := db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'income' AND date >= ?`, startOfMonth).Scan(&total)
	return total.Float64, err
}

// GetMonthlyExpenses returns total expenses for the current month
func (s *FinancialService) GetMonthlyExpenses() (float64, error) {
	startOfMonth := time.Now().Format("2006-01") + "-01"
	var total sql.NullFloat64
	err := db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND date >= ?`, startOfMonth).Scan(&total)
	return total.Float64, err
}

// GetFinancialSummary returns a summary of income and expenses
func (s *FinancialService) GetFinancialSummary(startDate, endDate string) (*FinancialSummary, error) {
	summary := &FinancialSummary{IncomeByCategory: make(map[string]float64), ExpenseByCategory: make(map[string]float64)}
	var income, expenses sql.NullFloat64
	_ = db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'income'`).Scan(&income)
	_ = db.QueryRow(`SELECT SUM(amount) FROM transactions WHERE type = 'expense'`).Scan(&expenses)
	summary.TotalIncome = income.Float64
	summary.TotalExpenses = expenses.Float64
	summary.NetProfit = summary.TotalIncome - summary.TotalExpenses
	return summary, nil
}

// GetIncomeCategories returns available income categories
func (s *FinancialService) GetIncomeCategories() []string {
	return []string{"milk_sales", "crop_sales", "livestock_sales", "other_income"}
}

// GetExpenseCategories returns available expense categories
func (s *FinancialService) GetExpenseCategories() []string {
	return []string{"feed", "veterinary", "labor", "equipment", "seeds", "fertilizer", "fuel", "maintenance", "transport", "utilities", "other_expense"}
}
