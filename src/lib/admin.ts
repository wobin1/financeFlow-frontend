import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  country?: string;
  currency?: string;
  is_active: boolean;
  role: string;
  plan: string;
  subscription_status: string;
  plan_period_end?: string | null;
  plan_updated_at?: string | null;
  paystack_customer_code?: string | null;
  paystack_subscription_code?: string | null;
  created_at?: string;
  updated_at?: string;
  transaction_count?: number;
  bank_account_count?: number;
  recent_billing_events?: AdminBillingEvent[];
}

export interface AdminBillingEvent {
  id: string;
  user_id?: string | null;
  event_type: string;
  paystack_reference?: string | null;
  plan?: string | null;
  amount_kobo?: number | null;
  created_at?: string;
  user_email?: string | null;
  user_full_name?: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  paid_users: number;
  total_transactions: number;
  revenue_kobo: number;
  users_by_plan: { plan: string; count: number }[];
  users_by_subscription_status: { status: string; count: number }[];
  recent_signups: AdminUser[];
}

export interface AdminUserUpdate {
  is_active?: boolean;
  role?: 'user' | 'admin';
  plan?: string;
  subscription_status?: string;
}

function apiErrorDetail(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response
    ?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const { data } = await api.get('/admin/stats');
    return data;
  },

  async listUsers(params?: {
    search?: string;
    plan?: string;
    role?: string;
    is_active?: boolean;
    subscription_status?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<AdminUser>> {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  async getUser(userId: string): Promise<AdminUser> {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },

  async updateUser(userId: string, body: AdminUserUpdate): Promise<AdminUser> {
    const { data } = await api.patch(`/admin/users/${userId}`, body);
    return data;
  },

  async cancelSubscription(
    userId: string,
    downgradeToFree = false,
  ): Promise<{ user: AdminUser; cancel: { message?: string } }> {
    const { data } = await api.post(`/admin/users/${userId}/cancel-subscription`, {
      downgrade_to_free: downgradeToFree,
    });
    return data;
  },

  async listSubscriptions(params?: {
    search?: string;
    plan?: string;
    subscription_status?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<AdminUser>> {
    const { data } = await api.get('/admin/billing/subscriptions', { params });
    return data;
  },

  async listBillingEvents(params?: {
    search?: string;
    event_type?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<AdminBillingEvent>> {
    const { data } = await api.get('/admin/billing/events', { params });
    return data;
  },
};

export { apiErrorDetail };

export function formatNgnFromKobo(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'business', label: 'Business' },
] as const;

export const SUB_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'past_due', label: 'Past due' },
  { value: 'inactive', label: 'Inactive' },
] as const;
