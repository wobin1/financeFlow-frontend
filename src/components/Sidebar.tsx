'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { authService, type User } from '@/lib/auth';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'ff-sidebar-collapsed';
const EXPANDED_W = '220px';
const COLLAPSED_W = '72px';

export type SidebarActive =
  | 'dashboard'
  | 'transactions'
  | 'firs'
  | 'billing'
  | 'admin';

const navItems: {
  id: SidebarActive;
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    id: 'transactions',
    href: '/transactions',
    label: 'Transactions',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
  },
  {
    id: 'firs',
    href: '/firs',
    label: 'FIRS Filing',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  },
  {
    id: 'billing',
    href: '/billing',
    label: 'Billing',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    ),
  },
  {
    id: 'admin',
    href: '/admin',
    label: 'Admin',
    adminOnly: true,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    ),
  },
];

function applySidebarWidth(collapsed: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    '--sidebar-w',
    collapsed ? COLLAPSED_W : EXPANDED_W,
  );
}

export default function Sidebar({ active }: { active: SidebarActive }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === '1';
    setCollapsed(saved);
    applySidebarWidth(saved);
    setHydrated(true);
    authService.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applySidebarWidth(collapsed);
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed, hydrated]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || authService.isAdmin(user),
  );

  return (
    <aside
      className={cn(
        'hidden lg:flex bg-[#162518] flex-col shrink-0 fixed left-0 top-0 bottom-0 z-30',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[72px] items-center px-0' : 'w-[220px] items-stretch px-3',
      )}
      style={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
    >
      <div
        className={cn(
          'flex items-center shrink-0 pt-6 pb-8',
          collapsed ? 'justify-center' : 'gap-3 px-1',
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-[#162518]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">FinanceFlow</p>
            <p className="text-[10px] text-[#6b8f72] truncate">Cashflow &amp; tax</p>
          </div>
        )}
      </div>

      <nav
        className={cn(
          'flex flex-col gap-1.5 flex-1',
          collapsed ? 'items-center' : 'items-stretch',
        )}
      >
        {visibleNav.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'rounded-xl flex items-center transition-all',
                collapsed ? 'w-10 h-10 justify-center' : 'h-10 gap-3 px-3',
                isActive
                  ? 'bg-lime-400 text-[#162518]'
                  : 'text-[#6b8f72] hover:text-lime-400 hover:bg-white/5',
              )}
            >
              <svg
                className={cn('w-5 h-5 shrink-0', isActive && 'text-[#162518]')}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                {item.icon}
              </svg>
              {!collapsed && (
                <span className="text-sm font-semibold truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          'flex flex-col gap-1.5 pb-6 mt-auto',
          collapsed ? 'items-center' : 'items-stretch',
        )}
      >
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'rounded-xl flex items-center transition-all text-[#6b8f72] hover:text-lime-400 hover:bg-white/5',
            collapsed ? 'w-10 h-10 justify-center' : 'h-10 gap-3 px-3',
          )}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            {collapsed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            )}
          </svg>
          {!collapsed && (
            <span className="text-sm font-medium truncate">Collapse</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => authService.logout()}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'rounded-xl flex items-center transition-all text-[#6b8f72] hover:text-red-400 hover:bg-white/5',
            collapsed ? 'w-10 h-10 justify-center' : 'h-10 gap-3 px-3',
          )}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!collapsed && (
            <span className="text-sm font-medium truncate">Sign out</span>
          )}
        </button>
      </div>
    </aside>
  );
}

/** Content offset class — pairs with Sidebar CSS var */
export const sidebarContentOffsetClass =
  'lg:ml-[var(--sidebar-w)] lg:transition-[margin] lg:duration-200 lg:ease-out';
