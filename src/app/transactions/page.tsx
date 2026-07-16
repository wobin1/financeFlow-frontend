'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/lib/auth';
import {
  transactionService,
  Transaction,
  BUSINESS_CATEGORIES,
  categoryLabel,
  DEFAULT_VAT_DEDUCTIBLE_CATEGORIES,
  WHT_RATE_OPTIONS,
} from '@/lib/transactions';
import Sidebar, { sidebarContentOffsetClass } from '@/components/Sidebar';

type FilterTab = 'all' | 'income' | 'expenses' | 'pending';
type SortKey  = 'date' | 'amount';
type EntryType = 'income' | 'expense';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-lime-100 text-lime-700',
  pending:   'bg-yellow-100 text-yellow-700',
  rejected:  'bg-red-100 text-red-600',
  flagged:   'bg-orange-100 text-orange-600',
};

const CATEGORY_GROUPS = Array.from(
  new Set(BUSINESS_CATEGORIES.map((c) => c.group)),
);

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TransactionsPage() {
  const [user, setUser]               = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<FilterTab>('all');
  const [search, setSearch]           = useState('');
  const [sortKey, setSortKey]         = useState<SortKey>('date');
  const [sortAsc, setSortAsc]         = useState(false);
  const [editingTx, setEditingTx]     = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vatDeductible, setVatDeductible] = useState(false);
  const [whtApplicable, setWhtApplicable] = useState(false);
  const [whtRate, setWhtRate] = useState(5);
  const [categorySearch, setCategorySearch] = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [entryType, setEntryType]     = useState<EntryType>('expense');
  const [merchantName, setMerchantName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [txDate, setTxDate]           = useState(todayISO);
  const [description, setDescription] = useState('');
  const [addCategory, setAddCategory] = useState('');
  const [addVat, setAddVat]           = useState(false);
  const [addWht, setAddWht]           = useState(false);
  const [addWhtRate, setAddWhtRate]   = useState(5);
  const [addCategorySearch, setAddCategorySearch] = useState('');
  const [adding, setAdding]           = useState(false);
  const [addError, setAddError]       = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) { router.push('/login'); return; }
        setUser(currentUser);
        const data = await transactionService.getTransactions({ limit: 200 });
        setTransactions(data);
      } catch (e) {
        console.error('Failed to load transactions:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const formatCurrency = (amount: number) => {
    const currency = user?.currency || 'NGN';
    return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
      style: 'currency', currency,
    }).format(amount);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filter === 'income')   list = list.filter((t) => t.amount > 0);
    if (filter === 'expenses') list = list.filter((t) => t.amount < 0);
    if (filter === 'pending')  list = list.filter((t) => t.status === 'pending');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.merchant_name?.toLowerCase().includes(q) ||
          categoryLabel(t.category).toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const v = sortKey === 'date'
        ? new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        : a.amount - b.amount;
      return sortAsc ? v : -v;
    });
    return list;
  }, [transactions, filter, search, sortKey, sortAsc]);

  const stats = useMemo(() => ({
    total:    transactions.length,
    income:   transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    expenses: transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
    pending:  transactions.filter((t) => t.status === 'pending').length,
  }), [transactions]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return BUSINESS_CATEGORIES;
    return BUSINESS_CATEGORIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q),
    );
  }, [categorySearch]);

  const addCategories = useMemo(() => {
    const byType = BUSINESS_CATEGORIES.filter((c) =>
      entryType === 'income' ? c.group === 'Income' : c.group !== 'Income',
    );
    const q = addCategorySearch.trim().toLowerCase();
    if (!q) return byType;
    return byType.filter(
      (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q),
    );
  }, [entryType, addCategorySearch]);

  const addCategoryGroups = useMemo(
    () => Array.from(new Set(addCategories.map((c) => c.group))),
    [addCategories],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  };

  const openAdd = () => {
    setShowAdd(true);
    setEntryType('expense');
    setMerchantName('');
    setAmountInput('');
    setTxDate(todayISO());
    setDescription('');
    setAddCategory('');
    setAddVat(false);
    setAddWht(false);
    setAddWhtRate(5);
    setAddCategorySearch('');
    setAddError(null);
  };

  const closeAdd = () => {
    if (adding) return;
    setShowAdd(false);
    setAddError(null);
  };

  const selectAddCategory = (value: string) => {
    setAddCategory(value);
    if (entryType === 'expense') {
      setAddVat(DEFAULT_VAT_DEDUCTIBLE_CATEGORIES.has(value));
    }
    if (value === 'withholding_tax') {
      setAddWht(false);
    }
  };

  const switchEntryType = (type: EntryType) => {
    setEntryType(type);
    setAddCategory('');
    setAddVat(false);
    setAddWht(false);
    setAddCategorySearch('');
  };

  const saveManualEntry = async () => {
    const amountAbs = Number(amountInput);
    if (!merchantName.trim()) {
      setAddError('Enter a merchant or payee name.');
      return;
    }
    if (!Number.isFinite(amountAbs) || amountAbs <= 0) {
      setAddError('Enter a valid amount greater than zero.');
      return;
    }
    if (!txDate) {
      setAddError('Pick a transaction date.');
      return;
    }
    if (!addCategory) {
      setAddError('Select a category.');
      return;
    }

    setAdding(true);
    setAddError(null);
    try {
      const signedAmount = entryType === 'income' ? amountAbs : -amountAbs;
      const created = await transactionService.createTransaction({
        merchant_name: merchantName.trim(),
        amount: signedAmount,
        description: description.trim() || merchantName.trim(),
        transaction_date: txDate,
        currency: user?.currency || 'NGN',
        source: 'manual',
        category: addCategory,
        vat_deductible: entryType === 'expense' ? addVat : false,
        wht_applicable: entryType === 'expense' ? addWht : false,
        wht_rate: entryType === 'expense' && addWht ? addWhtRate : null,
      });
      setTransactions((prev) => [created, ...prev]);
      setShowAdd(false);
    } catch (e) {
      console.error('Failed to create transaction:', e);
      setAddError('Could not save entry. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const openCategorize = (tx: Transaction) => {
    const current =
      BUSINESS_CATEGORIES.find((c) => c.value === tx.category || c.label === tx.category)?.value
      ?? '';
    setEditingTx(tx);
    setSelectedCategory(current);
    setVatDeductible(
      tx.vat_deductible ?? (current ? DEFAULT_VAT_DEDUCTIBLE_CATEGORIES.has(current) : false),
    );
    setWhtApplicable(tx.wht_applicable ?? false);
    setWhtRate(tx.wht_rate ?? 5);
    setCategorySearch('');
    setSaveError(null);
  };

  const closeCategorize = () => {
    if (saving) return;
    setEditingTx(null);
    setSelectedCategory('');
    setCategorySearch('');
    setSaveError(null);
  };

  const selectCategory = (value: string) => {
    setSelectedCategory(value);
    // Auto-suggest VAT deductible for typical purchase categories (user can override)
    if (editingTx?.vat_deductible == null) {
      setVatDeductible(DEFAULT_VAT_DEDUCTIBLE_CATEGORIES.has(value));
    }
    if (value === 'withholding_tax') {
      setWhtApplicable(false);
    }
  };

  const saveCategory = async () => {
    if (!editingTx || !selectedCategory) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await transactionService.updateTransaction(editingTx.id, {
        status: 'confirmed',
        category: selectedCategory,
        vat_deductible: vatDeductible,
        wht_applicable: whtApplicable,
        wht_rate: whtApplicable ? whtRate : null,
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTx.id ? { ...t, ...updated } : t)),
      );
      setEditingTx(null);
      setSelectedCategory('');
      setCategorySearch('');
    } catch (e) {
      console.error('Failed to update category:', e);
      setSaveError('Could not save category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── shared icon paths ──────────────────────────────────────────────────
  const dashIcon   = <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>;
  const txIcon     = <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>;
  const firsIcon   = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>;
  const logoutIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;
  const upDown     = (key: SortKey) => sortKey === key ? (sortAsc ? '↑' : '↓') : '↕';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2ee] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="mt-4 text-gray-500 text-sm">Loading transactions…</p>
        </div>
      </div>
    );
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',      label: `All (${stats.total})` },
    { key: 'income',   label: 'Income' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'pending',  label: `Pending (${stats.pending})` },
  ];

  return (
    <div className="flex min-h-screen bg-[#f0f2ee] font-sans">

      <Sidebar active="transactions" />

      {/* ── Main ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarContentOffsetClass}`}>

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden w-8 h-8 rounded-lg bg-[#162518] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900">Transactions</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Add cash entries or categorize bank transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B3A2D] text-white text-xs font-bold hover:bg-[#243f2f] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Add entry
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#162518] text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0"/>
                {user?.currency ?? 'NGN'}
              </div>
              <button onClick={() => authService.logout()} className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 flex flex-col gap-5">

          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1B3A2D] text-white rounded-2xl p-4 shadow-md">
              <p className="text-[#6b9e7a] text-[10px] font-semibold uppercase tracking-widest mb-1">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-[#6b9e7a] text-xs mt-0.5">transactions</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1">Income</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{formatCurrency(stats.income)}</p>
              <p className="text-lime-500 text-xs mt-0.5 font-medium">↑ received</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1">Expenses</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{formatCurrency(Math.abs(stats.expenses))}</p>
              <p className="text-red-400 text-xs mt-0.5 font-medium">↓ spent</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-yellow-500 text-xs mt-0.5 font-medium">awaiting</p>
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">

            {/* Filter + search toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100">
              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#f0f2ee] rounded-xl overflow-x-auto scrollbar-none shrink-0">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      filter === key
                        ? 'bg-[#1B3A2D] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search merchant or category…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-[#f7f8f5] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Column headers — desktop */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1.2fr_1fr_0.8fr_0.6fr] px-5 py-2.5 border-b border-gray-50 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              <span>Merchant</span>
              <button onClick={() => toggleSort('date')} className="text-left hover:text-gray-600 transition-colors flex items-center gap-1">
                Date <span className="font-mono">{upDown('date')}</span>
              </button>
              <span>Category</span>
              <button onClick={() => toggleSort('amount')} className="text-right hover:text-gray-600 transition-colors flex items-center justify-end gap-1">
                Amount <span className="font-mono">{upDown('amount')}</span>
              </button>
              <span className="text-right">Status</span>
              <span className="text-right">Edit</span>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">No transactions found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {search
                      ? 'Try a different search term'
                      : 'Add a cash sale or expense, or sync your bank from the dashboard'}
                  </p>
                  {!search && (
                    <button
                      type="button"
                      onClick={openAdd}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1B3A2D] text-white text-xs font-bold hover:bg-[#243f2f]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                      Add manual entry
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 overflow-y-auto">
                {filtered.map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => openCategorize(tx)}
                    className="w-full text-left grid grid-cols-[auto_1fr] sm:grid-cols-[2fr_1fr_1.2fr_1fr_0.8fr_0.6fr] items-center gap-3 sm:gap-0 px-4 sm:px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {/* Mobile layout */}
                    <div className={`sm:hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-lime-100' : 'bg-red-50'}`}>
                      <svg className={`w-4 h-4 ${tx.amount > 0 ? 'text-lime-600' : 'text-red-400'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        {tx.amount > 0
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>}
                      </svg>
                    </div>
                    <div className="sm:hidden flex justify-between items-start min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                          {tx.merchant_name}
                          {tx.source === 'manual' && (
                            <span className="ml-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">Manual</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{categoryLabel(tx.category)} · {formatDate(tx.transaction_date)}</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-lime-600' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tx.status] ?? 'bg-gray-100 text-gray-500'}`}>{tx.status}</span>
                      </div>
                    </div>

                    {/* Desktop columns */}
                    <div className="hidden sm:flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-lime-100' : 'bg-red-50'}`}>
                        <svg className={`w-3.5 h-3.5 ${tx.amount > 0 ? 'text-lime-600' : 'text-red-400'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          {tx.amount > 0
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>}
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {tx.merchant_name}
                          {tx.source === 'manual' && (
                            <span className="ml-1.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md align-middle">Manual</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{tx.raw_description}</p>
                      </div>
                    </div>
                    <p className="hidden sm:block text-xs text-gray-500">{formatDate(tx.transaction_date)}</p>
                    <p className={`hidden sm:block text-xs truncate ${tx.category ? 'text-gray-700 font-medium' : 'text-gray-300 italic'}`}>
                      {categoryLabel(tx.category)}
                      {(tx.vat_deductible || tx.wht_applicable) && (
                        <span className="ml-1 text-[10px] text-gray-400 font-normal">
                          {tx.vat_deductible ? '· VAT' : ''}
                          {tx.wht_applicable ? ' · WHT' : ''}
                        </span>
                      )}
                    </p>
                    <p className={`hidden sm:block text-sm font-bold text-right ${tx.amount > 0 ? 'text-lime-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </p>
                    <div className="hidden sm:flex justify-end">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[tx.status] ?? 'bg-gray-100 text-gray-500'}`}>{tx.status}</span>
                    </div>
                    <div className="hidden sm:flex justify-end">
                      <span className="text-[10px] font-semibold text-[#1B3A2D] px-2.5 py-1 rounded-lg bg-lime-50 border border-lime-200">
                        Categorize
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Footer count */}
            {filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                Showing <strong className="text-gray-600">{filtered.length}</strong> of <strong className="text-gray-600">{transactions.length}</strong> transactions
              </div>
            )}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around px-4 py-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{dashIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">Dashboard</span>
            </Link>
            <Link href="/transactions" className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#162518]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{txIcon}</svg>
              </div>
              <span className="text-[10px] font-semibold text-lime-600">Transactions</span>
            </Link>
            <Link href="/firs" className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{firsIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">FIRS</span>
            </Link>
            <button onClick={() => authService.logout()} className="flex flex-col items-center gap-1 py-1 px-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Categorize modal */}
      {editingTx && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeCategorize(); }}
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900">Categorize transaction</h2>
                <p className="text-xs text-gray-500 mt-1 truncate">{editingTx.merchant_name}</p>
                <p className={`text-sm font-bold mt-1 ${editingTx.amount > 0 ? 'text-lime-600' : 'text-red-500'}`}>
                  {editingTx.amount > 0 ? '+' : ''}{formatCurrency(editingTx.amount)}
                  <span className="text-gray-400 font-normal ml-2">{formatDate(editingTx.transaction_date)}</span>
                </p>
              </div>
              <button
                onClick={closeCategorize}
                disabled={saving}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-50 shrink-0">
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories…"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-[#f7f8f5] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {CATEGORY_GROUPS.map((group) => {
                const items = filteredCategories.filter((c) => c.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-4">
                    <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      {group}
                    </p>
                    <div className="flex flex-col gap-1">
                      {items.map((cat) => {
                        const active = selectedCategory === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => selectCategory(cat.value)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between gap-2 ${
                              active
                                ? 'bg-[#1B3A2D] text-white'
                                : 'hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <span className="font-medium">{cat.label}</span>
                            {active && (
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No matching categories</p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-3">
              {editingTx && editingTx.amount < 0 && (
                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-[#f7f8f5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatDeductible}
                      onChange={(e) => setVatDeductible(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1B3A2D] focus:ring-lime-400"
                    />
                    <span>
                      <span className="text-sm font-semibold text-gray-900 block">VAT deductible</span>
                      <span className="text-[11px] text-gray-500 leading-snug">
                        Claim input VAT (7.5%) on this purchase for FIRS VAT return
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-[#f7f8f5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whtApplicable}
                      onChange={(e) => setWhtApplicable(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1B3A2D] focus:ring-lime-400"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 block">WHT applicable</span>
                      <span className="text-[11px] text-gray-500 leading-snug">
                        This payment is subject to withholding tax
                      </span>
                      {whtApplicable && (
                        <select
                          value={whtRate}
                          onChange={(e) => setWhtRate(Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                        >
                          {WHT_RATE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              WHT rate {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </span>
                  </label>
                </div>
              )}

              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {saveError}
                </p>
              )}
              <p className="text-[11px] text-gray-400">
                Saving will set status to <strong className="text-gray-600">confirmed</strong> for FIRS prep.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeCategorize}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCategory}
                  disabled={saving || !selectedCategory}
                  className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-bold hover:bg-[#243f2f] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add manual entry modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeAdd(); }}
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Add manual entry</h2>
                <p className="text-xs text-gray-500 mt-1">Record a cash sale, expense, or other bookkeeping entry</p>
              </div>
              <button
                onClick={closeAdd}
                disabled={adding}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex p-1 bg-[#f0f2ee] rounded-xl">
                {([
                  { key: 'expense' as EntryType, label: 'Expense' },
                  { key: 'income' as EntryType, label: 'Income' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => switchEntryType(key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      entryType === key
                        ? 'bg-[#1B3A2D] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                  Merchant / payee
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder={entryType === 'income' ? 'Customer or payer' : 'Vendor or payee'}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-[#f7f8f5] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Amount ({user?.currency ?? 'NGN'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-[#f7f8f5] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-[#f7f8f5] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                  Description <span className="normal-case tracking-normal font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Note or reference"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-[#f7f8f5] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={addCategorySearch}
                  onChange={(e) => setAddCategorySearch(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-[#f7f8f5] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent mb-2"
                />
                <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 p-1">
                  {addCategoryGroups.map((group) => {
                    const items = addCategories.filter((c) => c.group === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group} className="mb-2">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                          {group}
                        </p>
                        {items.map((cat) => {
                          const active = addCategory === cat.value;
                          return (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => selectAddCategory(cat.value)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                                active
                                  ? 'bg-[#1B3A2D] text-white'
                                  : 'hover:bg-gray-50 text-gray-800'
                              }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                  {addCategories.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-6">No matching categories</p>
                  )}
                </div>
              </div>

              {entryType === 'expense' && (
                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-[#f7f8f5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addVat}
                      onChange={(e) => setAddVat(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1B3A2D] focus:ring-lime-400"
                    />
                    <span>
                      <span className="text-sm font-semibold text-gray-900 block">VAT deductible</span>
                      <span className="text-[11px] text-gray-500 leading-snug">
                        Claim input VAT (7.5%) on this purchase
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-[#f7f8f5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addWht}
                      onChange={(e) => setAddWht(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1B3A2D] focus:ring-lime-400"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 block">WHT applicable</span>
                      <span className="text-[11px] text-gray-500 leading-snug">
                        This payment is subject to withholding tax
                      </span>
                      {addWht && (
                        <select
                          value={addWhtRate}
                          onChange={(e) => setAddWhtRate(Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                        >
                          {WHT_RATE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              WHT rate {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-3">
              {addError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {addError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  disabled={adding}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveManualEntry}
                  disabled={adding || !merchantName.trim() || !addCategory || !amountInput}
                  className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-bold hover:bg-[#243f2f] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {adding ? 'Saving…' : 'Save entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
