import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, RefreshCw } from 'lucide-react';
import './WeatherWidget.css';

export function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWeather();
    }, []);

    const fetchWeather = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await window.go.main.WeatherService.GetWeather();
            setWeather(data);
        } catch (err) {
            setError('Failed to load weather');
            console.error('Weather fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDay = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    if (loading) {
        return (
            <div className="weather-widget loading">
                <RefreshCw className="spin" size={24} />
                <span>Loading weather...</span>
            </div>
        );
    }

    if (error || !weather) {
        return (
            <div className="weather-widget error">
                <Cloud size={24} />
                <span>{error || 'Weather unavailable'}</span>
                <button onClick={fetchWeather} className="retry-btn">
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="weather-widget">
            <div className="weather-location">{weather.location}</div>
            <div className="weather-current">
                <div className="weather-icon">{weather.current.icon}</div>
                <div className="weather-temp">
                    <span className="temp-value">{Math.round(weather.current.temperature)}°</span>
                    <span className="temp-desc">{weather.current.description}</span>
                </div>
                <div className="weather-details">
                    <div className="weather-detail">
                        <Droplets size={14} />
                        <span>{weather.current.humidity}%</span>
                    </div>
                    <div className="weather-detail">
                        <Wind size={14} />
                        <span>{Math.round(weather.current.windSpeed)} km/h</span>
                    </div>
                </div>
            </div>

            <div className="weather-forecast">
                {weather.forecast.slice(0, 4).map((day, idx) => (
                    <div key={idx} className="forecast-day">
                        <span className="forecast-name">{formatDay(day.date)}</span>
                        <span className="forecast-icon">{day.icon}</span>
                        <span className="forecast-temps">
                            <span className="temp-high">{Math.round(day.tempMax)}°</span>
                            <span className="temp-low">{Math.round(day.tempMin)}°</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
