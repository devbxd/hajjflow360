'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, Users, UserCheck, ChevronLeft, ChevronRight, Plane, Building2, Bus, QrCode, Bell, Settings, LogOut, AlertTriangle, ClipboardList, Layers, CreditCard } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  group: string;
}

const navItems: NavItem[] = [
  { label: 'Campaign Dashboard', href: '/', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Pilgrim Management', href: '/pilgrim-management', icon: Users, badge: 23, group: 'Pilgrims' },
  { label: 'Pilgrim Profile', href: '/pilgrim-profile', icon: ClipboardList, group: 'Pilgrims' },
  { label: 'Group Leaders', href: '/group-leader-dashboard', icon: UserCheck, group: 'Pilgrims' },
  { label: 'Allocation Management', href: '/allocation-management', icon: Layers, group: 'Logistics' },
  { label: 'Flight Manifests', href: '/allocation-management', icon: Plane, group: 'Logistics' },
  { label: 'Hotel Allocation', href: '/allocation-management', icon: Building2, group: 'Logistics' },
  { label: 'Bus Seating', href: '/allocation-management', icon: Bus, group: 'Logistics' },
  { label: 'Payments', href: '/payments', icon: CreditCard, badge: 61, group: 'Operations' },
  { label: 'QR Check-in', href: '/campaign-dashboard', icon: QrCode, group: 'Operations' },
  { label: 'Emergency Lists', href: '/campaign-dashboard', icon: AlertTriangle, badge: 4, group: 'Operations' },
  { label: 'Notifications', href: '/campaign-dashboard', icon: Bell, badge: 7, group: 'Operations' },
  { label: 'Settings', href: '/campaign-dashboard', icon: Settings, group: 'System' },
];

const groups = ['Overview', 'Pilgrims', 'Logistics', 'Operations', 'System'];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`sidebar-transition flex-shrink-0 flex flex-col bg-card border-r border-border h-screen sticky top-0 overflow-hidden ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-border px-3 py-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <AppLogo size={32} />
          {!collapsed && (
            <span className="font-semibold text-sm text-foreground truncate">HajjOps</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Campaign Badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-secondary border border-primary/20">
          <p className="text-xs text-muted-foreground font-medium">Active Campaign</p>
          <p className="text-sm font-semibold text-primary">Hajj 2027</p>
          <p className="text-xs text-muted-foreground">850 pilgrims · Sep–Oct 2027</p>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group);
          // Deduplicate by label for display
          const seen = new Set<string>();
          const uniqueItems = items.filter((item) => {
            if (seen.has(item.label)) return false;
            seen.add(item.label);
            return true;
          });
          return (
            <div key={`group-${group}`}>
              {!collapsed && (
                <p className="px-3 pb-1 text-xs font-600 uppercase tracking-widest text-muted-foreground/60">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {uniqueItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={`nav-${item.label}`}
                      href={item.href}
                      className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className={`border-t border-border p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-primary-foreground">OM</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Omar Mahmoud</p>
            <p className="text-xs text-muted-foreground truncate">Campaign Manager</p>
          </div>
        )}
        {!collapsed && (
          <button className="p-1 rounded hover:bg-muted text-muted-foreground" title="Sign out">
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}