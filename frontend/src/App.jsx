import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Livestock } from './pages/Livestock';
import { MilkSales } from './pages/MilkSales';
import { Crops } from './pages/Crops';
import { Inventory } from './pages/Inventory';
import { Feed } from './pages/Feed';
import { Health } from './pages/Health';
import { Finances } from './pages/Finances';
import { Breeding } from './pages/Breeding';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="livestock" element={<Livestock />} />
                <Route path="milk-sales" element={<MilkSales />} />
                <Route path="crops" element={<Crops />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="feed" element={<Feed />} />
                <Route path="health" element={<Health />} />
                <Route path="finances" element={<Finances />} />
                <Route path="breeding" element={<Breeding />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
            </Route>
        </Routes>
    );
}

export default App;
