import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Box, Activity, AlertCircle, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import './Notifications.css';

export function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await window.go.main.NotificationService.GetAllNotifications();
            setNotifications(data || []);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'vaccination': return <Activity size={20} className="text-secondary" />;
            case 'vet_followup': return <AlertCircle size={20} className="text-info" />;
            case 'breeding': return <Calendar size={20} className="text-primary" />;
            case 'low_stock': return <Box size={20} className="text-warning" />;
            default: return <Bell size={20} />;
        }
    };

    if (loading) {
        return (
            <div className="notifications-page loading">
                <div className="loading-spinner"></div>
                <p>Loading alerts...</p>
            </div>
        );
    }

    return (
        <div className="notifications-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Reminders & Alerts</h1>
                    <p>Stay updated with your farm activities and scheduled tasks</p>
                </div>
            </header>

            <div className="notifications-content">
                {notifications.length === 0 ? (
                    <Card className="empty-notifications">
                        <CardContent>
                            <div className="no-notifs-full">
                                <Check size={48} className="text-primary-500" />
                                <h2>All Caught Up!</h2>
                                <p>You have no pending alerts or reminders at this time.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="notifications-grid">
                        {notifications.map((notif, idx) => (
                            <Card key={idx} className={`notif-card priority-${notif.priority}`}>
                                <CardContent>
                                    <div className="notif-layout">
                                        <div className="notif-icon-sidebar">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="notif-main">
                                            <div className="notif-meta-row">
                                                <span className="notif-tag">{notif.type.replace('_', ' ')}</span>
                                                {notif.dueDate && (
                                                    <span className={`notif-due-tag ${notif.daysUntil <= 1 ? 'urgent' : ''}`}>
                                                        {notif.daysUntil === 0 ? 'Today' :
                                                            notif.daysUntil === 1 ? 'Tomorrow' :
                                                                `In ${notif.daysUntil} days`}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="notif-title-text">{notif.title}</h3>
                                            <p className="notif-body-text">{notif.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
