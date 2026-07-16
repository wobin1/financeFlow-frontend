'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppPage,
  AppHeader,
  AppMain,
  AppPanel,
  AppLabel,
  AppLoading,
} from '@/components/app/PageChrome';
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

    // Legacy Paystack callback: /billing?status=success → dedicated success page
    if (!reference && status === 'success') {
      router.replace('/billing/success');
      return;
    }

    if (!reference) return;

    let cancelled = false;
    (async () => {
      try {
        setMessage('Confirming payment…');
        await billingService.verify(reference);
        if (!cancelled) {
          router.replace('/billing/success?reference=' + encodeURIComponent(reference));
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
  }, [searchParams, router]);

  const handleCheckout = async (planId: string) => {
    setError(null);
    setMessage(null);
    setActionPlan(planId);
    try {
      const callback = `${window.location.origin}/billing/success`;
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
    return <AppLoading label="Loading billing…" />;
  }

  return (
    <AppPage active="billing">
      <AppHeader
        title="Billing"
        subtitle="Manage your plan and usage"
      />

      <AppMain>
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          {message && (
            <div className="rounded-xl bg-lime-50 border border-lime-200 text-lime-900 text-sm px-4 py-3">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {subscription && (
            <AppPanel className="!p-5 sm:!p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <AppLabel>Current plan</AppLabel>
                  <p className="text-xl font-bold text-[#162518] mt-1">{subscription.plan.name}</p>
                  <p className="text-sm text-[#6b8f72] mt-1 capitalize">
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
            </AppPanel>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isPaid = plan.amount_ngn > 0;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 flex flex-col shadow-[0_1px_0_rgba(22,37,24,0.03)] ${
                    isCurrent
                      ? 'border-[#162518] bg-[#162518] text-white'
                      : 'border-[#e4e7e0] bg-white'
                  }`}
                >
                  <p className={`text-sm font-bold ${isCurrent ? 'text-lime-400' : 'text-[#162518]'}`}>
                    {plan.name}
                  </p>
                  <p className={`mt-2 text-2xl font-bold ${isCurrent ? 'text-white' : 'text-[#162518]'}`}>
                    {formatPlanPrice(plan.amount_ngn)}
                    {isPaid && (
                      <span className={`text-xs font-medium ml-1 ${isCurrent ? 'text-[#6b8f72]' : 'text-[#9aab9e]'}`}>
                        /mo
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-2 leading-relaxed ${isCurrent ? 'text-[#9aab9e]' : 'text-[#6b8f72]'}`}>
                    {plan.description}
                  </p>
                  <ul className={`mt-4 space-y-2 flex-1 ${isCurrent ? 'text-[#c5d9cb]' : 'text-[#6b8f72]'}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs flex gap-2">
                        <span className={isCurrent ? 'text-lime-400' : 'text-[#162518]'}>
                          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
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
                      className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-[#162518] text-white hover:bg-[#243f2f] disabled:opacity-60 transition-colors"
                    >
                      {actionPlan === plan.id ? 'Redirecting…' : 'Upgrade'}
                    </button>
                  ) : (
                    <div className="mt-5 text-center text-xs font-medium text-[#9aab9e] py-2.5">
                      Default for new accounts
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AppMain>
    </AppPage>
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
        <span className="text-[#6b8f72] font-medium">{label}</span>
        <span className="text-[#162518] font-semibold">
          {used}
          {unlimited ? ' · Unlimited' : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="w-full bg-[#eef1ea] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-lime-400 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
