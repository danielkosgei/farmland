package main

import (
	"database/sql"
	"fmt"
	"time"
)

// InventoryService handles inventory-related operations
type InventoryService struct{}

// NewInventoryService creates a new InventoryService
func NewInventoryService() *InventoryService {
	return &InventoryService{}
}

// GetAllInventory returns all inventory items
func (s *InventoryService) GetAllInventory() ([]InventoryItem, error) {
	rows, err := db.Query(`
		SELECT id, name, category, quantity, unit, minimum_stock, cost_per_unit, supplier, notes, created_at, updated_at
		FROM inventory_items ORDER BY category, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var i InventoryItem
		var unit, supplier, notes sql.NullString
		err := rows.Scan(&i.ID, &i.Name, &i.Category, &i.Quantity, &unit, &i.MinimumStock, &i.CostPerUnit, &supplier, &notes, &i.CreatedAt, &i.UpdatedAt)
		if err != nil {
			return nil, err
		}
		i.Unit = unit.String
		i.Supplier = supplier.String
		i.Notes = notes.String
		items = append(items, i)
	}
	return items, nil
}

// GetInventoryByCategory returns inventory items by category
func (s *InventoryService) GetInventoryByCategory(category string) ([]InventoryItem, error) {
	rows, err := db.Query(`
		SELECT id, name, category, quantity, unit, minimum_stock, cost_per_unit, supplier, notes, created_at, updated_at
		FROM inventory_items WHERE category = ? ORDER BY name
	`, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var i InventoryItem
		var unit, supplier, notes sql.NullString
		err := rows.Scan(&i.ID, &i.Name, &i.Category, &i.Quantity, &unit, &i.MinimumStock, &i.CostPerUnit, &supplier, &notes, &i.CreatedAt, &i.UpdatedAt)
		if err != nil {
			return nil, err
		}
		i.Unit = unit.String
		i.Supplier = supplier.String
		i.Notes = notes.String
		items = append(items, i)
	}
	return items, nil
}

// AddInventoryItem adds a new inventory item
func (s *InventoryService) AddInventoryItem(item InventoryItem) (int64, error) {
	result, err := db.Exec(`
		INSERT INTO inventory_items (name, category, quantity, unit, minimum_stock, cost_per_unit, supplier, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, item.Name, item.Category, item.Quantity, item.Unit, item.MinimumStock, item.CostPerUnit, item.Supplier, item.Notes)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}
	// Automatically record in finances if there's a cost
	totalCost := item.CostPerUnit * item.Quantity
	if totalCost > 0 {
		date := time.Now().Format("2006-01-02")
		if err := addTransactionInternal(date, "expense", item.Category,
			fmt.Sprintf("Purchase: %.1f %s of %s", item.Quantity, item.Unit, item.Name),
			totalCost, fmt.Sprintf("inventory:%d", id)); err != nil {
			_ = err // Log error but continue
		}
	}

	return id, nil
}

// UpdateInventoryItem updates an existing inventory item
func (s *InventoryService) UpdateInventoryItem(item InventoryItem) error {
	_, err := db.Exec(`
		UPDATE inventory_items SET name = ?, category = ?, quantity = ?, unit = ?, minimum_stock = ?, cost_per_unit = ?, supplier = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, item.Name, item.Category, item.Quantity, item.Unit, item.MinimumStock, item.CostPerUnit, item.Supplier, item.Notes, item.ID)
	return err
}

// UpdateStock updates just the quantity of an item
func (s *InventoryService) UpdateStock(id int64, quantity float64) error {
	_, err := db.Exec(`UPDATE inventory_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, quantity, id)
	return err
}

// DeleteInventoryItem deletes an inventory item
func (s *InventoryService) DeleteInventoryItem(id int64) error {
	_, err := db.Exec(`DELETE FROM inventory_items WHERE id = ?`, id)
	return err
}

// GetLowStockItems returns items below minimum stock
func (s *InventoryService) GetLowStockItems() ([]InventoryItem, error) {
	rows, err := db.Query(`
		SELECT id, name, category, quantity, unit, minimum_stock, cost_per_unit, supplier, notes, created_at, updated_at
		FROM inventory_items WHERE quantity < minimum_stock ORDER BY category, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var i InventoryItem
		var unit, supplier, notes sql.NullString
		err := rows.Scan(&i.ID, &i.Name, &i.Category, &i.Quantity, &unit, &i.MinimumStock, &i.CostPerUnit, &supplier, &notes, &i.CreatedAt, &i.UpdatedAt)
		if err != nil {
			return nil, err
		}
		i.Unit = unit.String
		i.Supplier = supplier.String
		i.Notes = notes.String
		items = append(items, i)
	}
	return items, nil
}

// GetLowStockCount returns count of items below minimum stock
func (s *InventoryService) GetLowStockCount() (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM inventory_items WHERE quantity < minimum_stock`).Scan(&count)
	return count, err
}

// GetInventoryCategories returns available inventory categories
func (s *InventoryService) GetInventoryCategories() []string {
	return []string{
		"feed",
		"equipment",
		"supplies",
		"seeds",
		"fertilizer",
		"medicine",
		"tools",
		"fuel",
	}
}
