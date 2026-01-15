import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Meta (Cmd on Mac, Ctrl on Win)
            const isMod = e.metaKey || e.ctrlKey;

            // Global Actions
            if (isMod && e.key === 'k') {
                e.preventDefault();
                // Trigger global search if we had a search bar, 
                // for now maybe focus search on page if exists
                const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
                if (searchInput) searchInput.focus();
            }

            if (e.key === 'Escape') {
                // Modals usually handle escape themselves, 
                // but we could trigger blur on active inputs
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }

            // Numeric Navigation (Shift + 1-9)
            if (e.shiftKey && e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                const navItems = [
                    '/',
                    '/livestock',
                    '/milk-sales',
                    '/crops',
                    '/inventory',
                    '/feed',
                    '/health',
                    '/finances',
                    '/settings'
                ];
                if (navItems[index]) {
                    e.preventDefault();
                    navigate(navItems[index]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);
}
