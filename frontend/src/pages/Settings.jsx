import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, HardDrive, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './Settings.css';

export function Settings() {
    const [dbInfo, setDbInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadDatabaseInfo();
    }, []);

    const loadDatabaseInfo = async () => {
        try {
            const info = await window.go.main.BackupService.GetDatabaseInfo();
            setDbInfo(info);
        } catch (err) {
            console.error('Failed to get database info:', err);
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
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="about-info">
                            <h3>Farmland</h3>
                            <p>Farm Management System</p>
                            <p className="version">Version: {window.go?.main?.UpdateService?.GetCurrentVersion?.() || 'Loading...'}</p>
                            <p className="copyright">© 2026 Daniel Kosgei</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
