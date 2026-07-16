'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  adminService,
  apiErrorDetail,
  formatNgnFromKobo,
  PLAN_OPTIONS,
  SUB_STATUS_OPTIONS,
  type AdminUser,
} from '@/lib/admin';
import { AdminSelect } from '@/components/admin/AdminForm';

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = String(params.id);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [plan, setPlan] = useState('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUser(userId);
      setUser(data);
      setPlan(data.plan || 'free');
      setSubscriptionStatus(data.subscription_status || 'active');
      setRole((data.role as 'user' | 'admin') || 'user');
      setIsActive(Boolean(data.is_active));
    } catch (err) {
      console.error(err);
      setError(apiErrorDetail(err, 'Failed to load user'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminService.updateUser(userId, {
        plan,
        subscription_status: subscriptionStatus,
        role,
        is_active: isActive,
      });
      setUser(updated);
      setMessage('User updated');
    } catch (err: unknown) {
      setError(apiErrorDetail(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const cancelSubscription = async () => {
    if (!user) return;
    if (!window.confirm(`Cancel Paystack subscription for ${user.email}?`)) {
      return;
    }
    const toFree = window.confirm(
      'Also downgrade this user to the Free plan immediately?',
    );
    setCancelling(true);
    setError(null);
    setMessage(null);
    try {
      const result = await adminService.cancelSubscription(userId, toFree);
      setUser(result.user);
      setPlan(result.user.plan || 'free');
      setSubscriptionStatus(result.user.subscription_status || 'active');
      setMessage(result.cancel?.message || 'Subscription cancelled');
    } catch (err) {
      setError(apiErrorDetail(err, 'Failed to cancel subscription'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading user…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'User not found'}</p>
        <Link href="/admin/users" className="text-sm font-semibold underline">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-xs font-semibold text-[#6b8f72] hover:text-[#162518]"
        >
          ← Users
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#162518]">{user.full_name}</h2>
            <p className="text-sm text-[#6b8f72]">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={
                user.is_active
                  ? 'rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-1'
                  : 'rounded-full bg-red-50 text-red-700 px-2.5 py-1'
              }
            >
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="rounded-full bg-[#eef1ea] text-[#162518] px-2.5 py-1 capitalize">
              {user.role}
            </span>
            <span className="rounded-full bg-[#eef1ea] text-[#162518] px-2.5 py-1 capitalize">
              {user.plan} · {user.subscription_status}
            </span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white border border-[#e4e7e0] p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#162518]">Profile</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b8f72]">Business</dt>
              <dd className="text-[#162518] text-right">
                {user.business_name || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b8f72]">Type</dt>
              <dd className="text-[#162518]">{user.business_type || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b8f72]">Phone</dt>
              <dd className="text-[#162518]">{user.phone_number || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b8f72]">Country / currency</dt>
              <dd className="text-[#162518]">
                {user.country || '—'} / {user.currency || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b8f72]">Transactions</dt>
              <dd className="text-[#162518]">{user.transaction_count ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b8f72]">Bank accounts</dt>
              <dd className="text-[#162518]">{user.bank_account_count ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b8f72]">Joined</dt>
              <dd className="text-[#162518]">
                {user.created_at
                  ? new Date(user.created_at).toLocaleString()
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white border border-[#e4e7e0] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#162518]">Manage account</h3>

          <AdminSelect
            label="Plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label="Subscription status"
            value={subscriptionStatus}
            onChange={(e) => setSubscriptionStatus(e.target.value)}
          >
            {SUB_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </AdminSelect>

          <AdminSelect
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </AdminSelect>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[#e4e7e0]"
            />
            <span className="text-[#162518]">Account active</span>
          </label>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-[#162518] text-lime-400 font-semibold py-2.5 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {user.plan !== 'free' && (
            <button
              type="button"
              onClick={cancelSubscription}
              disabled={cancelling}
              className="w-full rounded-xl border border-red-200 text-red-700 font-semibold py-2.5 text-sm hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel subscription'}
            </button>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white border border-[#e4e7e0] p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#162518]">Billing details</h3>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[#6b8f72]">Period end</dt>
            <dd className="text-[#162518] mt-0.5">
              {user.plan_period_end
                ? new Date(user.plan_period_end).toLocaleString()
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b8f72]">Plan updated</dt>
            <dd className="text-[#162518] mt-0.5">
              {user.plan_updated_at
                ? new Date(user.plan_updated_at).toLocaleString()
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b8f72]">Paystack customer</dt>
            <dd className="text-[#162518] mt-0.5 font-mono text-xs break-all">
              {user.paystack_customer_code || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b8f72]">Paystack subscription</dt>
            <dd className="text-[#162518] mt-0.5 font-mono text-xs break-all">
              {user.paystack_subscription_code || '—'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl bg-white border border-[#e4e7e0] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#162518]">
            Recent billing events
          </h3>
          <Link
            href="/admin/billing"
            className="text-xs font-semibold text-[#162518] hover:underline"
          >
            All billing
          </Link>
        </div>
        {(user.recent_billing_events || []).length === 0 ? (
          <p className="text-sm text-gray-500">No billing events</p>
        ) : (
          <ul className="divide-y divide-[#f0f2ec]">
            {user.recent_billing_events!.map((ev) => (
              <li
                key={ev.id}
                className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium text-[#162518]">{ev.event_type}</p>
                  <p className="text-xs text-[#6b8f72]">
                    {ev.plan || '—'}
                    {ev.paystack_reference
                      ? ` · ${ev.paystack_reference}`
                      : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#162518]">
                    {ev.amount_kobo != null
                      ? formatNgnFromKobo(ev.amount_kobo)
                      : '—'}
                  </p>
                  <p className="text-xs text-[#6b8f72]">
                    {ev.created_at
                      ? new Date(ev.created_at).toLocaleString()
                      : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
