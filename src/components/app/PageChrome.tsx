'use client';

import type { ReactNode } from 'react';
import Sidebar, {
  sidebarContentOffsetClass,
  type SidebarActive,
} from '@/components/Sidebar';
import { cn } from '@/lib/utils';

export function AppPage({
  active,
  children,
  className,
}: {
  active: SidebarActive;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-screen bg-[#f7f8f5] font-sans', className)}>
      <Sidebar active={active} />
      <div className={cn('flex-1 flex flex-col min-w-0', sidebarContentOffsetClass)}>
        {children}
      </div>
    </div>
  );
}

export function AppHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-[#e4e7e0]">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="lg:hidden w-8 h-8 rounded-lg bg-[#162518] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#162518] truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[#6b8f72] hidden sm:block mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}

export function AppMain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-8',
        className,
      )}
    >
      {children}
    </main>
  );
}

export function AppPanel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e4e7e0] bg-white shadow-[0_1px_0_rgba(22,37,24,0.03)]',
        padded && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b8f72]">
      {children}
    </p>
  );
}

export function CurrencyBadge({ currency }: { currency?: string | null }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#162518] text-white text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0" />
      {currency || 'NGN'}
    </div>
  );
}

export const fieldClassName =
  'w-full h-10 rounded-xl border border-[#d8ddd2] bg-[#fbfcf9] px-3 text-sm text-[#162518] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all ' +
  'placeholder:text-[#9aab9e] hover:border-[#c5cebc] hover:bg-white ' +
  'focus:outline-none focus:border-[#162518] focus:bg-white focus:ring-2 focus:ring-[#162518]/10';

export function AppLoading({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8f5]">
      <div className="text-center">
        <div className="w-10 h-10 border-[3px] border-[#162518] border-t-lime-400 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-[#6b8f72] text-sm">{label}</p>
      </div>
    </div>
  );
}

export function AppErrorState({
  title = 'Couldn’t load this page',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <p className="text-sm font-bold text-red-900">{title}</p>
        <p className="mt-2 text-sm text-red-800">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#162518] text-white text-sm font-semibold hover:bg-[#243f2f]"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

