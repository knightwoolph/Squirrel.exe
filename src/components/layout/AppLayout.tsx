import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore, initializeAppearance } from '../../stores/appStore';
import { initializeDatabase } from '../../db/database';

interface AppLayoutProps {
  children: ReactNode;
}

// Map routes to page titles
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/contacts': 'Contacts',
  '/deals': 'Deals',
  '/victory-oak': 'Victory Oak',
  '/stash': 'Brain Dump',
  '/settings': 'Settings',
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { sidebarExpanded } = useAppStore();

  const pageTitle = pageTitles[location.pathname] || 'SQRL.EXE';

  // Initialize appearance and database on mount
  useEffect(() => {
    initializeAppearance();
    initializeDatabase().catch(console.error);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useAppStore.getState().toggleCommandPalette();
      }

      // Ctrl/Cmd + Shift + S for quick stash
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        useAppStore.getState().openQuickStash();
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        useAppStore.getState().closeCommandPalette();
        useAppStore.getState().closeQuickStash();
        useAppStore.getState().closeMobileSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`app-layout ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
      <Sidebar />

      <div className="app-content">
        <Header title={pageTitle} />

        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
