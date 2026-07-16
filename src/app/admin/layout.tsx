'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar, { sidebarContentOffsetClass } from '@/components/Sidebar';
import { authService } from '@/lib/auth';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/billing', label: 'Billing' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (!authService.isAdmin(user)) {
        router.push('/dashboard');
        return;
      }
      setReady(true);
    })();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Checking admin access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Sidebar active="admin" />
      <div className={cn(sidebarContentOffsetClass, 'min-h-screen')}>
        <header className="border-b border-[#e4e7e0] bg-white/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b8f72]">
                  Platform
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[#162518]">Admin</h1>
              </div>
              <nav className="flex gap-1 p-1 rounded-xl bg-[#eef1ea]">
                {tabs.map((tab) => {
                  const active = tab.exact
                    ? pathname === tab.href
                    : pathname === tab.href || pathname.startsWith(tab.href + '/');
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                        active
                          ? 'bg-[#162518] text-lime-400 shadow-sm'
                          : 'text-[#4a5c4e] hover:text-[#162518]',
                      )}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
