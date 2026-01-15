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
  RefreshCw
} from 'lucide-react';
import { UpdateManager, UpdateBadge } from './UpdateManager';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/livestock', icon: Beef, label: 'Livestock' },
  { path: '/milk-sales', icon: Milk, label: 'Milk Sales' },
  { path: '/crops', icon: Wheat, label: 'Crops' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/feed', icon: Utensils, label: 'Feed Management' },
  { path: '/health', icon: Heart, label: 'Health & Vet' },
  { path: '/finances', icon: DollarSign, label: 'Finances' },
];

export function Sidebar() {
  const [version, setVersion] = useState('');
  const [hasUpdate, setHasUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    loadVersion();
    checkForUpdates();
  }, []);

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
            <div className="logo-icon">
              <Tractor size={28} />
            </div>
            <div className="logo-text">
              <span className="logo-title">Farmland</span>
              <span className="logo-subtitle">Management</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
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
        </nav>

        <div className="sidebar-footer">
          <div className="version-row">
            <span className="version-label">Version {version || '...'}</span>
            <div className="version-actions">
              {hasUpdate && (
                <UpdateBadge hasUpdate={hasUpdate} onClick={() => setShowUpdateModal(true)} />
              )}
              <button
                className="check-update-btn"
                onClick={() => setShowUpdateModal(true)}
                title="Check for updates"
                disabled={checkingUpdate}
              >
                <RefreshCw size={14} className={checkingUpdate ? 'spin' : ''} />
              </button>
            </div>
          </div>
          <div className="user-info">
            <div className="user-avatar">
              <span>F</span>
            </div>
            <div className="user-details">
              <span className="user-name">Farm Manager</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      <UpdateManager
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </>
  );
}
