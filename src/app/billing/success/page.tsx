'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { billingService } from '@/lib/billing';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [planName, setPlanName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        const next = `/billing/success?${searchParams.toString()}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const reference = searchParams.get('reference') || searchParams.get('trxref');

      try {
        if (reference) {
          const result = await billingService.verify(reference);
          if (!cancelled) {
            setPlanName(result?.plan?.name || null);
            setPhase('success');
          }
          return;
        }

        // Paystack sometimes returns only status=success; refresh subscription from API
        const sub = await billingService.getSubscription();
        if (!cancelled) {
          setPlanName(sub.plan?.name || null);
          setPhase('success');
        }
      } catch (err: unknown) {
        console.error(err);
        if (!cancelled) {
          const detail =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setError(
            typeof detail === 'string'
              ? detail
              : 'We could not confirm the payment yet. If you were charged, your plan will update shortly.',
          );
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-sm p-8 text-center">
        {phase === 'verifying' && (
          <>
            <div className="mx-auto w-12 h-12 rounded-full border-2 border-[#1B3A2D]/20 border-t-[#1B3A2D] animate-spin mb-5" />
            <h1 className="text-xl font-bold text-gray-900">Confirming payment…</h1>
            <p className="text-sm text-gray-500 mt-2">
              Hang tight while we verify your Paystack payment.
            </p>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-lime-100 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-[#1B3A2D]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Payment successful</h1>
            <p className="text-sm text-gray-500 mt-2">
              {planName
                ? `Your ${planName} plan is now active.`
                : 'Your subscription has been updated.'}
            </p>
            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                href="/billing"
                className="w-full py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-semibold hover:bg-[#243f2f] transition-colors"
              >
                View billing
              </Link>
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-[#1B3A2D] hover:text-[#1B3A2D] transition-colors"
              >
                Go to dashboard
              </Link>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-amber-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Almost there</h1>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                href="/billing"
                className="w-full py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-semibold hover:bg-[#243f2f] transition-colors"
              >
                Check billing status
              </Link>
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-[#1B3A2D] hover:text-[#1B3A2D] transition-colors"
              >
                Go to dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
