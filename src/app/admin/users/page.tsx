'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  adminService,
  apiErrorDetail,
  PLAN_OPTIONS,
  type AdminUser,
  type Paginated,
} from '@/lib/admin';
import {
  AdminFilterBar,
  AdminInput,
  AdminSelect,
} from '@/components/admin/AdminForm';

export default function AdminUsersPage() {
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [role, setRole] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.listUsers({
        search: search || undefined,
        plan: plan || undefined,
        role: role || undefined,
        is_active:
          activeFilter === 'active'
            ? true
            : activeFilter === 'inactive'
              ? false
              : undefined,
        page,
        limit: 25,
      });
      setData(result);
    } catch (err) {
      console.error(err);
      setError(apiErrorDetail(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [search, plan, role, activeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (user: AdminUser) => {
    if (
      !confirm(
        user.is_active
          ? `Deactivate ${user.email}? They will not be able to sign in.`
          : `Reactivate ${user.email}?`,
      )
    ) {
      return;
    }
    setActionId(user.id);
    setError(null);
    try {
      await adminService.updateUser(user.id, { is_active: !user.is_active });
      await load();
    } catch (err) {
      setError(apiErrorDetail(err, 'Failed to update user'));
    } finally {
      setActionId(null);
    }
  };

  const toggleRole = async (user: AdminUser) => {
    const next = user.role === 'admin' ? 'user' : 'admin';
    if (
      !confirm(
        next === 'admin'
          ? `Promote ${user.email} to admin?`
          : `Remove admin access from ${user.email}?`,
      )
    ) {
      return;
    }
    setActionId(user.id);
    setError(null);
    try {
      await adminService.updateUser(user.id, { role: next });
      await load();
    } catch (err) {
      setError(apiErrorDetail(err, 'Failed to update role'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#162518]">Users</h2>
        <p className="text-sm text-[#6b8f72] mt-1">
          Search, activate/deactivate, promote admins, and open a user to manage billing.
        </p>
      </div>

      <AdminFilterBar>
        <AdminInput
          label="Search"
          type="search"
          placeholder="Email, name, business…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <AdminSelect
          label="Plan"
          value={plan}
          onChange={(e) => {
            setPage(1);
            setPlan(e.target.value);
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
          label="Role"
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </AdminSelect>
        <AdminSelect
          label="Account"
          value={activeFilter}
          onChange={(e) => {
            setPage(1);
            setActiveFilter(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </AdminSelect>
      </AdminFilterBar>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-2xl bg-white border border-[#e4e7e0] overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading users…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6b8f72] border-b border-[#e4e7e0] bg-[#fafbf8]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((u) => {
                  const busy = actionId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-[#f0f2ec] last:border-0 hover:bg-[#fafbf8]"
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
                      <td className="px-4 py-3">
                        <span className="capitalize">{u.plan}</span>
                        <p className="text-xs text-[#6b8f72] capitalize">
                          {u.subscription_status}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.is_active ? 'text-emerald-700' : 'text-red-600'
                          }
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                      <td className="px-4 py-3 text-[#4a5c4e]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="px-2.5 py-1 rounded-lg border border-[#e4e7e0] text-xs font-semibold text-[#162518] hover:bg-[#f0f2ec]"
                          >
                            Manage
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleActive(u)}
                            className="px-2.5 py-1 rounded-lg border border-[#e4e7e0] text-xs font-semibold text-[#162518] hover:bg-[#f0f2ec] disabled:opacity-40"
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleRole(u)}
                            className="px-2.5 py-1 rounded-lg border border-[#e4e7e0] text-xs font-semibold text-[#162518] hover:bg-[#f0f2ec] disabled:opacity-40"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make admin'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[#6b8f72]">
            Page {data.page} of {data.pages} · {data.total} users
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-[#e4e7e0] bg-white disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-[#e4e7e0] bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
