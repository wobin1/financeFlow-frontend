'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/lib/auth';
import { transactionService, Transaction, TransactionSummary } from '@/lib/transactions';
import MonoConnect from '@/components/MonoConnect';
import {
  AppHeader,
  AppLoading,
  AppMain,
  AppPage,
  AppPanel,
  AppErrorState,
  CurrencyBadge,
} from '@/components/app/PageChrome';
import { monoApiService } from '@/lib/mono';
import { billingService, type SubscriptionInfo } from '@/lib/billing';
import { getApiErrorMessage } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [billing, setBilling] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [bankConnected, setBankConnected] = useState(false);
  const [showMonoConnect, setShowMonoConnect] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ processed: number; skipped: number } | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      const [transactionsData, summaryData, billingData] = await Promise.all([
        transactionService.getTransactions({ limit: 10 }),
        transactionService.getSummary(),
        billingService.getSubscription().catch(() => null),
      ]);

      setTransactions(transactionsData);
      setSummary(summaryData);
      setBilling(billingData);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = () => {
    void authService.logout();
  };

  const syncAndRefresh = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await monoApiService.syncTransactions();
      setSyncResult(result?.summary || result);

      const [transactionsData, summaryData] = await Promise.all([
        transactionService.getTransactions({ limit: 10 }),
        transactionService.getSummary(),
      ]);
      setTransactions(transactionsData);
      setSummary(summaryData);
    } catch (error) {
      setSyncError(getApiErrorMessage(error, 'Failed to sync transactions'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMonoSuccess = async (_accountData: any) => {
    setBankConnected(true);
    setShowMonoConnect(false);
    // Auto-sync transactions immediately after connecting
    await syncAndRefresh();
  };

  const handleSyncTransactions = async () => {
    await syncAndRefresh();
  };

  const formatCurrency = (amount: number) => {
    const currency = user?.currency || 'NGN';
    const locale = currency === 'NGN' ? 'en-NG' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const scrollToCard = useCallback((index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement;
    if (card) el.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCardIndex((prev) => {
        const next = (prev + 1) % 3;
        scrollToCard(next);
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [scrollToCard]);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / 3;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setCardIndex(idx);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Build 7-day chart data from transactions
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      const dayTxns = transactions.filter(t => t.transaction_date?.startsWith(dayStr));
      const income = dayTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = dayTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      days.push({ label, income, expense });
    }
    return days;
  }, [transactions]);

  const maxBar = Math.max(...chartData.flatMap(d => [d.income, d.expense]), 1);

  if (loading) {
    return <AppLoading label="Loading dashboard…" />;
  }

  if (loadError) {
    return (
      <AppPage active="dashboard">
        <AppHeader title="Dashboard" subtitle="Your financial overview" />
        <AppMain>
          <AppErrorState message={loadError} onRetry={loadDashboard} />
        </AppMain>
      </AppPage>
    );
  }

  const isBankLinked = bankConnected || !!user?.plaid_access_token;

  const dashIcon = <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>;
  const txIcon   = <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>;
  const firsIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>;
  const syncIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>;
  const logoutIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;

  return (
    <AppPage active="dashboard">
      <AppHeader
        title={`Hey, ${user?.full_name?.split(' ')[0] ?? 'there'}`}
        subtitle="Your financial overview"
        actions={
          <>
            {isBankLinked && (
              <button
                onClick={handleSyncTransactions}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e4e7e0] text-xs sm:text-sm text-[#4a5c4e] hover:border-[#162518] hover:text-[#162518] active:scale-95 transition-all disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{syncIcon}</svg>
                <span className="hidden sm:inline">{isSyncing ? 'Syncing…' : 'Refresh'}</span>
              </button>
            )}
            <CurrencyBadge currency={user?.currency} />
            <button onClick={handleLogout} className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#9aab9e] hover:text-red-500 hover:bg-[#eef1ea] transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
            </button>
          </>
        }
      />

        {syncResult && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-3 px-4 py-2.5 rounded-xl bg-lime-50 border border-lime-200 text-sm text-lime-900 flex items-center gap-2">
            <span><strong>{syncResult.processed}</strong> imported · <strong>{syncResult.skipped}</strong> skipped</span>
          </div>
        )}

        {syncError && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900 flex items-center justify-between gap-2">
            <span>{syncError}</span>
            <button type="button" onClick={handleSyncTransactions} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        <AppMain>
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">

            {/* ══ Left / main column ══ */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">

              {/* Stat cards — carousel on mobile, grid on sm+ */}
              <div className="relative">
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="flex sm:grid sm:grid-cols-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-3 scrollbar-none pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="snap-start shrink-0 w-[82%] sm:w-auto bg-[#162518] text-white rounded-2xl p-5">
                    <p className="text-[#6b8f72] text-[11px] font-semibold uppercase tracking-[0.06em] mb-2">Total Income</p>
                    <p className="text-xl sm:text-2xl font-bold leading-tight tracking-tight tabular-nums">{formatCurrency(summary?.total_income ?? 0)}</p>
                    <p className="mt-3 text-lime-400 text-xs font-medium">Income</p>
                  </div>

                  <div className="snap-start shrink-0 w-[82%] sm:w-auto bg-white rounded-2xl p-5 border border-[#e4e7e0]">
                    <p className="text-[#6b8f72] text-[11px] font-semibold uppercase tracking-[0.06em] mb-2">Expenses</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#162518] leading-tight tracking-tight tabular-nums">{formatCurrency(Math.abs(summary?.total_expenses ?? 0))}</p>
                    <p className="mt-3 text-red-500 text-xs font-medium">Spending</p>
                  </div>

                  <div className="snap-start shrink-0 w-[82%] sm:w-auto bg-white rounded-2xl p-5 border border-[#e4e7e0]">
                    <p className="text-[#6b8f72] text-[11px] font-semibold uppercase tracking-[0.06em] mb-2">Pending Review</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#162518] leading-tight tracking-tight tabular-nums">{summary?.pending_count ?? 0}</p>
                    <p className="mt-3 text-amber-600 text-xs font-medium">Awaiting</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-3 sm:hidden">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => { scrollToCard(i); setCardIndex(i); }}
                      className={`rounded-full transition-all duration-300 ${
                        cardIndex === i
                          ? 'w-5 h-1.5 bg-[#162518]'
                          : 'w-1.5 h-1.5 bg-[#c5d0c4]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <AppPanel>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-[#162518] text-sm sm:text-base tracking-tight">Balance statistics</h2>
                  <div className="flex items-center gap-3 text-xs text-[#6b8f72]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#162518] inline-block"/>Income
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-lime-400 inline-block"/>Expense
                    </span>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 sm:gap-3 h-32 sm:h-40">
                  {chartData.map((day, i) => {
                    const incH = maxBar > 0 ? (day.income / maxBar) * 100 : 0;
                    const expH = maxBar > 0 ? (day.expense / maxBar) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="w-full flex items-end gap-px sm:gap-0.5 h-24 sm:h-32">
                          <div className="flex-1 rounded-t-md bg-[#162518] group-hover:bg-[#243f2f] transition-colors duration-200" style={{ height: `${Math.max(incH, 3)}%` }}/>
                          <div className="flex-1 rounded-t-md bg-lime-400 group-hover:bg-lime-300 transition-colors duration-200" style={{ height: `${Math.max(expH, 3)}%` }}/>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-[#9aab9e] text-center leading-tight">{day.label.split(' ')[1]}</p>
                      </div>
                    );
                  })}
                </div>
              </AppPanel>

              <AppPanel padded={false} className="overflow-hidden">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#eef1ea]">
                  <h2 className="font-bold text-[#162518] text-sm sm:text-base tracking-tight">Recent transactions</h2>
                  {transactions.length > 0 && (
                    <span className="text-xs text-[#6b8f72] bg-[#eef1ea] px-2 py-0.5 rounded-md font-medium">
                      {transactions.length} shown
                    </span>
                  )}
                </div>

                {isSyncing ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"/>
                    <p className="text-sm text-gray-400">Syncing from your bank…</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {isBankLinked ? 'No transactions yet' : 'No bank connected'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isBankLinked ? 'Hit Refresh to pull your latest transactions' : 'Connect your Nigerian bank to get started'}
                      </p>
                    </div>
                    {!isBankLinked && (
                      <button
                        onClick={() => setShowMonoConnect(true)}
                        className="mt-1 px-5 py-2.5 rounded-xl bg-[#1B3A2D] text-white text-sm font-semibold hover:bg-[#243f2f] active:scale-95 transition-all"
                      >
                        Connect Bank
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-default">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-lime-100' : 'bg-red-50'}`}>
                            <svg className={`w-4 h-4 ${tx.amount > 0 ? 'text-lime-600' : 'text-red-400'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              {tx.amount > 0
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>}
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{tx.merchant_name}</p>
                            <p className="text-xs text-gray-400 truncate">{tx.category ?? 'Uncategorized'} · {formatDate(tx.transaction_date)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-lime-600' : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            tx.status === 'confirmed' ? 'bg-lime-100 text-lime-700' :
                            tx.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-600'
                          }`}>{tx.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AppPanel>
            </div>

            {/* ══ Right sidebar column ══ */}
            <div className="w-full lg:w-[268px] shrink-0 flex flex-col gap-4">

              <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">

                <AppPanel className="shrink-0 w-56 sm:w-64 lg:w-full">
                  <p className="text-[11px] text-[#6b8f72] font-semibold uppercase tracking-[0.06em] mb-2">Net Balance</p>
                  <p className={`text-2xl sm:text-3xl font-bold leading-tight tracking-tight tabular-nums ${(summary?.net_amount ?? 0) >= 0 ? 'text-[#162518]' : 'text-red-500'}`}>
                    {formatCurrency(summary?.net_amount ?? 0)}
                  </p>
                  <p className="text-[10px] text-[#9aab9e] mt-1">{user?.currency ?? 'NGN'}</p>
                  {(summary?.net_amount ?? 0) >= 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-lime-50 text-lime-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      Positive
                    </div>
                  )}
                </AppPanel>

                <AppPanel className="shrink-0 w-56 sm:w-64 lg:w-full">
                  <p className="text-[11px] text-[#6b8f72] font-semibold uppercase tracking-[0.06em] mb-2">Total Transactions</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#162518] leading-tight tracking-tight tabular-nums">
                    {billing?.usage.transactions_this_month ?? summary?.total_transactions ?? transactions.length}
                  </p>
                  {(() => {
                    const used = billing?.usage.transactions_this_month ?? 0;
                    const limit = billing?.usage.transactions_limit;
                    const unlimited = limit == null && !!billing;
                    const pct = limit ? Math.min((used / Math.max(limit, 1)) * 100, 100) : 0;
                    return (
                      <>
                        {!unlimited && limit != null && (
                          <div className="mt-3 w-full bg-[#eef1ea] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-lime-400 h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-[#9aab9e] mt-1.5">
                          {unlimited
                            ? `${billing?.plan.name || 'Plan'} · unlimited this month`
                            : limit != null
                              ? `of ${limit} monthly limit · ${billing?.plan.name || 'Free'}`
                              : 'this month'}
                          {' · '}
                          <Link href="/billing" className="text-[#162518] font-semibold hover:underline">
                            Upgrade
                          </Link>
                        </p>
                      </>
                    );
                  })()}
                </AppPanel>
              </div>

              <div className="bg-[#162518] rounded-2xl p-5">
                <p className="text-[#6b8f72] text-[11px] font-semibold uppercase tracking-[0.06em] mb-4">Bank Account</p>
                {isBankLinked ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-lime-400 shrink-0"/>
                      <p className="text-white text-sm font-medium">Account connected</p>
                    </div>
                    <button
                      onClick={handleSyncTransactions}
                      disabled={isSyncing}
                      className="w-full py-3 rounded-xl bg-lime-400 text-[#162518] text-sm font-bold hover:bg-lime-300 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSyncing
                        ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-[#162518]/30 border-t-[#162518] rounded-full animate-spin"/>Syncing…</span>
                        : '↻ Sync Transactions'}
                    </button>
                  </>
                ) : (billing?.plan.max_banks ?? 0) === 0 ? (
                  <>
                    <p className="text-[#6b9e7a] text-sm leading-relaxed mb-4">
                      Bank linking starts on Growth. Upgrade to sync Nigerian accounts automatically.
                    </p>
                    <Link
                      href="/billing"
                      className="block w-full text-center py-3 rounded-xl bg-lime-400 text-[#162518] text-sm font-bold hover:bg-lime-300 active:scale-95 transition-all"
                    >
                      Upgrade to link bank
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-[#6b9e7a] text-sm leading-relaxed mb-4">Link your Nigerian bank account to import transactions automatically.</p>
                    <button
                      onClick={() => setShowMonoConnect(true)}
                      className="w-full py-3 rounded-xl bg-lime-400 text-[#162518] text-sm font-bold hover:bg-lime-300 active:scale-95 transition-all"
                    >
                      + Connect Bank
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </AppMain>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-[#e4e7e0]">
          <div className="flex items-center justify-around px-4 py-2 pb-safe">
            <button className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#162518]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{dashIcon}</svg>
              </div>
              <span className="text-[10px] font-semibold text-[#162518]">Dashboard</span>
            </button>

            <Link href="/transactions" className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9aab9e]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{txIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-[#9aab9e]">Transactions</span>
            </Link>

            {isBankLinked ? (
              <button
                onClick={handleSyncTransactions}
                disabled={isSyncing}
                className="flex flex-col items-center gap-1 py-1 px-3"
              >
                <div className="w-8 h-8 rounded-xl bg-[#162518] flex items-center justify-center">
                  <svg className={`w-4 h-4 text-lime-400 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    {syncIcon}
                  </svg>
                </div>
                <span className="text-[10px] font-medium text-[#6b8f72]">Sync</span>
              </button>
            ) : (billing?.plan.max_banks ?? 0) === 0 ? (
              <Link href="/billing" className="flex flex-col items-center gap-1 py-1 px-3">
                <div className="w-8 h-8 rounded-xl bg-[#162518] flex items-center justify-center">
                  <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <span className="text-[10px] font-medium text-[#6b8f72]">Upgrade</span>
              </Link>
            ) : (
              <button
                onClick={() => setShowMonoConnect(true)}
                className="flex flex-col items-center gap-1 py-1 px-3"
              >
                <div className="w-8 h-8 rounded-xl bg-[#162518] flex items-center justify-center">
                  <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <span className="text-[10px] font-medium text-[#6b8f72]">Connect</span>
              </button>
            )}

            <Link href="/firs" className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9aab9e]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{firsIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-[#9aab9e]">FIRS</span>
            </Link>

            <button onClick={handleLogout} className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9aab9e]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-[#9aab9e]">Logout</span>
            </button>
          </div>
        </nav>

      {showMonoConnect && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowMonoConnect(false); }}
        >
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl">

            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#e4e7e0]"/>
            </div>

            <div className="bg-[#162518] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#162518]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Connect Your Bank</p>
                  <p className="text-[#6b8f72] text-xs">Powered by Mono</p>
                </div>
              </div>
              <button
                onClick={() => setShowMonoConnect(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b8f72] hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <MonoConnect onSuccess={handleMonoSuccess} onError={() => setShowMonoConnect(false)} />
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
}
