import api from './api';

export interface Plan {
  id: string;
  name: string;
  amount_ngn: number;
  amount_kobo: number;
  currency: string;
  interval: string;
  description: string;
  max_banks: number | null;
  max_transactions_per_month: number | null;
  ai_categorization: boolean;
  firs_access: boolean;
  firs_export: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  features: string[];
}

export interface BillingUsage {
  transactions_this_month: number;
  transactions_limit: number | null;
  banks_connected: number;
  banks_limit: number | null;
}

export interface SubscriptionInfo {
  plan: Plan;
  subscription_status: string;
  plan_period_end: string | null;
  usage: BillingUsage;
}

export interface CheckoutResult {
  authorization_url: string;
  access_code: string;
  reference: string;
  plan: Plan;
  public_key: string | null;
}

export const billingService = {
  async getPlans(): Promise<Plan[]> {
    const response = await api.get('/billing/plans');
    return response.data.plans;
  },

  async getSubscription(): Promise<SubscriptionInfo> {
    const response = await api.get('/billing/subscription');
    return response.data;
  },

  async checkout(plan: string, callbackUrl?: string): Promise<CheckoutResult> {
    const response = await api.post('/billing/checkout', {
      plan,
      callback_url: callbackUrl,
    });
    return response.data;
  },

  async verify(reference: string) {
    const response = await api.get('/billing/verify', { params: { reference } });
    return response.data;
  },

  async cancel() {
    const response = await api.post('/billing/cancel');
    return response.data;
  },
};

export function formatPlanPrice(amountNgn: number): string {
  if (amountNgn === 0) return 'Free';
  return `₦${amountNgn.toLocaleString('en-NG')}`;
}
