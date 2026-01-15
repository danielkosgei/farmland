package main

import (
	"context"
)

// App struct
type App struct {
	ctx          context.Context
	Livestock    *LivestockService
	Crops        *CropsService
	Inventory    *InventoryService
	Feed         *FeedService
	Health       *HealthService
	Financial    *FinancialService
	Dashboard    *DashboardService
	Update       *UpdateService
	Breeding     *BreedingService
	Backup       *BackupService
	Weather      *WeatherService
	Notification *NotificationService
	Export       *ExportService
	Photo        *PhotoService
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
	breeding := NewBreedingService()
	backup := NewBackupService()
	weather := NewWeatherService()
	notification := NewNotificationService()
	export := NewExportService()
	photo := NewPhotoService()

	return &App{
		Livestock:    livestock,
		Crops:        crops,
		Inventory:    inventory,
		Feed:         feed,
		Health:       health,
		Financial:    financial,
		Dashboard:    dashboard,
		Update:       update,
		Breeding:     breeding,
		Backup:       backup,
		Weather:      weather,
		Notification: notification,
		Export:       export,
		Photo:        photo,
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.Backup.SetContext(ctx) // Set context for file dialogs
	a.Export.SetContext(ctx) // Set context for file dialogs
	a.Photo.SetContext(ctx)  // Set context for file dialogs
	if err := InitDatabase(); err != nil {
		println("Database initialization error:", err.Error())
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	CloseDatabase()
}
