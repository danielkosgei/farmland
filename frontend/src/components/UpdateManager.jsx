import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, X, Rocket } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import './UpdateManager.css';

export function UpdateManager({ isOpen, onClose }) {
    const [status, setStatus] = useState('idle'); // idle, checking, available, downloading, ready, error
    const [updateInfo, setUpdateInfo] = useState(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && status === 'idle') {
            checkForUpdates();
        }
    }, [isOpen]);

    const checkForUpdates = async () => {
        setStatus('checking');
        setError(null);
        try {
            const info = await window.go.main.UpdateService.CheckForUpdates();
            setUpdateInfo(info);
            setStatus(info.hasUpdate ? 'available' : 'uptodate');
        } catch (err) {
            setError(err.message || 'Failed to check for updates');
            setStatus('error');
        }
    };

    const downloadUpdate = async () => {
        if (!updateInfo?.downloadUrl) {
            setError('No download URL available');
            setStatus('error');
            return;
        }

        setStatus('downloading');
        setProgress(0);

        try {
            // Start download asynchronously (non-blocking)
            await window.go.main.UpdateService.StartDownload(updateInfo.downloadUrl);

            // Poll download status
            const pollStatus = setInterval(async () => {
                const downloadStatus = await window.go.main.UpdateService.GetDownloadStatus();
                setProgress(downloadStatus.progress);

                if (downloadStatus.isError) {
                    clearInterval(pollStatus);
                    setError(downloadStatus.errorMsg || 'Download failed');
                    setStatus('error');
                } else if (downloadStatus.isComplete) {
                    clearInterval(pollStatus);
                    setStatus('ready');
                }
            }, 100);
        } catch (err) {
            setError(err.message || 'Download failed');
            setStatus('error');
        }
    };

    const applyUpdate = async () => {
        setStatus('installing');
        setError(null);
        try {
            await window.go.main.UpdateService.ApplyUpdate();
            await window.go.main.UpdateService.RestartApp();
        } catch (err) {
            console.error('Update apply error:', err);
            setError(typeof err === 'string' ? err : (err.message || JSON.stringify(err)));
            setStatus('error');
        }
    };

    const handleClose = () => {
        if (status !== 'downloading') {
            setStatus('idle');
            setUpdateInfo(null);
            setProgress(0);
            setError(null);
            onClose();
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
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Parse markdown changelog to HTML
    const parseChangelog = (text) => {
        if (!text) return '';

        return text
            // Section headers with emojis
            .replace(/##\s*(.+)/g, '<h5 class="changelog-section">$1</h5>')
            // List items
            .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
            // Wrap consecutive list items in ul
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="changelog-list">$&</ul>')
            // Bold text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Code/backticks
            .replace(/`(.+?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n\n/g, '<br/>')
            .replace(/\n(?!<)/g, '');
    };


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Software Update" size="md">
            <div className="update-manager">
                {status === 'checking' && (
                    <div className="update-status checking">
                        <RefreshCw size={48} className="spin" />
                        <h3>Checking for updates...</h3>
                        <p>Please wait while we check for the latest version.</p>
                    </div>
                )}

                {status === 'uptodate' && (
                    <div className="update-status uptodate">
                        <CheckCircle size={48} />
                        <h3>You're up to date!</h3>
                        <p>Farmland {updateInfo?.currentVersion} is the latest version.</p>
                        <Button variant="outline" onClick={handleClose}>Close</Button>
                    </div>
                )}

                {status === 'available' && updateInfo && (
                    <div className="update-available">
                        <div className="update-header">
                            <Rocket size={32} className="text-primary" />
                            <div>
                                <h3>Update Available!</h3>
                                <p className="version-info">
                                    {updateInfo.currentVersion} → <strong>{updateInfo.latestVersion}</strong>
                                </p>
                            </div>
                        </div>

                        {updateInfo.releaseNotes && (
                            <div className="release-notes">
                                <h4>What's New:</h4>
                                <div className="notes-content" dangerouslySetInnerHTML={{ __html: parseChangelog(updateInfo.releaseNotes) }} />
                            </div>
                        )}

                        <div className="update-meta">
                            <span>Released: {formatDate(updateInfo.publishedAt)}</span>
                            <span>Size: {formatBytes(updateInfo.assetSize)}</span>
                        </div>

                        <div className="update-actions">
                            <Button variant="outline" onClick={handleClose}>Later</Button>
                            <Button icon={Download} onClick={downloadUpdate}>Update Now</Button>
                        </div>
                    </div>
                )}

                {status === 'downloading' && (
                    <div className="update-status downloading">
                        <Download size={48} className="pulse" />
                        <h3>Downloading Update...</h3>
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="progress-text">{Math.round(progress)}%</span>
                        </div>
                        <p className="download-note">Please don't close the application.</p>
                    </div>
                )}

                {status === 'installing' && (
                    <div className="update-status installing">
                        <RefreshCw size={48} className="spin" />
                        <h3>Installing Update...</h3>
                        <p>Preparing the new version. The app will restart automatically.</p>
                    </div>
                )}

                {status === 'ready' && (
                    <div className="update-status ready">
                        <CheckCircle size={48} />
                        <h3>Ready to Install</h3>
                        <p>The update has been downloaded. Click below to install and restart.</p>
                        <div className="update-actions">
                            <Button variant="outline" onClick={handleClose}>Later</Button>
                            <Button icon={Rocket} onClick={applyUpdate}>Install & Restart</Button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="update-status error">
                        <AlertCircle size={48} />
                        <h3>Update Failed</h3>
                        <p className="error-message">{error}</p>
                        <div className="update-actions">
                            <Button variant="outline" onClick={handleClose}>Close</Button>
                            <Button icon={RefreshCw} onClick={checkForUpdates}>Retry</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

// Small component to show update available badge
export function UpdateBadge({ hasUpdate, onClick }) {
    if (!hasUpdate) return null;
    return (
        <button className="update-badge" onClick={onClick} title="Update available - click to update">
            Update Available
        </button>
    );
}
