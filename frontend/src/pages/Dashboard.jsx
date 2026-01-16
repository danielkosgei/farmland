import React, { useState, useEffect } from 'react';
import { Beef, Milk, Wheat, DollarSign, Calendar, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { WeatherWidget } from '../components/WeatherWidget';
import { Skeleton } from '../components/ui/Skeleton';
import './Dashboard.css';

export function Dashboard() {
    const [stats, setStats] = useState(null);
    const [milkData, setMilkData] = useState([]);
    const [chartTimeframe, setChartTimeframe] = useState('week'); // week, month, year
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsData, chartData, activityData] = await Promise.all([
                window.go.main.DashboardService.GetDashboardStats(),
                window.go.main.DashboardService.GetMilkProductionChart(chartTimeframe),
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

    useEffect(() => {
        const updateChart = async () => {
            try {
                const chartData = await window.go.main.DashboardService.GetMilkProductionChart(chartTimeframe);
                console.log(`Milk Chart Update (${chartTimeframe}):`, chartData);
                setMilkData(chartData || []);
            } catch (err) {
                console.error('Error updating chart:', err);
            }
        };
        if (!loading) updateChart();
    }, [chartTimeframe]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="dashboard">
                <header className="page-header">
                    <div className="page-header-content">
                        <Skeleton variant="text" width="200px" height="2.5rem" />
                        <Skeleton variant="text" width="350px" height="1rem" className="mt-2" />
                    </div>
                </header>

                <div className="stats-grid stats-grid--two">
                    {[1, 2].map(i => (
                        <Card key={i} className="stat-card-skeleton">
                            <CardContent>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <Skeleton variant="text" width="60%" height="0.75rem" />
                                        <Skeleton variant="text" width="40%" height="1.5rem" className="mt-2" />
                                        <Skeleton variant="text" width="50%" height="0.75rem" className="mt-2" />
                                    </div>
                                    <Skeleton variant="rounded" width="40px" height="40px" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="dashboard-grid">
                    <Card className="chart-card">
                        <CardHeader>
                            <Skeleton variant="text" width="250px" height="1.25rem" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton variant="rounded" width="100%" height="280px" />
                        </CardContent>
                    </Card>

                    <div className="side-cards">
                        <Skeleton variant="rounded" width="100%" height="180px" />
                        <Card className="activity-card">
                            <CardHeader>
                                <Skeleton variant="text" width="150px" height="1.25rem" />
                            </CardHeader>
                            <CardContent>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-4 mb-4">
                                        <Skeleton variant="circular" width="12px" height="12px" />
                                        <Skeleton variant="text" width="80%" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
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

            <div className="stats-grid stats-grid--two">
                <StatCard
                    title="Today's Milk"
                    value={`${(stats?.todayMilkLiters || 0).toFixed(1)} L`}
                    subtitle={`${(stats?.monthMilkLiters || 0).toFixed(0)} L this month`}
                    icon={Milk}
                    color="primary"
                />
                <StatCard
                    title="Monthly Revenue"
                    value={formatCurrency(stats?.monthIncome || 0)}
                    subtitle={`vs ${formatCurrency(stats?.monthExpenses || 0)} expenses`}
                    icon={DollarSign}
                    color="secondary"
                />
            </div>

            <div className="dashboard-grid">
                <Card className="chart-card">
                    <CardHeader>
                        <div className="card-header-row">
                            <CardTitle>Milk Production</CardTitle>
                            <div className="chart-timeframe-toggles">
                                <button
                                    className={`timeframe-btn ${chartTimeframe === 'week' ? 'active' : ''}`}
                                    onClick={() => setChartTimeframe('week')}
                                >
                                    Week
                                </button>
                                <button
                                    className={`timeframe-btn ${chartTimeframe === 'month' ? 'active' : ''}`}
                                    onClick={() => setChartTimeframe('month')}
                                >
                                    Month
                                </button>
                                <button
                                    className={`timeframe-btn ${chartTimeframe === 'year' ? 'active' : ''}`}
                                    onClick={() => setChartTimeframe('year')}
                                >
                                    Year
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="chart-container">
                            {milkData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={milkData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: 'var(--color-neutral-500)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={chartTimeframe === 'month' ? 15 : 5}
                                            tickFormatter={(val) => {
                                                if (!val) return '';
                                                if (chartTimeframe === 'year') {
                                                    const parts = val.split('-');
                                                    if (parts.length < 2) return val;
                                                    const y = parseInt(parts[0]);
                                                    const m = parseInt(parts[1]);
                                                    return new Date(y, m - 1).toLocaleString('default', { month: 'short' });
                                                }
                                                return val.slice(5);
                                            }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: 'var(--color-neutral-500)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => `${val}L`}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{
                                                borderRadius: 'var(--radius-lg)',
                                                border: 'var(--border-thin)',
                                                boxShadow: 'var(--shadow-lg)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(4px)',
                                                padding: 'var(--space-2) var(--space-3)'
                                            }}
                                            itemStyle={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)' }}
                                            labelStyle={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-1)' }}
                                            formatter={(value) => [`${value} Liters`, 'Production']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="liters"
                                            stroke="var(--color-primary-500)"
                                            strokeWidth={3}
                                            fill="url(#milkGradient)"
                                            animationDuration={1500}
                                        />
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
