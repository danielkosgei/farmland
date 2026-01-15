import React, { useState, useEffect } from 'react';
import { Beef, Milk, Wheat, DollarSign, Calendar, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { WeatherWidget } from '../components/WeatherWidget';
import './Dashboard.css';

export function Dashboard() {
    const [stats, setStats] = useState(null);
    const [milkData, setMilkData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsData, chartData, activityData] = await Promise.all([
                window.go.main.DashboardService.GetDashboardStats(),
                window.go.main.DashboardService.GetMilkProductionChart(),
                window.go.main.DashboardService.GetRecentActivity()
            ]);
            setStats(statsData);
            setMilkData(chartData || []);
            setRecentActivity(activityData || []);
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Dashboard</h1>
                    <p>Welcome back! Here's what's happening on your farm today.</p>
                </div>
                <div className="dashboard-date">
                    <Calendar size={18} />
                    <span>{new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </header>

            <div className="stats-grid">
                <StatCard
                    title="Total Livestock"
                    value={stats?.totalAnimals || 0}
                    subtitle={`${stats?.activeCows || 0} dairy cows`}
                    icon={Beef}
                    color="primary"
                />
                <StatCard
                    title="Today's Milk"
                    value={`${(stats?.todayMilkLiters || 0).toFixed(1)} L`}
                    subtitle={`${(stats?.monthMilkLiters || 0).toFixed(0)} L this month`}
                    icon={Milk}
                    color="secondary"
                />
                <StatCard
                    title="Active Fields"
                    value={stats?.activeFields || 0}
                    subtitle={`${(stats?.totalFieldsAcres || 0).toFixed(1)} total acres`}
                    icon={Wheat}
                    color="info"
                />
            </div>

            <div className="dashboard-grid">
                <Card className="chart-card">
                    <CardHeader>
                        <div className="card-header-row">
                            <CardTitle>Milk Production (Last 7 Days)</CardTitle>
                            <TrendingUp size={20} className="text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="chart-container">
                            {milkData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={milkData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => val.slice(5)} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
                                            formatter={(value) => [`${value} L`, 'Milk']}
                                        />
                                        <Area type="monotone" dataKey="liters" stroke="#22c55e" strokeWidth={2} fill="url(#milkGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="no-chart-data">
                                    <p>No milk production data yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="side-cards">
                    <WeatherWidget />

                    <Card className="activity-card">
                        <CardHeader>
                            <div className="card-header-row">
                                <CardTitle>Recent Activity</CardTitle>
                                <Activity size={20} className="text-muted" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="activity-list">
                                {recentActivity.length > 0 ? recentActivity.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="activity-item">
                                        <div className={`activity-dot activity-dot--${item.type}`}></div>
                                        <div className="activity-content">
                                            <p className="activity-desc">{item.description}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="no-activity">No recent activity</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
