import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Beef,
  Milk,
  Wheat,
  Package,
  Utensils,
  Heart,
  DollarSign,
  Settings,
  Tractor
} from 'lucide-react';
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
  const location = useLocation();

  return (
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
  );
}
