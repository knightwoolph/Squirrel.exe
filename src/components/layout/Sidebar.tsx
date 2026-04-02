import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Clock,
  Brain,
  Users,
  DollarSign,
  TreePine,
  Settings,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppStore } from '../../stores/appStore';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/timer', icon: Clock, label: 'Timer' },
  { path: '/stash', icon: Brain, label: 'Brain Dump' },
];

const crmNavItems: NavItem[] = [
  { path: '/contacts', icon: Users, label: 'Contacts' },
  { path: '/deals', icon: DollarSign, label: 'Deals' },
];

const bottomNavItems: NavItem[] = [
  { path: '/victory-oak', icon: TreePine, label: 'Victory Oak' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarNavItemProps {
  item: NavItem;
  isExpanded: boolean;
  onClick?: () => void;
}

function SidebarNavItem({ item, isExpanded, onClick }: SidebarNavItemProps) {
  const Icon = item.icon;

  const linkContent = (isActive: boolean) => (
    <span
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
        'transition-all duration-150 ease-out',
        'group relative',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        !isExpanded && 'justify-center px-2.5'
      )}
    >
      <Icon
        className={cn(
          'shrink-0 transition-transform duration-150',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
          isExpanded ? 'h-4 w-4' : 'h-5 w-5'
        )}
      />

      {isExpanded && (
        <span className="min-w-0 flex-1 truncate leading-none">{item.label}</span>
      )}

      {isExpanded && item.badge !== undefined && item.badge > 0 && (
        <span
          className={cn(
            'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
            'text-xs font-semibold leading-none',
            isActive
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {item.badge}
        </span>
      )}
    </span>
  );

  const navLink = (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      {({ isActive }) => linkContent(isActive)}
    </NavLink>
  );

  if (!isExpanded) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{navLink}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return navLink;
}

export function Sidebar() {
  const { sidebarExpanded, sidebarMobileOpen, toggleSidebar, closeMobileSidebar } = useAppStore();

  const isExpanded = sidebarExpanded || sidebarMobileOpen;

  return (
    <TooltipProvider>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-modal-backdrop bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-sticky flex h-full flex-col',
          'border-r border-border bg-card',
          'transition-all duration-300 ease-in-out',
          // Desktop collapsed/expanded
          isExpanded ? 'w-sidebar-expanded' : 'w-sidebar-collapsed',
          // Mobile: off-screen when closed, slide in when open
          'lg:translate-x-0',
          sidebarMobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo / Header */}
        <div
          className={cn(
            'flex h-header shrink-0 items-center border-b border-border',
            'px-3 transition-all duration-300',
            isExpanded ? 'gap-3' : 'justify-center'
          )}
        >
          <span
            className="text-xl leading-none select-none"
            role="img"
            aria-label="Squirrel"
          >
            🐿️
          </span>

          {isExpanded && (
            <span className="font-display text-sm font-semibold tracking-wider text-foreground truncate">
              SQRL.EXE
            </span>
          )}

          {/* Collapse toggle — desktop only */}
          {isExpanded && (
            <button
              onClick={toggleSidebar}
              className={cn(
                'ml-auto hidden lg:flex h-6 w-6 items-center justify-center rounded-sm',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              aria-label="Collapse sidebar"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </button>
          )}

          {!isExpanded && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className={cn(
                    'absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex',
                    'h-6 w-6 items-center justify-center rounded-full',
                    'border border-border bg-card text-muted-foreground shadow-sm',
                    'hover:bg-accent hover:text-foreground transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 overflow-hidden">
          <nav className="flex flex-col gap-1 p-2" aria-label="Main navigation">
            {/* Main nav items */}
            <div className="flex flex-col gap-0.5">
              {mainNavItems.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  item={item}
                  isExpanded={isExpanded}
                  onClick={sidebarMobileOpen ? closeMobileSidebar : undefined}
                />
              ))}
            </div>

            {/* CRM section */}
            <div className="mt-3 flex flex-col gap-0.5">
              {isExpanded && (
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                  CRM
                </p>
              )}
              {!isExpanded && (
                <div className="mx-3 mb-1 border-t border-border/50" aria-hidden="true" />
              )}
              {crmNavItems.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  item={item}
                  isExpanded={isExpanded}
                  onClick={sidebarMobileOpen ? closeMobileSidebar : undefined}
                />
              ))}
            </div>
          </nav>
        </ScrollArea>

        {/* Footer nav */}
        <div className="shrink-0 border-t border-border p-2">
          <div className="flex flex-col gap-0.5">
            {bottomNavItems.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                isExpanded={isExpanded}
                onClick={sidebarMobileOpen ? closeMobileSidebar : undefined}
              />
            ))}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
