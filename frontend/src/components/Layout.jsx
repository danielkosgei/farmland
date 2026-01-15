import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import './Layout.css';

export function Layout() {
    useKeyboardShortcuts();

    return (
        <div className="app-layout">
            <Toaster
                position="top-center"
                richColors
            />
            <Sidebar />
            <main className="main-content">
                <div className="page-container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
