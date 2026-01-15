package main

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var db *sql.DB

// InitDatabase initializes the SQLite database
func InitDatabase() error {
	// Get user's home directory for storing the database
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	// Create .farmland directory if it doesn't exist
	dbDir := filepath.Join(homeDir, ".farmland")
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return err
	}

	dbPath := filepath.Join(dbDir, "farmland.db")
	log.Printf("Database path: %s", dbPath)

	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	// Create tables
	if err := createTables(); err != nil {
		return err
	}

	// Insert default feed types if none exist
	if err := insertDefaultFeedTypes(); err != nil {
		log.Printf("Warning: Could not insert default feed types: %v", err)
	}

	return nil
}

func createTables() error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS animals (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tag_number TEXT UNIQUE,
			name TEXT NOT NULL,
			type TEXT NOT NULL,
			breed TEXT,
			date_of_birth TEXT,
			gender TEXT,
			mother_id INTEGER REFERENCES animals(id),
			father_id INTEGER REFERENCES animals(id),
			status TEXT DEFAULT 'active',
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS milk_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			animal_id INTEGER NOT NULL,
			date TEXT NOT NULL,
			morning_liters REAL DEFAULT 0,
			evening_liters REAL DEFAULT 0,
			total_liters REAL DEFAULT 0,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (animal_id) REFERENCES animals(id)
		)`,
		`CREATE TABLE IF NOT EXISTS milk_sales (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL,
			buyer_name TEXT,
			liters REAL NOT NULL,
			price_per_liter REAL NOT NULL,
			total_amount REAL NOT NULL,
			is_paid INTEGER DEFAULT 0,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS fields (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			size_acres REAL,
			location TEXT,
			soil_type TEXT,
			current_crop TEXT,
			status TEXT DEFAULT 'fallow',
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS crop_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			field_id INTEGER NOT NULL,
			crop_type TEXT NOT NULL,
			variety TEXT,
			planting_date TEXT,
			expected_harvest TEXT,
			actual_harvest TEXT,
			seed_cost REAL DEFAULT 0,
			fertilizer_cost REAL DEFAULT 0,
			labor_cost REAL DEFAULT 0,
			yield_kg REAL DEFAULT 0,
			yield_value REAL DEFAULT 0,
			status TEXT DEFAULT 'planted',
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (field_id) REFERENCES fields(id)
		)`,
		`CREATE TABLE IF NOT EXISTS inventory_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			category TEXT NOT NULL,
			quantity REAL DEFAULT 0,
			unit TEXT,
			minimum_stock REAL DEFAULT 0,
			cost_per_unit REAL DEFAULT 0,
			supplier TEXT,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS feed_types (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			category TEXT,
			nutritional_info TEXT,
			cost_per_kg REAL DEFAULT 0,
			notes TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS feed_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL,
			feed_type_id INTEGER NOT NULL,
			quantity_kg REAL NOT NULL,
			animal_count INTEGER DEFAULT 0,
			feeding_time TEXT,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (feed_type_id) REFERENCES feed_types(id)
		)`,
		`CREATE TABLE IF NOT EXISTS feed_grinding (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL,
			input_material TEXT NOT NULL,
			input_quantity_kg REAL NOT NULL,
			output_quantity_kg REAL DEFAULT 0,
			grinding_cost REAL DEFAULT 0,
			machine_cost REAL DEFAULT 0,
			output_type TEXT,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS vet_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			animal_id INTEGER NOT NULL,
			date TEXT NOT NULL,
			record_type TEXT NOT NULL,
			description TEXT,
			diagnosis TEXT,
			treatment TEXT,
			medicine TEXT,
			dosage TEXT,
			vet_name TEXT,
			cost REAL DEFAULT 0,
			next_due_date TEXT,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (animal_id) REFERENCES animals(id)
		)`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL,
			type TEXT NOT NULL,
			category TEXT NOT NULL,
			description TEXT,
			amount REAL NOT NULL,
			payment_method TEXT,
			related_entity TEXT,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS breeding_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			female_id INTEGER NOT NULL REFERENCES animals(id),
			male_id INTEGER REFERENCES animals(id),
			breeding_date TEXT NOT NULL,
			breeding_method TEXT,
			sire_source TEXT,
			expected_due_date TEXT,
			actual_birth_date TEXT,
			offspring_id INTEGER REFERENCES animals(id),
			pregnancy_status TEXT DEFAULT 'pending',
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS photos (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			entity_type TEXT NOT NULL,
			entity_id INTEGER NOT NULL,
			filename TEXT NOT NULL,
			path TEXT NOT NULL,
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, table := range tables {
		if _, err := db.Exec(table); err != nil {
			return err
		}
	}

	// Run migrations for existing databases
	runMigrations()

	// Create indexes for frequently queried columns
	indexes := []string{
		`CREATE INDEX IF NOT EXISTS idx_milk_records_date ON milk_records(date)`,
		`CREATE INDEX IF NOT EXISTS idx_milk_records_animal ON milk_records(animal_id)`,
		`CREATE INDEX IF NOT EXISTS idx_milk_sales_date ON milk_sales(date)`,
		`CREATE INDEX IF NOT EXISTS idx_crop_records_field ON crop_records(field_id)`,
		`CREATE INDEX IF NOT EXISTS idx_vet_records_animal ON vet_records(animal_id)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`,
		`CREATE INDEX IF NOT EXISTS idx_animals_mother ON animals(mother_id)`,
		`CREATE INDEX IF NOT EXISTS idx_animals_father ON animals(father_id)`,
		`CREATE INDEX IF NOT EXISTS idx_breeding_female ON breeding_records(female_id)`,
		`CREATE INDEX IF NOT EXISTS idx_breeding_status ON breeding_records(pregnancy_status)`,
		`CREATE INDEX IF NOT EXISTS idx_photos_entity ON photos(entity_type, entity_id)`,
	}

	for _, idx := range indexes {
		if _, err := db.Exec(idx); err != nil {
			log.Printf("Warning: Could not create index: %v", err)
		}
	}

	return nil
}

// runMigrations handles schema updates for existing databases
func runMigrations() {
	migrations := []string{
		`ALTER TABLE animals ADD COLUMN mother_id INTEGER REFERENCES animals(id)`,
		`ALTER TABLE animals ADD COLUMN father_id INTEGER REFERENCES animals(id)`,
	}

	for _, m := range migrations {
		_, _ = db.Exec(m) // Ignore errors (column may already exist)
	}

	// Initialize default settings
	defaultSettings := map[string]string{
		"weather_lat":           "-1.2921",
		"weather_lng":           "36.8219",
		"weather_location_name": "Nairobi, Kenya",
	}

	for k, v := range defaultSettings {
		_, _ = db.Exec(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, k, v)
	}
}

func insertDefaultFeedTypes() error {
	defaultFeeds := []struct {
		name     string
		category string
		info     string
		cost     float64
	}{
		{"Dairy Meal", "concentrate", "High protein concentrate feed for dairy cattle", 45.0},
		{"Hay", "roughage", "Dried grass, good fiber source", 15.0},
		{"Napier Grass", "roughage", "Fresh cut elephant grass", 5.0},
		{"Maize Stalks", "roughage", "Dried maize stalks after harvest", 3.0},
		{"Maize Germ", "concentrate", "Byproduct from maize milling", 25.0},
		{"Wheat Bran", "concentrate", "Byproduct from wheat milling", 20.0},
		{"Molasses", "supplement", "Energy supplement, improves palatability", 30.0},
		{"Mineral Lick", "supplement", "Salt and mineral supplement block", 50.0},
		{"Cotton Seed Cake", "concentrate", "High protein feed supplement", 35.0},
		{"Lucerne", "roughage", "High quality legume hay", 25.0},
	}

	for _, feed := range defaultFeeds {
		_, err := db.Exec(`INSERT OR IGNORE INTO feed_types (name, category, nutritional_info, cost_per_kg) VALUES (?, ?, ?, ?)`,
			feed.name, feed.category, feed.info, feed.cost)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	return db
}

// CloseDatabase closes the database connection
func CloseDatabase() {
	if db != nil {
		db.Close()
	}
}
