package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// WeatherService handles weather data fetching
type WeatherService struct {
	cache      *WeatherData
	cacheTime  time.Time
	cacheMutex sync.RWMutex
}

// NewWeatherService creates a new WeatherService
func NewWeatherService() *WeatherService {
	return &WeatherService{}
}

// WeatherData represents current weather and forecast
type WeatherData struct {
	Current  CurrentWeather  `json:"current"`
	Forecast []DailyForecast `json:"forecast"`
	Location string          `json:"location"`
}

// CurrentWeather represents current conditions
type CurrentWeather struct {
	Temperature float64 `json:"temperature"`
	FeelsLike   float64 `json:"feelsLike"`
	Humidity    int     `json:"humidity"`
	WindSpeed   float64 `json:"windSpeed"`
	WeatherCode int     `json:"weatherCode"`
	Description string  `json:"description"`
	Icon        string  `json:"icon"`
	IsDay       bool    `json:"isDay"`
}

// DailyForecast represents a daily weather forecast
type DailyForecast struct {
	Date        string  `json:"date"`
	TempMax     float64 `json:"tempMax"`
	TempMin     float64 `json:"tempMin"`
	WeatherCode int     `json:"weatherCode"`
	Description string  `json:"description"`
	Icon        string  `json:"icon"`
}

// OpenMeteo API response structures
type openMeteoResponse struct {
	Current struct {
		Temperature2m    float64 `json:"temperature_2m"`
		RelativeHumidity int     `json:"relative_humidity_2m"`
		ApparentTemp     float64 `json:"apparent_temperature"`
		WeatherCode      int     `json:"weather_code"`
		WindSpeed        float64 `json:"wind_speed_10m"`
		IsDay            int     `json:"is_day"`
	} `json:"current"`
	Daily struct {
		Time        []string  `json:"time"`
		TempMax     []float64 `json:"temperature_2m_max"`
		TempMin     []float64 `json:"temperature_2m_min"`
		WeatherCode []int     `json:"weather_code"`
	} `json:"daily"`
}

// SearchResult represents a location from the geocoding API
type SearchResult struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Country   string  `json:"country"`
	Admin1    string  `json:"admin1,omitempty"` // State/Province
}

// SearchLocations searches for cities/towns using Open-Meteo Geocoding API
func (s *WeatherService) SearchLocations(query string) ([]SearchResult, error) {
	if query == "" {
		return []SearchResult{}, nil
	}

	url := fmt.Sprintf("https://geocoding-api.open-meteo.com/v1/search?name=%s&count=5&language=en&format=json", query)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Results []SearchResult `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Results, nil
}

// SaveWeatherLocation saves the selected location to the database
func (s *WeatherService) SaveWeatherLocation(lat, lng float64, name string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	settings := map[string]string{
		"weather_lat":           fmt.Sprintf("%.4f", lat),
		"weather_lng":           "%.4f",
		"weather_location_name": name,
	}

	// Correcting formatting for lng
	settings["weather_lng"] = fmt.Sprintf("%.4f", lng)

	for k, v := range settings {
		_, err = tx.Exec(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`, k, v)
		if err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	// Clear cache to force refresh
	s.cacheMutex.Lock()
	s.cache = nil
	s.cacheMutex.Unlock()

	return nil
}

