package main

import (
	"context"
)

// App struct
type App struct {
	ctx       context.Context
	Livestock *LivestockService
	Crops     *CropsService
	Inventory *InventoryService
	Feed      *FeedService
	Health    *HealthService
	Financial *FinancialService
	Dashboard *DashboardService
	Update    *UpdateService
}

// NewApp creates a new App application struct
func NewApp() *App {
	livestock := NewLivestockService()
	crops := NewCropsService()
	inventory := NewInventoryService()
	feed := NewFeedService()
	health := NewHealthService()
	financial := NewFinancialService()
	dashboard := NewDashboardService(livestock, crops, inventory, health, financial)
	update := NewUpdateService()

	return &App{
		Livestock: livestock,
		Crops:     crops,
		Inventory: inventory,
		Feed:      feed,
		Health:    health,
		Financial: financial,
		Dashboard: dashboard,
		Update:    update,
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := InitDatabase(); err != nil {
		println("Database initialization error:", err.Error())
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	CloseDatabase()
}
