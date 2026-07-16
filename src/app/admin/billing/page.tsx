'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  adminService,
  apiErrorDetail,
  formatNgnFromKobo,
  PLAN_OPTIONS,
  SUB_STATUS_OPTIONS,
  type AdminBillingEvent,
  type AdminStats,
  type AdminUser,
  type Paginated,
} from '@/lib/admin';
import {
  AdminFilterBar,
  AdminInput,
  AdminSelect,
} from '@/components/admin/AdminForm';
import { cn } from '@/lib/utils';

type Tab = 'subscriptions' | 'events';

export default function AdminBillingPage() {
  const [tab, setTab] = useState<Tab>('subscriptions');
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [subs, setSubs] = useState<Paginated<AdminUser> | null>(null);
  const [subSearchInput, setSubSearchInput] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [subPlan, setSubPlan] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [subPage, setSubPage] = useState(1);
  const [subLoading, setSubLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [events, setEvents] = useState<Paginated<AdminBillingEvent> | null>(null);
  const [eventSearchInput, setEventSearchInput] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventPage, setEventPage] = useState(1);
  const [eventLoading, setEventLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSubPage(1);
      setSubSearch(subSearchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [subSearchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setEventPage(1);
      setEventSearch(eventSearchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [eventSearchInput]);

  useEffect(() => {
    adminService.getStats().then(setStats).catch(() => setStats(null));
  }, []);

  const loadSubs = useCallback(async () => {
    setSubLoading(true);
    setError(null);
    try {
      const result = await adminService.listSubscriptions({
        search: subSearch || undefined,
        plan: subPlan || undefined,
        subscription_status: subStatus || undefined,
        page: subPage,
        limit: 25,
      });
      setSubs(result);
    } catch (err) {
      console.error(err);
      setError(apiErrorDetail(err, 'Failed to load subscriptions'));
    } finally {
      setSubLoading(false);
    }
  }, [subSearch, subPlan, subStatus, subPage]);

  const loadEvents = useCallback(async () => {
    setEventLoading(true);
    setError(null);
    try {
      const result = await adminService.listBillingEvents({
        search: eventSearch || undefined,
        event_type: eventType || undefined,
        page: eventPage,
        limit: 25,
      });
      setEvents(result);
    } catch (err) {
      console.error(err);
      setError(apiErrorDetail(err, 'Failed to load billing events'));
    } finally {
      setEventLoading(false);
    }
  }, [eventSearch, eventType, eventPage]);

  useEffect(() => {
    if (tab === 'subscriptions') loadSubs();
  }, [tab, loadSubs]);

  useEffect(() => {
    if (tab === 'events') loadEvents();
  }, [tab, loadEvents]);

  const updateSubscription = async (
    user: AdminUser,
    patch: { plan?: string; subscription_status?: string },
  ) => {
    setActionId(user.id);
    setError(null);
    setMessage(null);
    try {
      await adminService.updateUser(user.id, patch);
      setMessage(`Updated ${user.email}`);
      await loadSubs();
      const nextStats = await adminService.getStats().catch(() => null);
      if (nextStats) setStats(nextStats);
    } catch (err) {
      setError(apiErrorDetail(err, 'Failed to update subscription'));
    } finally {
      setActionId(null);
    }
  };

  const cancelSubscription = async (user: AdminUser) => {
    if (!window.confirm(`Cancel Paystack subscription for ${user.email}?`)) {
      return;
    }
    const toFree = window.confirm(
      'Also downgrade this user to the Free plan immediately?',
    );
    setActionId(user.id);
    setError(null);
    setMessage(null);
    try {
      const result = await adminService.cancelSubscription(user.id, toFree);
      setMessage(result.cancel?.message || `Cancelled for ${user.email}`);
      await loadSubs();
      const nextStats = await adminService.getStats().catch(() => null);
      if (nextStats) setStats(nextStats);
    } catch (err) {
      setError(apiErrorDetail(err, 'Failed to cancel subscription'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#162518]">Billing</h2>
        <p className="text-sm text-[#6b8f72] mt-1">
          Manage subscriptions, override plans, and review billing events.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Paid users', value: String(stats.paid_users) },
            { label: 'Free users', value: String(Math.max(0, stats.total_users - stats.paid_users)) },
            {
              label: 'Activated revenue',
              value: formatNgnFromKobo(stats.revenue_kobo),
            },
            {
              label: 'Active subs',
              value: String(
                stats.users_by_subscription_status.find((s) => s.status === 'active')
                  ?.count ?? 0,
              ),
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl bg-white border border-[#e4e7e0] px-4 py-4"
            >
              <p className="text-xs font-medium text-[#6b8f72] uppercase tracking-wide">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-bold text-[#162518]">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-[#e4e7e0]">
        {(
          [
            { id: 'subscriptions', label: 'Subscriptions' },
            { id: 'events', label: 'Events' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setError(null);
              setMessage(null);
              setTab(item.id);
            }}
            className={cn(
              'px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors',
              tab === item.id
                ? 'border-[#162518] text-[#162518]'
                : 'border-transparent text-[#6b8f72] hover:text-[#162518]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      {tab === 'subscriptions' && (
        <div className="space-y-4">
          <AdminFilterBar columns={3}>
            <AdminInput
              label="Search"
              type="search"
              placeholder="Email, name…"
              value={subSearchInput}
              onChange={(e) => setSubSearchInput(e.target.value)}
            />
            <AdminSelect
              label="Plan"
              value={subPlan}
              onChange={(e) => {
                setSubPage(1);
                setSubPlan(e.target.value);
              }}
            >
              <option value="">All plans</option>
              {PLAN_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Status"
              value={subStatus}
              onChange={(e) => {
                setSubPage(1);
                setSubStatus(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              {SUB_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </AdminSelect>
          </AdminFilterBar>

          <div className="rounded-2xl bg-white border border-[#e4e7e0] overflow-hidden">
            {subLoading ? (
              <p className="p-6 text-sm text-gray-500">Loading subscriptions…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#6b8f72] border-b border-[#e4e7e0] bg-[#fafbf8]">
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Period end</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subs?.items || []).map((u) => {
                      const busy = actionId === u.id;
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-[#f0f2ec] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="font-medium text-[#162518] hover:underline"
                            >
                              {u.full_name}
                            </Link>
                            <p className="text-xs text-[#6b8f72]">{u.email}</p>
                          </td>
                          <td className="px-4 py-3 min-w-[9rem]">
                            <AdminSelect
                              compact
                              value={u.plan}
                              disabled={busy}
                              onChange={(e) =>
                                updateSubscription(u, { plan: e.target.value })
                              }
                              aria-label={`Plan for ${u.email}`}
                            >
                              {PLAN_OPTIONS.map((p) => (
                                <option key={p.value} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </AdminSelect>
                          </td>
                          <td className="px-4 py-3 min-w-[9rem]">
                            <AdminSelect
                              compact
                              value={u.subscription_status}
                              disabled={busy}
                              onChange={(e) =>
                                updateSubscription(u, {
                                  subscription_status: e.target.value,
                                })
                              }
                              aria-label={`Status for ${u.email}`}
                            >
                              {SUB_STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </AdminSelect>
                          </td>
                          <td className="px-4 py-3 text-[#4a5c4e]">
                            {u.plan_period_end
                              ? new Date(u.plan_period_end).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Link
                                href={`/admin/users/${u.id}`}
                                className="px-2.5 py-1 rounded-lg border border-[#e4e7e0] text-xs font-semibold text-[#162518] hover:bg-[#f0f2ec]"
                              >
                                Details
                              </Link>
                              {u.plan !== 'free' && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => cancelSubscription(u)}
                                  className="px-2.5 py-1 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {subs?.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No subscriptions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {subs && subs.pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-[#6b8f72]">
                Page {subs.page} of {subs.pages} · {subs.total} users
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={subPage <= 1}
                  onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#e4e7e0] bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={subPage >= subs.pages}
                  onClick={() => setSubPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#e4e7e0] bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-4">
          <AdminFilterBar columns={3}>
            <div className="sm:col-span-2">
              <AdminInput
                label="Search"
                type="search"
                placeholder="Email, name, reference…"
                value={eventSearchInput}
                onChange={(e) => setEventSearchInput(e.target.value)}
              />
            </div>
            <AdminSelect
              label="Event type"
              value={eventType}
              onChange={(e) => {
                setEventPage(1);
                setEventType(e.target.value);
              }}
            >
              <option value="">All events</option>
              <option value="checkout_initialized">Checkout initialized</option>
              <option value="plan_activated">Plan activated</option>
              <option value="subscription_cancelled">Subscription cancelled</option>
              <option value="admin_plan_override">Admin plan override</option>
              <option value="admin_subscription_cancel">Admin cancel</option>
            </AdminSelect>
          </AdminFilterBar>

          <div className="rounded-2xl bg-white border border-[#e4e7e0] overflow-hidden">
            {eventLoading ? (
              <p className="p-6 text-sm text-gray-500">Loading events…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#6b8f72] border-b border-[#e4e7e0] bg-[#fafbf8]">
                      <th className="px-4 py-3 font-medium">Event</th>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(events?.items || []).map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-b border-[#f0f2ec] last:border-0"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#162518]">
                            {ev.event_type}
                          </p>
                          {ev.paystack_reference && (
                            <p className="text-xs text-[#6b8f72] font-mono">
                              {ev.paystack_reference}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {ev.user_id ? (
                            <Link
                              href={`/admin/users/${ev.user_id}`}
                              className="hover:underline"
                            >
                              <span className="font-medium text-[#162518]">
                                {ev.user_full_name || 'User'}
                              </span>
                              <p className="text-xs text-[#6b8f72]">
                                {ev.user_email}
                              </p>
                            </Link>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">{ev.plan || '—'}</td>
                        <td className="px-4 py-3">
                          {ev.amount_kobo != null
                            ? formatNgnFromKobo(ev.amount_kobo)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-[#4a5c4e]">
                          {ev.created_at
                            ? new Date(ev.created_at).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                    {events?.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No billing events
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {events && events.pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-[#6b8f72]">
                Page {events.page} of {events.pages} · {events.total} events
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={eventPage <= 1}
                  onClick={() => setEventPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#e4e7e0] bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={eventPage >= events.pages}
                  onClick={() => setEventPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#e4e7e0] bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
