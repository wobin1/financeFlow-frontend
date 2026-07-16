'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  adminService,
  formatNgnFromKobo,
  type AdminStats,
} from '@/lib/admin';
import { AdminPanel } from '@/components/admin/AdminForm';
import { cn } from '@/lib/utils';

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-[#c5d0c4]',
  starter: 'bg-[#8fad7a]',
  growth: 'bg-[#5f8a4a]',
  business: 'bg-[#162518]',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  cancelled: 'bg-amber-500',
  past_due: 'bg-orange-500',
  inactive: 'bg-stone-400',
};

function DistributionList({
  rows,
  total,
  colorMap,
}: {
  rows: { key: string; count: number }[];
  total: number;
  colorMap: Record<string, string>;
}) {
  const denom = total > 0 ? total : 1;

  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const pct = Math.round((row.count / denom) * 100);
        return (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-sm font-medium text-[#162518] capitalize">
                {row.key}
              </span>
              <span className="text-sm tabular-nums text-[#4a5c4e]">
                <span className="font-semibold text-[#162518]">{row.count}</span>
                <span className="text-[#9aab9e]"> · {pct}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#eef1ea] overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  colorMap[row.key] || 'bg-[#6b8f72]',
                )}
                style={{ width: `${Math.max(pct, row.count > 0 ? 4 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
      {rows.length === 0 && (
        <li className="text-sm text-[#9aab9e]">No data yet</li>
      )}
    </ul>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setStats(await adminService.getStats());
      } catch (err) {
        console.error(err);
        setError('Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-[#e8ebe3]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#e8ebe3]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-sm text-red-600">{error || 'No data'}</p>;
  }

  const metrics = [
    {
      label: 'Total users',
      value: String(stats.total_users),
      hint: `${stats.active_users} active`,
    },
    {
      label: 'Paid users',
      value: String(stats.paid_users),
      hint:
        stats.total_users > 0
          ? `${Math.round((stats.paid_users / stats.total_users) * 100)}% of base`
          : 'No users yet',
    },
    {
      label: 'Transactions',
      value: String(stats.total_transactions),
      hint: 'Platform-wide',
    },
    {
      label: 'Revenue',
      value: formatNgnFromKobo(stats.revenue_kobo),
      hint: 'From activations',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <section className="relative overflow-hidden rounded-2xl bg-[#162518] text-white px-5 sm:px-7 py-6 sm:py-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 85% 20%, rgba(163,230,53,0.35), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(107,143,114,0.4), transparent 50%)',
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lime-400/90">
              Platform health
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
              Overview
            </h2>
            <p className="mt-2 text-sm text-[#a8c4ae] max-w-md">
              Snapshot of accounts, subscriptions, and activation revenue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-xl bg-lime-400 px-3.5 py-2 text-sm font-semibold text-[#162518] hover:bg-lime-300 transition-colors"
            >
              Manage users
            </Link>
            <Link
              href="/admin/billing"
              className="inline-flex items-center rounded-xl border border-white/20 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Billing
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-[#e4e7e0] bg-white px-4 py-4 shadow-[0_1px_0_rgba(22,37,24,0.03)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b8f72]">
              {m.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#162518] tabular-nums">
              {m.value}
            </p>
            <p className="mt-1 text-xs text-[#9aab9e]">{m.hint}</p>
          </div>
        ))}
      </section>

      {/* Distributions + admins */}
      <section className="grid lg:grid-cols-5 gap-4">
        <AdminPanel title="Users by plan" className="lg:col-span-2">
          <DistributionList
            total={stats.total_users}
            colorMap={PLAN_COLORS}
            rows={stats.users_by_plan.map((r) => ({
              key: r.plan,
              count: r.count,
            }))}
          />
        </AdminPanel>

        <AdminPanel title="Subscription status" className="lg:col-span-2">
          <DistributionList
            total={stats.total_users}
            colorMap={STATUS_COLORS}
            rows={stats.users_by_subscription_status.map((r) => ({
              key: r.status,
              count: r.count,
            }))}
          />
        </AdminPanel>

        <AdminPanel title="Access" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b8f72]">
                Admins
              </p>
              <p className="mt-1 text-3xl font-bold text-[#162518] tabular-nums">
                {stats.admin_users}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b8f72]">
                Active rate
              </p>
              <p className="mt-1 text-3xl font-bold text-[#162518] tabular-nums">
                {stats.total_users > 0
                  ? `${Math.round((stats.active_users / stats.total_users) * 100)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </AdminPanel>
      </section>

      {/* Recent signups */}
      <AdminPanel
        title="Recent signups"
        action={
          <Link
            href="/admin/users"
            className="text-xs font-semibold text-[#162518] hover:text-[#6b8f72] transition-colors"
          >
            View all →
          </Link>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-[#6b8f72] border-b border-[#eef1ea]">
                <th className="pb-2.5 font-semibold pl-1">User</th>
                <th className="pb-2.5 font-semibold">Plan</th>
                <th className="pb-2.5 font-semibold">Role</th>
                <th className="pb-2.5 font-semibold pr-1">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_signups.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[#f4f6f1] last:border-0 hover:bg-[#fafbf8]"
                >
                  <td className="py-3 pl-1">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium text-[#162518] hover:underline"
                    >
                      {u.full_name}
                    </Link>
                    <p className="text-xs text-[#6b8f72]">{u.email}</p>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex rounded-md bg-[#eef1ea] px-2 py-0.5 text-xs font-semibold capitalize text-[#162518]">
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3 capitalize text-[#4a5c4e]">{u.role}</td>
                  <td className="py-3 pr-1 text-[#4a5c4e]">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
              {stats.recent_signups.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#9aab9e]">
                    No signups yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
