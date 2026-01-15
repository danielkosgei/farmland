import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, HardDrive, RefreshCw, CheckCircle, AlertCircle, Search, MapPin, Sun } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './Settings.css';

export function Settings() {
    const [dbInfo, setDbInfo] = useState(null);
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadDatabaseInfo();
        loadVersion();
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearchLocation();
            } else if (searchQuery.trim().length === 0) {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadDatabaseInfo = async () => {
        if (!window.go?.main?.BackupService) return;
        try {
            const info = await window.go.main.BackupService.GetDatabaseInfo();
            setDbInfo(info);
        } catch (err) {
            console.error('Failed to get database info:', err);
        }
    };

    const loadVersion = async () => {
        if (!window.go?.main?.UpdateService) return;
        try {
            const v = await window.go.main.UpdateService.GetCurrentVersion();
            setVersion(v);
        } catch (err) {
            console.error('Failed to get version:', err);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleString('en-KE', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const handleBackup = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await window.go.main.BackupService.CreateBackup();
            if (result) {
                setMessage({ type: 'success', text: `Backup saved to ${result.path}` });
            } else {
                setMessage({ type: 'info', text: 'Backup cancelled' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Backup failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!window.confirm('This will replace your current database. Continue?')) {
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const result = await window.go.main.BackupService.RestoreBackup();
            if (result) {
                setMessage({ type: 'success', text: 'Database restored successfully. Reload the app to see changes.' });
                loadDatabaseInfo();
            } else {
                setMessage({ type: 'info', text: 'Restore cancelled' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Restore failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearchLocation = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const results = await window.go.main.WeatherService.SearchLocations(searchQuery);
            setSearchResults(results || []);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSaveLocation = async (loc) => {
        setLoading(true);
        try {
            await window.go.main.WeatherService.SaveWeatherLocation(loc.latitude, loc.longitude, `${loc.name}, ${loc.country}`);
            setMessage({ type: 'success', text: `Weather location updated to ${loc.name}` });
            setSearchResults([]);
            setSearchQuery('');
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save location' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage application settings and data</p>
                </div>
            </div>

            {message && (
                <div className={`settings-message ${message.type}`}>
                    {message.type === 'success' && <CheckCircle size={18} />}
                    {message.type === 'error' && <AlertCircle size={18} />}
                    {message.type === 'info' && <RefreshCw size={18} />}
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)}>×</button>
                </div>
            )}

            <div className="settings-grid">
                <Card>
                    <CardHeader>
                        <CardTitle><Database size={20} /> Database</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="db-info">
                            <div className="db-stat">
                                <HardDrive size={16} />
                                <span>Size: {dbInfo ? formatBytes(dbInfo.size) : 'Loading...'}</span>
                            </div>
                            <div className="db-stat">
                                <RefreshCw size={16} />
                                <span>Modified: {dbInfo ? formatDate(dbInfo.timestamp) : 'Loading...'}</span>
                            </div>
                        </div>

                        <div className="backup-actions">
                            <Button icon={Download} onClick={handleBackup} disabled={loading}>
                                {loading ? 'Processing...' : 'Create Backup'}
                            </Button>
                            <Button icon={Upload} variant="outline" onClick={handleRestore} disabled={loading}>
                                Restore from Backup
                            </Button>
                        </div>

                        <p className="backup-note">
                            Backups include all your farm data. Store backups in a safe location.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle><Sun size={20} /> Weather Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="location-search">
                            <div className="search-input-wrapper">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search for your city/town..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                // Removed Enter key handler as it's now automatic
                                />
                                {searching && <RefreshCw size={16} className="searching-spinner spin" />}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map((loc) => (
                                        <div key={loc.id} className="search-result-item" onClick={() => handleSaveLocation(loc)}>
                                            <div className="search-result-icon">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="res-details">
                                                <span className="res-name">{loc.name}</span>
                                                <span className="res-admin">{loc.admin1}, {loc.country}</span>
                                            </div>
                                            <span className="res-coords">{loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="settings-note">
                            Set your farm's location to get accurate weather forecasts on the dashboard.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="about-info">
                            <h3>Farmland</h3>
                            <p>Farm Management System</p>
                            <p className="version">Version: {version || 'Loading...'}</p>
                            <p className="copyright">© 2026 Daniel Kosgei</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
