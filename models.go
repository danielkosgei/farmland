package main

import "time"

// Animal represents a livestock animal (primarily dairy cows)
type Animal struct {
	ID          int64     `json:"id"`
	TagNumber   string    `json:"tagNumber"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`                 // cow, bull, calf, heifer
	Breed       string    `json:"breed"`                // Friesian, Ayrshire, Jersey, etc.
	DateOfBirth string    `json:"dateOfBirth"`          // YYYY-MM-DD format
	Gender      string    `json:"gender"`               // male, female
	MotherID    *int64    `json:"motherId"`             // Optional reference to mother
	FatherID    *int64    `json:"fatherId"`             // Optional reference to father
	MotherName  string    `json:"motherName,omitempty"` // Joined field
	FatherName  string    `json:"fatherName,omitempty"` // Joined field
	Status      string    `json:"status"`               // active, sold, deceased
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// MilkRecord represents daily milk production for an animal
type MilkRecord struct {
	ID            int64     `json:"id"`
	AnimalID      int64     `json:"animalId"`
	AnimalName    string    `json:"animalName,omitempty"` // Joined field
	Date          string    `json:"date"`                 // YYYY-MM-DD format
	MorningLiters float64   `json:"morningLiters"`
	EveningLiters float64   `json:"eveningLiters"`
	TotalLiters   float64   `json:"totalLiters"`
	Notes         string    `json:"notes"`
	CreatedAt     time.Time `json:"createdAt"`
}

// MilkSale represents a sale of milk
type MilkSale struct {
	ID            int64     `json:"id"`
	Date          string    `json:"date"` // YYYY-MM-DD format
	BuyerName     string    `json:"buyerName"`
	Liters        float64   `json:"liters"`
	PricePerLiter float64   `json:"pricePerLiter"`
	TotalAmount   float64   `json:"totalAmount"`
	IsPaid        bool      `json:"isPaid"`
	Notes         string    `json:"notes"`
	CreatedAt     time.Time `json:"createdAt"`
}

// Field represents a farm field/plot
type Field struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	SizeAcres   float64   `json:"sizeAcres"`
	Location    string    `json:"location"`    // e.g., "North section", "Near river"
	SoilType    string    `json:"soilType"`    // loam, clay, sandy, etc.
	CurrentCrop string    `json:"currentCrop"` // what's currently planted
	Status      string    `json:"status"`      // fallow, planted, growing, ready_harvest
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CropRecord represents a planting/harvest cycle
type CropRecord struct {
	ID              int64     `json:"id"`
	FieldID         int64     `json:"fieldId"`
	FieldName       string    `json:"fieldName,omitempty"` // Joined field
	CropType        string    `json:"cropType"`            // maize, beans, sukuma wiki, potatoes, etc.
	Variety         string    `json:"variety"`             // specific variety
	PlantingDate    string    `json:"plantingDate"`        // YYYY-MM-DD
	ExpectedHarvest string    `json:"expectedHarvest"`     // YYYY-MM-DD
	ActualHarvest   string    `json:"actualHarvest"`       // YYYY-MM-DD
	SeedCost        float64   `json:"seedCost"`
	FertilizerCost  float64   `json:"fertilizerCost"`
	LaborCost       float64   `json:"laborCost"`
	YieldKg         float64   `json:"yieldKg"`
	YieldValue      float64   `json:"yieldValue"` // revenue from selling
	Status          string    `json:"status"`     // planted, growing, harvested, failed
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"createdAt"`
}

// InventoryItem represents items in farm inventory
type InventoryItem struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`     // feed, equipment, supplies, seeds, fertilizer
	Quantity     float64   `json:"quantity"`     // current stock
	Unit         string    `json:"unit"`         // kg, liters, bags, pieces
	MinimumStock float64   `json:"minimumStock"` // alert threshold
	CostPerUnit  float64   `json:"costPerUnit"`
	Supplier     string    `json:"supplier"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// FeedType represents different types of animal feed
type FeedType struct {
	ID              int64   `json:"id"`
	Name            string  `json:"name"`            // dairy meal, hay, napier grass, maize stalks
	Category        string  `json:"category"`        // concentrate, roughage, supplement
	NutritionalInfo string  `json:"nutritionalInfo"` // protein %, fiber %, etc.
	CostPerKg       float64 `json:"costPerKg"`
	Notes           string  `json:"notes"`
}

// FeedRecord represents daily feeding records
type FeedRecord struct {
	ID           int64     `json:"id"`
	Date         string    `json:"date"` // YYYY-MM-DD
	FeedTypeID   int64     `json:"feedTypeId"`
	FeedTypeName string    `json:"feedTypeName,omitempty"` // Joined field
	QuantityKg   float64   `json:"quantityKg"`
	AnimalCount  int       `json:"animalCount"` // number of animals fed
	FeedingTime  string    `json:"feedingTime"` // morning, afternoon, evening
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"createdAt"`
}

// FeedGrinding represents feed grinding/processing records
type FeedGrinding struct {
	ID               int64     `json:"id"`
	Date             string    `json:"date"`          // YYYY-MM-DD
	InputMaterial    string    `json:"inputMaterial"` // maize, wheat bran, etc.
	InputQuantityKg  float64   `json:"inputQuantityKg"`
	OutputQuantityKg float64   `json:"outputQuantityKg"`
	GrindingCost     float64   `json:"grindingCost"` // labor + machine cost
	MachineCost      float64   `json:"machineCost"`  // fuel, maintenance
	OutputType       string    `json:"outputType"`   // type of feed produced
	Notes            string    `json:"notes"`
	CreatedAt        time.Time `json:"createdAt"`
}

// VetRecord represents health/veterinary records
type VetRecord struct {
	ID          int64     `json:"id"`
	AnimalID    int64     `json:"animalId"`
	AnimalName  string    `json:"animalName,omitempty"` // Joined field
	Date        string    `json:"date"`                 // YYYY-MM-DD
	RecordType  string    `json:"recordType"`           // treatment, vaccination, checkup, deworming
	Description string    `json:"description"`
	Diagnosis   string    `json:"diagnosis"`
	Treatment   string    `json:"treatment"`
	Medicine    string    `json:"medicine"`
	Dosage      string    `json:"dosage"`
	VetName     string    `json:"vetName"`
	Cost        float64   `json:"cost"`
	NextDueDate string    `json:"nextDueDate"` // for follow-ups or vaccinations
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Transaction represents financial transactions
type Transaction struct {
	ID            int64     `json:"id"`
	Date          string    `json:"date"`     // YYYY-MM-DD
	Type          string    `json:"type"`     // income, expense
	Category      string    `json:"category"` // milk_sales, crop_sales, feed, veterinary, labor, equipment, etc.
	Description   string    `json:"description"`
	Amount        float64   `json:"amount"`
	PaymentMethod string    `json:"paymentMethod"` // cash, mpesa, bank
	RelatedEntity string    `json:"relatedEntity"` // e.g., "Cow: Daisy" or "Field: North Plot"
	Notes         string    `json:"notes"`
	CreatedAt     time.Time `json:"createdAt"`
}

// DashboardStats represents overview statistics
type DashboardStats struct {
	TotalAnimals     int     `json:"totalAnimals"`
	ActiveCows       int     `json:"activeCows"`
	TodayMilkLiters  float64 `json:"todayMilkLiters"`
	MonthMilkLiters  float64 `json:"monthMilkLiters"`
	ActiveFields     int     `json:"activeFields"`
	TotalFieldsAcres float64 `json:"totalFieldsAcres"`
	MonthIncome      float64 `json:"monthIncome"`
	MonthExpenses    float64 `json:"monthExpenses"`
	LowStockItems    int     `json:"lowStockItems"`
	PendingVetVisits int     `json:"pendingVetVisits"`
}

// RecentActivity represents recent activity items for dashboard
type RecentActivity struct {
	ID          int64     `json:"id"`
	Type        string    `json:"type"` // milk, sale, crop, vet, feed, transaction
	Description string    `json:"description"`
	Amount      string    `json:"amount"` // e.g., "15.5 liters" or "KES 2,500"
	Date        time.Time `json:"date"`
}

// FinancialSummary for reports
type FinancialSummary struct {
	TotalIncome       float64            `json:"totalIncome"`
	TotalExpenses     float64            `json:"totalExpenses"`
	NetProfit         float64            `json:"netProfit"`
	IncomeByCategory  map[string]float64 `json:"incomeByCategory"`
	ExpenseByCategory map[string]float64 `json:"expenseByCategory"`
}

// BreedingRecord represents a breeding event and pregnancy tracking
type BreedingRecord struct {
	ID              int64     `json:"id"`
	FemaleID        int64     `json:"femaleId"`
	FemaleName      string    `json:"femaleName,omitempty"`    // Joined field
	MaleID          *int64    `json:"maleId"`                  // Null for AI
	MaleName        string    `json:"maleName,omitempty"`      // Joined field
	BreedingDate    string    `json:"breedingDate"`            // YYYY-MM-DD
	BreedingMethod  string    `json:"breedingMethod"`          // natural, artificial_insemination
	SireSource      string    `json:"sireSource"`              // For AI: semen source/bull name
	ExpectedDueDate string    `json:"expectedDueDate"`         // YYYY-MM-DD
	ActualBirthDate string    `json:"actualBirthDate"`         // YYYY-MM-DD
	OffspringID     *int64    `json:"offspringId"`             // Reference to born calf
	OffspringName   string    `json:"offspringName,omitempty"` // Joined field
	PregnancyStatus string    `json:"pregnancyStatus"`         // pending, confirmed, failed, delivered
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"createdAt"`
}
