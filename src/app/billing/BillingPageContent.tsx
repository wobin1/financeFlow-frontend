'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar, { sidebarContentOffsetClass } from '@/components/Sidebar';
import { authService } from '@/lib/auth';
import {
  billingService,
  formatPlanPrice,
  type Plan,
  type SubscriptionInfo,
} from '@/lib/billing';

export default function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const [planList, sub] = await Promise.all([
        billingService.getPlans(),
        billingService.getSubscription(),
      ]);
      setPlans(planList);
      setSubscription(sub);
    } catch (err) {
      console.error(err);
      setError('Failed to load billing info');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const status = searchParams.get('status');
    if (!reference) {
      if (status === 'success') {
        setMessage('Payment received — refreshing your plan…');
        load();
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setMessage('Confirming payment…');
        await billingService.verify(reference);
        if (!cancelled) {
          setMessage('Plan upgraded successfully.');
          await load();
          router.replace('/billing');
        }
      } catch (err: unknown) {
        console.error(err);
        if (!cancelled) {
          setError('Could not verify payment. If you were charged, refresh in a moment.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, load, router]);

  const handleCheckout = async (planId: string) => {
    setError(null);
    setMessage(null);
    setActionPlan(planId);
    try {
      const callback = `${window.location.origin}/billing?status=success`;
      const result = await billingService.checkout(planId, callback);
      window.location.href = result.authorization_url;
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Checkout failed. Check Paystack configuration.';
      setError(typeof detail === 'string' ? detail : 'Checkout failed');
      setActionPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? Access continues until the period ends.')) return;
    setActionPlan('cancel');
    try {
      const result = await billingService.cancel();
      setMessage(result.message || 'Subscription cancelled');
      await load();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Cancel failed';
      setError(typeof detail === 'string' ? detail : 'Cancel failed');
    } finally {
      setActionPlan(null);
    }
  };

  const currentPlanId = subscription?.plan?.id || 'free';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading billing…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Sidebar active="billing" />
      <main className={`${sidebarContentOffsetClass} min-h-screen`}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Billing
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your plan and usage.
            </p>
          </div>

          {message && (
            <div className="mb-4 rounded-xl bg-lime-50 border border-lime-200 text-lime-900 text-sm px-4 py-3">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {subscription && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    Current plan
                  </p>
                  <p className="text-xl font-bold text-gray-900">{subscription.plan.name}</p>
                  <p className="text-sm text-gray-500 mt-1 capitalize">
                    Status: {subscription.subscription_status.replace('_', ' ')}
                    {subscription.plan_period_end && (
                      <> · Renews / ends {new Date(subscription.plan_period_end).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                {currentPlanId !== 'free' && subscription.subscription_status === 'active' && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={actionPlan === 'cancel'}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {actionPlan === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
                  </button>
                )}
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <UsageBar
                  label="Transactions this month"
                  used={subscription.usage.transactions_this_month}
                  limit={subscription.usage.transactions_limit}
                />
                <UsageBar
                  label="Bank accounts"
                  used={subscription.usage.banks_connected}
                  limit={subscription.usage.banks_limit}
                />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isPaid = plan.amount_ngn > 0;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col ${
                    isCurrent
                      ? 'border-[#1B3A2D] bg-[#1B3A2D] text-white shadow-md'
                      : 'border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  <p className={`text-sm font-bold ${isCurrent ? 'text-lime-400' : 'text-gray-900'}`}>
                    {plan.name}
                  </p>
                  <p className={`mt-2 text-2xl font-bold ${isCurrent ? 'text-white' : 'text-gray-900'}`}>
                    {formatPlanPrice(plan.amount_ngn)}
                    {isPaid && (
                      <span className={`text-xs font-medium ml-1 ${isCurrent ? 'text-[#6b9e7a]' : 'text-gray-400'}`}>
                        /mo
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-2 leading-relaxed ${isCurrent ? 'text-[#9bb8a3]' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <ul className={`mt-4 space-y-2 flex-1 ${isCurrent ? 'text-[#c5d9cb]' : 'text-gray-600'}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs flex gap-2">
                        <span className={isCurrent ? 'text-lime-400' : 'text-[#1B3A2D]'}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="mt-5 text-center text-xs font-semibold text-lime-400 py-2.5">
                      Current plan
                    </div>
                  ) : isPaid ? (
                    <button
                      type="button"
                      onClick={() => handleCheckout(plan.id)}
                      disabled={actionPlan === plan.id}
                      className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-[#1B3A2D] text-white hover:bg-[#243f2f] disabled:opacity-60 transition-colors"
                    >
                      {actionPlan === plan.id ? 'Redirecting…' : 'Upgrade'}
                    </button>
                  ) : (
                    <div className="mt-5 text-center text-xs font-medium text-gray-400 py-2.5">
                      Default for new accounts
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min((used / Math.max(limit, 1)) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-gray-800 font-semibold">
          {used}
          {unlimited ? ' · Unlimited' : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-lime-400 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
