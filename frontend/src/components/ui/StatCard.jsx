import React from 'react';
import './StatCard.css';

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'primary' }) {
    return (
        <div className={`stat-card stat-card--${color}`}>
            <div className="stat-card-header">
                <div className="stat-card-icon">
                    {Icon && <Icon size={24} />}
                </div>
                {trend !== undefined && (
                    <div className={`stat-card-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
                        {trendUp ? '↑' : '↓'} {trend}%
                    </div>
                )}
            </div>
            <div className="stat-card-content">
                <h3 className="stat-card-value">{value}</h3>
                <p className="stat-card-title">{title}</p>
                {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
            </div>
        </div>
    );
}
