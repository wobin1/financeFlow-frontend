'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/lib/auth';
import { transactionService, Transaction, TransactionSummary } from '@/lib/transactions';
import MonoConnect from '@/components/MonoConnect';
import { monoApiService } from '@/lib/mono';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankConnected, setBankConnected] = useState(false);
  const [showMonoConnect, setShowMonoConnect] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ processed: number; skipped: number } | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        // Load transactions and summary
        const [transactionsData, summaryData] = await Promise.all([
          transactionService.getTransactions({ limit: 10 }),
          transactionService.getSummary()
        ]);
        
        setTransactions(transactionsData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleLogout = () => {
    authService.logout();
  };

  const syncAndRefresh = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await monoApiService.syncTransactions();
      setSyncResult(result?.summary || result);
      
      const [transactionsData, summaryData] = await Promise.all([
        transactionService.getTransactions({ limit: 10 }),
        transactionService.getSummary()
      ]);
      setTransactions(transactionsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to sync transactions:', error);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isBankLinked = bankConnected || !!user?.plaid_access_token;

  // Reusable icon paths
  const dashIcon = <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>;
  const txIcon   = <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>;
  const firsIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>;
  const syncIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>;
  const logoutIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;

  return (
    <div className="flex min-h-screen bg-[#f0f2ee] font-sans">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-[72px] bg-[#162518] flex-col items-center py-6 shrink-0 fixed left-0 top-0 bottom-0 z-30">
        <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center mb-10 shrink-0">
          <svg className="w-6 h-6 text-[#162518]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <nav className="flex flex-col items-center gap-2 flex-1">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center" title="Dashboard">
            <svg className="w-5 h-5 text-[#162518]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{dashIcon}</svg>
          </Link>
          <Link href="/transactions" className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6b8f72] hover:text-lime-400 hover:bg-white/5 transition-all" title="Transactions">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{txIcon}</svg>
          </Link>
          <Link href="/firs" className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6b8f72] hover:text-lime-400 hover:bg-white/5 transition-all" title="FIRS Filing">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{firsIcon}</svg>
          </Link>
        </nav>
        <button onClick={handleLogout} className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6b8f72] hover:text-red-400 hover:bg-white/5 transition-all mt-auto" title="Sign out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
        </button>
      </aside>

      {/* ── Content (offset by sidebar on desktop) ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[72px]">

        {/* ── Top header ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            {/* Left: logo on mobile + greeting */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile logo */}
              <div className="lg:hidden w-8 h-8 rounded-lg bg-[#162518] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  Hey, {user?.full_name?.split(' ')[0] ?? 'there'}! 👋
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">Your financial overview</p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isBankLinked && (
                <button
                  onClick={handleSyncTransactions}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-600 hover:border-lime-400 hover:text-lime-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{syncIcon}</svg>
                  <span className="hidden sm:inline">{isSyncing ? 'Syncing…' : 'Refresh'}</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#162518] text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0" />
                {user?.currency ?? 'NGN'}
              </div>
              {/* Mobile logout */}
              <button onClick={handleLogout} className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
              </button>
            </div>
          </div>
        </header>

        {/* Sync result toast */}
        {syncResult && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-3 px-4 py-2.5 rounded-xl bg-lime-50 border border-lime-200 text-sm text-lime-800 flex items-center gap-2">
            <span className="text-base">✅</span>
            <span><strong>{syncResult.processed}</strong> imported · <strong>{syncResult.skipped}</strong> skipped</span>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">

            {/* ══ Left / main column ══ */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">

              {/* Stat cards — auto-scrolling carousel */}
              <div className="relative">
                {/* Scroll track */}
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory gap-3 scrollbar-none pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* Income */}
                  <div className="snap-start shrink-0 w-[82%] sm:w-[calc(33.33%-8px)] lg:w-[calc(33.33%-8px)] bg-[#1B3A2D] text-white rounded-2xl p-5 shadow-md">
                    <p className="text-[#6b9e7a] text-[10px] font-semibold uppercase tracking-widest mb-2">Total Income</p>
                    <p className="text-xl sm:text-2xl font-bold leading-tight">{formatCurrency(summary?.total_income ?? 0)}</p>
                    <div className="mt-3 flex items-center gap-1 text-lime-400 text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                      Income
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="snap-start shrink-0 w-[82%] sm:w-[calc(33.33%-8px)] lg:w-[calc(33.33%-8px)] bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-2">Expenses</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{formatCurrency(Math.abs(summary?.total_expenses ?? 0))}</p>
                    <div className="mt-3 flex items-center gap-1 text-red-400 text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                      </svg>
                      Spending
                    </div>
                  </div>

                  {/* Pending */}
                  <div className="snap-start shrink-0 w-[82%] sm:w-[calc(33.33%-8px)] lg:w-[calc(33.33%-8px)] bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-2">Pending Review</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{summary?.pending_count ?? 0}</p>
                    <div className="mt-3 flex items-center gap-1 text-yellow-500 text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Awaiting
                    </div>
                  </div>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-3 sm:hidden">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => { scrollToCard(i); setCardIndex(i); }}
                      className={`rounded-full transition-all duration-300 ${
                        cardIndex === i
                          ? 'w-5 h-1.5 bg-[#1B3A2D]'
                          : 'w-1.5 h-1.5 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Balance chart */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base">Balance Statistics</h2>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#1B3A2D] inline-block"/>Income
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
                          <div className="flex-1 rounded-t-md bg-[#1B3A2D] group-hover:bg-[#265a3a] transition-colors duration-200" style={{ height: `${Math.max(incH, 3)}%` }}/>
                          <div className="flex-1 rounded-t-md bg-lime-400 group-hover:bg-lime-300 transition-colors duration-200" style={{ height: `${Math.max(expH, 3)}%` }}/>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 text-center leading-tight">{day.label.split(' ')[1]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base">Recent Transactions</h2>
                  {transactions.length > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
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
              </div>
            </div>

            {/* ══ Right sidebar column ══ */}
            <div className="w-full lg:w-[268px] shrink-0 flex flex-col gap-4">

              {/* On mobile: horizontal scroll row for the 2 stat cards */}
              <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">

                {/* Net Balance */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm shrink-0 w-56 sm:w-64 lg:w-full">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Net Balance</p>
                  <p className={`text-2xl sm:text-3xl font-bold leading-tight ${(summary?.net_amount ?? 0) >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                    {formatCurrency(summary?.net_amount ?? 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{user?.currency ?? 'NGN'}</p>
                  {(summary?.net_amount ?? 0) >= 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-lime-50 text-lime-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7"/>
                      </svg>
                      Positive
                    </div>
                  )}
                </div>

                {/* Total Transactions */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm shrink-0 w-56 sm:w-64 lg:w-full">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Total Transactions</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {summary?.total_transactions ?? transactions.length}
                  </p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-lime-400 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(((summary?.total_transactions ?? 0) / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">of 100 monthly limit</p>
                </div>
              </div>

              {/* Bank account card — always full-width */}
              <div className="bg-[#1B3A2D] rounded-2xl p-5 shadow-md">
                <p className="text-[#6b9e7a] text-[10px] font-semibold uppercase tracking-widest mb-4">Bank Account</p>
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
        </main>

        {/* ── Mobile bottom navigation ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around px-4 py-2 pb-safe">
            {/* Dashboard */}
            <button className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#162518]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{dashIcon}</svg>
              </div>
              <span className="text-[10px] font-semibold text-lime-600">Dashboard</span>
            </button>

            {/* Transactions */}
            <Link href="/transactions" className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{txIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">Transactions</span>
            </Link>

            {/* Connect / Sync CTA */}
            <button
              onClick={isBankLinked ? handleSyncTransactions : () => setShowMonoConnect(true)}
              disabled={isSyncing}
              className="flex flex-col items-center gap-1 py-1 px-3"
            >
              <div className="w-8 h-8 rounded-xl bg-[#1B3A2D] flex items-center justify-center">
                <svg className={`w-4 h-4 text-lime-400 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {isBankLinked ? syncIcon : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>}
                </svg>
              </div>
              <span className="text-[10px] font-medium text-gray-500">{isBankLinked ? 'Sync' : 'Connect'}</span>
            </button>

            {/* FIRS */}
            <Link href="/firs" className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{firsIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">FIRS</span>
            </Link>

            {/* Logout */}
            <button onClick={handleLogout} className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">Logout</span>
            </button>
          </div>
        </nav>

      </div>

      {/* ── Mono Connect modal ── */}
      {showMonoConnect && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowMonoConnect(false); }}
        >
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl">

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200"/>
            </div>

            {/* Modal header — themed */}
            <div className="bg-[#162518] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#162518]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Connect Your Bank</p>
                  <p className="text-[#6b9e7a] text-xs">Powered by Mono</p>
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

            {/* Modal body */}
            <div className="p-5 sm:p-6">
              <MonoConnect onSuccess={handleMonoSuccess} onError={() => setShowMonoConnect(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
