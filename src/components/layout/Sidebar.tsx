import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/tasks', icon: '✅', label: 'Tasks' },
  { path: '/projects', icon: '📁', label: 'Projects' },
  { path: '/timer', icon: '⏱️', label: 'Timer' },
  { path: '/stash', icon: '🧠', label: 'Brain Dump' },
];

const crmNavItems: NavItem[] = [
  { path: '/contacts', icon: '👥', label: 'Contacts' },
  { path: '/deals', icon: '💰', label: 'Deals' },
];

const bottomNavItems: NavItem[] = [
  { path: '/victory-oak', icon: '🌳', label: 'Victory Oak' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export function Sidebar() {
  const { sidebarExpanded, sidebarMobileOpen, closeMobileSidebar } = useAppStore();

  const isExpanded = sidebarExpanded || sidebarMobileOpen;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-overlay"
          style={{ zIndex: 'var(--z-modal-backdrop)' }}
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`sidebar ${isExpanded ? 'expanded' : ''} ${sidebarMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">🐿️</div>
          <span className="sidebar-title">SQRL.EXE</span>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
                onClick={closeMobileSidebar}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>

          {/* CRM Section */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">CRM</div>
            {crmNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
                onClick={closeMobileSidebar}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="sidebar-footer">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
              onClick={closeMobileSidebar}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>
    </>
  );
}
