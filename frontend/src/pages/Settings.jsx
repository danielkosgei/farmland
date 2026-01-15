import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, HardDrive, RefreshCw, CheckCircle, AlertCircle, Search, MapPin, Sun, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog, AlertDialog } from '../components/ui/ConfirmDialog';
import { toast } from 'sonner';
import './Settings.css';

export function Settings() {
    const [dbInfo, setDbInfo] = useState(null);
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [confirmRestore, setConfirmRestore] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);

    useEffect(() => {
        loadDatabaseInfo();
        loadVersion();
        loadWeatherLocation();
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
        const loadingToast = toast.loading('Creating database backup...');
        try {
            const result = await window.go.main.BackupService.CreateBackup();
            if (result) {
                toast.success('Backup successful', {
                    id: loadingToast,
                    description: `Saved to ${result.path}`
                });
            } else {
                toast.info('Backup cancelled', { id: loadingToast });
            }
        } catch (err) {
            toast.error(err.message || 'Backup failed', { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setConfirmRestore(true);
    };

    const confirmRestoreDatabase = async () => {
        setConfirmRestore(false);
        setLoading(true);
        const loadingToast = toast.loading('Restoring database...');
        try {
            const result = await window.go.main.BackupService.RestoreBackup();
            if (result) {
                toast.success('Database restored successfully', {
                    id: loadingToast,
                    description: 'Reload the app to see changes.'
                });
                loadDatabaseInfo();
            } else {
                toast.info('Restore cancelled', { id: loadingToast });
            }
        } catch (err) {
            toast.error(err.message || 'Restore failed', { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };


    const loadWeatherLocation = async () => {
        if (!window.go?.main?.WeatherService) return;
        try {
            const weather = await window.go.main.WeatherService.GetWeather();
            if (weather && weather.location && weather.location !== "Local Area") {
                setCurrentLocation(weather.location);
            }
        } catch (err) {
            console.error('Failed to get weather location:', err);
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
        const loadingToast = toast.loading(`Updating location to ${loc.name}...`);
        try {
            const locName = `${loc.name}, ${loc.country}`;
            await window.go.main.WeatherService.SaveWeatherLocation(loc.latitude, loc.longitude, locName);
            toast.success('Location updated', { id: loadingToast });
            setCurrentLocation(locName);
            setSearchResults([]);
            setSearchQuery('');
        } catch (err) {
            toast.error('Failed to save location', { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleTestNotification = async () => {
        setLoading(true);
        try {
            const result = await window.go.main.NotificationService.TestNotification();
            setMessage({ type: 'success', text: result });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to send test notification' });
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

            <div className="settings-grid">
                <Card>
                    <CardHeader>
                        <CardTitle><Database size={20} /> Database</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="db-info">
                            <div className="db-stat">
                                <HardDrive size={16} />
                                <span className="font-mono text-sm">Size: {dbInfo ? formatBytes(dbInfo.size) : 'Loading...'}</span>
                            </div>
                            <div className="db-stat">
                                <RefreshCw size={16} />
                                <span className="font-mono text-sm">Modified: {dbInfo ? formatDate(dbInfo.timestamp) : 'Loading...'}</span>
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
                            Create local copies of your data for safety or move your database to another device.
                        </p>
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle><Sun size={20} /> Weather Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="location-search">
                            {currentLocation && (
                                <div className="current-location-display mb-4">
                                    <span className="data-label block mb-2">Current Location</span>
                                    <div className="current-location-pill">
                                        <MapPin size={16} className="text-primary-500" />
                                        <span className="font-bold text-sm">{currentLocation}</span>
                                    </div>
                                </div>
                            )}
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
                        <CardTitle><Bell size={20} /> Desktop Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="notification-settings">
                            <p className="settings-note mb-4">
                                Enable system notifications to get alerts for low stock and upcoming tasks even when the app is minimized.
                            </p>
                            <Button
                                icon={Bell}
                                onClick={handleTestNotification}
                                variant="outline"
                                disabled={loading}
                                className="w-full"
                            >
                                Send Test Notification
                            </Button>
                        </div>
                        <p className="settings-note mt-4">
                            Note: Ensure that system notifications are allowed for "Farmland" in your Windows settings.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="about-info">
                            <h3 className="about-title">Farmland</h3>
                            <p className="about-subtitle">Farm Management System</p>
                            <div className="about-details mt-4">
                                <span className="version-badge">Version {version || 'Loading...'}</span>
                                <p className="copyright mt-6">© 2026 Daniel Kosgei • Licensed under MIT</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                isOpen={confirmRestore}
                onClose={() => setConfirmRestore(false)}
                onConfirm={confirmRestoreDatabase}
                title="Restore Database"
                message="Are you sure you want to restore the database from a backup? This will replace all your current farm data. This action cannot be undone."
                type="danger"
                confirmText="Restore Data"
            />
        </div>
    );
}
