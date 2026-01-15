import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Beef,
  Milk,
  Wheat,
  Package,
  Utensils,
  Heart,
  DollarSign,
  Tractor,
  Download,
  RefreshCw,
  Baby,
  Settings,
  Bell
} from 'lucide-react';
import { UpdateManager, UpdateBadge } from './UpdateManager';
import logo from '../assets/logo.png';
import './Sidebar.css';

const navGroups = [
  {
    title: 'General',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'Farm Management',
    items: [
      { path: '/livestock', icon: Beef, label: 'Livestock' },
      { path: '/milk-sales', icon: Milk, label: 'Milk Sales' },
      { path: '/crops', icon: Wheat, label: 'Crops' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { path: '/inventory', icon: Package, label: 'Inventory' },
      { path: '/feed', icon: Utensils, label: 'Feed Management' },
      { path: '/health', icon: Heart, label: 'Health & Vet' },
    ]
  },
  {
    title: 'System',
    items: [
      { path: '/finances', icon: DollarSign, label: 'Finances' },
      { path: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

export function Sidebar() {
  const [version, setVersion] = useState('');
  const [hasUpdate, setHasUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    loadVersion();
    checkForUpdates();
    loadNotificationCount();
  }, []);

  const loadNotificationCount = async () => {
    try {
      const data = await window.go.main.NotificationService.GetAllNotifications();
      setNotifCount(data?.length || 0);
    } catch (err) {
      console.error('Failed to load notification count:', err);
    }
  };

  const loadVersion = async () => {
    try {
      const ver = await window.go.main.UpdateService.GetCurrentVersion();
      setVersion(ver);
    } catch (err) {
      console.error('Failed to get version:', err);
    }
  };

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const info = await window.go.main.UpdateService.CheckForUpdates();
      setHasUpdate(info?.hasUpdate || false);
    } catch (err) {
      console.error('Failed to check updates:', err);
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Farmland" className="logo-img" />
            <div className="logo-text">
              <span className="logo-title">Farmland</span>
              <span className="logo-subtitle">Management</span>
            </div>
          </div>
          <NavLink to="/notifications" className="header-notif-btn" title="View Alerts">
            <Bell size={18} />
            {notifCount > 0 && <span className="header-notif-badge">{notifCount}</span>}
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="nav-group">
              <h4 className="nav-group-title">{group.title}</h4>
              <ul className="nav-list">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                      }
                    >
                      <item.icon size={20} className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="version-row">
            <div className="version-info-line">
              <span className="version-label">Version {version || '...'}</span>
              <button
                className="check-update-btn"
                onClick={() => setShowUpdateModal(true)}
                title="Check for updates"
                disabled={checkingUpdate}
              >
                <RefreshCw size={14} className={checkingUpdate ? 'spin' : ''} />
              </button>
            </div>
            {hasUpdate && (
              <UpdateBadge hasUpdate={hasUpdate} onClick={() => setShowUpdateModal(true)} />
            )}
          </div>
        </div>
      </aside >

      <UpdateManager
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </>
  );
}
