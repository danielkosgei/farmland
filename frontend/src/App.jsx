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
import { AnimalDetails } from './pages/AnimalDetails';
import { FieldDetails } from './pages/FieldDetails';
import { toast } from 'sonner';

function App() {
    React.useEffect(() => {
        const checkInstallation = async () => {
            try {
                const isInstalled = await window.go.main.UpdateService.IsInstalled();
                const isDev = (await window.go.main.UpdateService.GetCurrentVersion()) === 'dev';

                if (!isInstalled && !isDev) {
                    toast.info('Farmland is running from a temporary location.', {
                        description: 'Would you like to install it to your system for easy access?',
                        action: {
                            label: 'Install Now',
                            onClick: async () => {
                                const loading = toast.loading('Installing Farmland...');
                                try {
                                    await window.go.main.UpdateService.InstallToSystem();
                                    // App will exit/restart on success
                                } catch (err) {
                                    toast.error('Failed to install: ' + err, { id: loading });
                                }
                            }
                        },
                        duration: 10000
                    });
                }
            } catch (err) {
                console.error('Failed to check installation status:', err);
            }
        };

        checkInstallation();
    }, []);

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="livestock" element={<Livestock />} />
                <Route path="livestock/:id" element={<AnimalDetails />} />
                <Route path="milk-sales" element={<MilkSales />} />
                <Route path="crops" element={<Crops />} />
                <Route path="crops/field/:id" element={<FieldDetails />} />
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
