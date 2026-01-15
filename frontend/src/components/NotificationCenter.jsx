import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Box, Activity, AlertCircle, ChevronRight, Check } from 'lucide-react';
import './NotificationCenter.css';

export function NotificationCenter() {
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
            case 'vaccination': return <Activity size={18} className="text-secondary" />;
            case 'vet_followup': return <AlertCircle size={18} className="text-info" />;
            case 'breeding': return <Calendar size={18} className="text-primary" />;
            case 'low_stock': return <Box size={18} className="text-warning" />;
            default: return <Bell size={18} />;
        }
    };

    if (loading) {
        return <div className="notification-center loading">Loading reminders...</div>;
    }

    return (
        <div className="notification-center">
            <div className="notif-header">
                <h3><Bell size={20} /> Reminders & Alerts</h3>
                {notifications.length > 0 && (
                    <span className="notif-badge">{notifications.length}</span>
                )}
            </div>

            <div className="notif-list">
                {notifications.length === 0 ? (
                    <div className="no-notifs">
                        <Check size={24} />
                        <p>All caught up! No pending reminders.</p>
                    </div>
                ) : (
                    notifications.map((notif, idx) => (
                        <div key={idx} className={`notif-item priority-${notif.priority}`}>
                            <div className="notif-icon-wrap">
                                {getIcon(notif.type)}
                            </div>
                            <div className="notif-content">
                                <div className="notif-title-row">
                                    <span className="notif-title">{notif.title}</span>
                                    {notif.dueDate && (
                                        <span className="notif-date">
                                            {notif.daysUntil === 0 ? 'Today' :
                                                notif.daysUntil === 1 ? 'Tomorrow' :
                                                    `in ${notif.daysUntil} days`}
                                        </span>
                                    )}
                                </div>
                                <p className="notif-desc">{notif.description}</p>
                            </div>
                            <ChevronRight size={16} className="notif-arrow" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