// GetWeather returns current weather and 5-day forecast
func (s *WeatherService) GetWeather() (*WeatherData, error) {
	var lat, lng float64
	var locationName string

	// Try to get from settings
	err := db.QueryRow(`SELECT value FROM settings WHERE key = 'weather_lat'`).Scan(&lat)
	if err != nil {
		lat = -1.2921 // Nairobi
	}
	err = db.QueryRow(`SELECT value FROM settings WHERE key = 'weather_lng'`).Scan(&lng)
	if err != nil {
		lng = 36.8219
	}
	err = db.QueryRow(`SELECT value FROM settings WHERE key = 'weather_location_name'`).Scan(&locationName)
	if err != nil {
		locationName = "Local Area"
	}

	// Check cache (30 minute validity)
	s.cacheMutex.RLock()
	if s.cache != nil && time.Since(s.cacheTime) < 30*time.Minute {
		cached := s.cache
		s.cacheMutex.RUnlock()
		return cached, nil
	}
	s.cacheMutex.RUnlock()

	// Fetch from Open-Meteo API (free, no API key needed)
	url := fmt.Sprintf(
		"https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f"+
			"&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day"+
			"&daily=temperature_2m_max,temperature_2m_min,weather_code"+
			"&timezone=auto&forecast_days=5",
		lat, lng,
	)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch weather: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("weather API returned status %d", resp.StatusCode)
	}

	var apiResp openMeteoResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse weather data: %w", err)
	}

	// Convert to our format
	weather := &WeatherData{
		Location: locationName,
		Current: CurrentWeather{
			Temperature: apiResp.Current.Temperature2m,
			FeelsLike:   apiResp.Current.ApparentTemp,
			Humidity:    apiResp.Current.RelativeHumidity,
			WindSpeed:   apiResp.Current.WindSpeed,
			WeatherCode: apiResp.Current.WeatherCode,
			Description: weatherCodeToDescription(apiResp.Current.WeatherCode),
			Icon:        weatherCodeToIcon(apiResp.Current.WeatherCode, apiResp.Current.IsDay == 1),
			IsDay:       apiResp.Current.IsDay == 1,
		},
		Forecast: make([]DailyForecast, 0),
	}

	// Add forecast days
	for i := range apiResp.Daily.Time {
		if i >= 5 {
			break
		}
		weather.Forecast = append(weather.Forecast, DailyForecast{
			Date:        apiResp.Daily.Time[i],
			TempMax:     apiResp.Daily.TempMax[i],
			TempMin:     apiResp.Daily.TempMin[i],
			WeatherCode: apiResp.Daily.WeatherCode[i],
			Description: weatherCodeToDescription(apiResp.Daily.WeatherCode[i]),
			Icon:        weatherCodeToIcon(apiResp.Daily.WeatherCode[i], true),
		})
	}

	// Cache result
	s.cacheMutex.Lock()
	s.cache = weather
	s.cacheTime = time.Now()
	s.cacheMutex.Unlock()

	return weather, nil
}

// weatherCodeToDescription converts WMO weather codes to descriptions
func weatherCodeToDescription(code int) string {
	descriptions := map[int]string{
		0:  "Clear sky",
		1:  "Mainly clear",
		2:  "Partly cloudy",
		3:  "Overcast",
		45: "Foggy",
		48: "Depositing rime fog",
		51: "Light drizzle",
		53: "Moderate drizzle",
		55: "Dense drizzle",
		61: "Slight rain",
		63: "Moderate rain",
		65: "Heavy rain",
		71: "Slight snow",
		73: "Moderate snow",
		75: "Heavy snow",
		77: "Snow grains",
		80: "Slight rain showers",
		81: "Moderate rain showers",
		82: "Violent rain showers",
		85: "Slight snow showers",
		86: "Heavy snow showers",
		95: "Thunderstorm",
		96: "Thunderstorm with hail",
		99: "Thunderstorm with heavy hail",
	}
	if desc, ok := descriptions[code]; ok {
		return desc
	}
	return "Unknown"
}

// weatherCodeToIcon returns an emoji icon for the weather code
func weatherCodeToIcon(code int, isDay bool) string {
	switch {
	case code == 0:
		if isDay {
			return "☀️"
		}
		return "🌙"
	case code <= 3:
		if isDay {
			return "⛅"
		}
		return "☁️"
	case code >= 45 && code <= 48:
		return "🌫️"
	case code >= 51 && code <= 55:
		return "🌧️"
	case code >= 61 && code <= 65:
		return "🌧️"
	case code >= 71 && code <= 77:
		return "❄️"
	case code >= 80 && code <= 82:
		return "🌦️"
	case code >= 85 && code <= 86:
		return "🌨️"
	case code >= 95:
		return "⛈️"
	default:
		return "🌤️"
	}
}
