'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/lib/auth';
import {
  firsService,
  updateTaxProfile,
  FirsFilingPrep,
  FirsWorksheet,
  FirsField,
} from '@/lib/firs';

type TabKey = 'vat' | 'wht' | 'cit';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function CopyButton({ value }: { value: string | number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-lime-300 hover:text-lime-700 transition-all"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function WorksheetSection({ worksheet }: { worksheet: FirsWorksheet }) {
  return (
    <div className="flex flex-col gap-4">
      {worksheet.rate && (
        <p className="text-xs text-gray-500">
          Rate: <span className="font-semibold text-gray-700">{worksheet.rate}</span>
        </p>
      )}

      <div className="flex flex-col gap-3">
        {worksheet.fields.map((field: FirsField) => (
          <div
            key={field.key}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{field.label}</p>
              {field.portal_hint && (
                <p className="text-xs text-gray-400 mt-0.5">{field.portal_hint}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold text-[#1B3A2D] tabular-nums">
                {typeof field.value === 'number'
                  ? field.value.toLocaleString('en-NG', { minimumFractionDigits: 2 })
                  : field.value}
              </span>
              <CopyButton value={field.value} />
            </div>
          </div>
        ))}
      </div>

      {worksheet.notes?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-widest mb-2">Notes</p>
          <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
            {worksheet.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function FirsPage() {
  const router = useRouter();
  const now = new Date();

  const [user, setUser] = useState<User | null>(null);
  const [prep, setPrep] = useState<FirsFilingPrep | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('vat');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    tin_number: '',
    cac_number: '',
  });

  const loadPrep = useCallback(async () => {
    setLoading(true);
    try {
      const data = await firsService.getFilingPrep(year, month);
      setPrep(data);
    } catch (e) {
      console.error('Failed to load FIRS prep:', e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    const init = async () => {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setProfileForm({
        business_name: currentUser.business_name || '',
        tin_number: currentUser.tin_number || '',
        cac_number: currentUser.cac_number || '',
      });
    };
    init();
  }, [router]);

  useEffect(() => {
    if (user) loadPrep();
  }, [user, loadPrep]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateTaxProfile(profileForm);
      await loadPrep();
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSavingProfile(false);
    }
  };

  const dashIcon = <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>;
  const txIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>;
  const firsIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>;
  const logoutIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>;

  const activeWorksheet = prep ? prep[tab] : null;
  const checklistDone = prep?.readiness.checklist.filter((i) => i.done).length ?? 0;
  const checklistTotal = prep?.readiness.checklist.length ?? 0;

  if (loading && !prep) {
    return (
      <div className="min-h-screen bg-[#f0f2ee] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="mt-4 text-gray-500 text-sm">Preparing FIRS filing data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f0f2ee] font-sans">

      {/* Sidebar */}
      <aside className="hidden lg:flex w-[72px] bg-[#162518] flex-col items-center py-6 shrink-0 fixed left-0 top-0 bottom-0 z-30">
        <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center mb-10 shrink-0">
          <svg className="w-6 h-6 text-[#162518]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <nav className="flex flex-col items-center gap-2 flex-1">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6b8f72] hover:text-lime-400 hover:bg-white/5 transition-all" title="Dashboard">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{dashIcon}</svg>
          </Link>
          <Link href="/transactions" className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6b8f72] hover:text-lime-400 hover:bg-white/5 transition-all" title="Transactions">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{txIcon}</svg>
          </Link>
          <Link href="/firs" className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center" title="FIRS Filing">
            <svg className="w-5 h-5 text-[#162518]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{firsIcon}</svg>
          </Link>
        </nav>
        <button onClick={() => authService.logout()} className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6b8f72] hover:text-red-400 hover:bg-white/5 transition-all mt-auto" title="Sign out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{logoutIcon}</svg>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-[72px]">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900">FIRS Filing Prep</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Copy-ready figures for TaxPro-Max portal</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => firsService.downloadCsv(year, month)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Export CSV
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#162518] text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0"/>
                {user?.currency ?? 'NGN'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 flex flex-col gap-5">

          {/* Period selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Filing period</label>
              <div className="flex gap-2 mt-1.5">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-28 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {prep && (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Period</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{prep.period.label}</p>
                <p className="text-xs text-gray-400">{prep.readiness.transaction_count} transactions</p>
              </div>
            )}
          </div>

          {/* Taxpayer profile */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Taxpayer details</h2>
              <span className="text-xs text-gray-400">Used on FIRS portal</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Business name</label>
                <input
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, business_name: e.target.value }))}
                  placeholder="Registered business name"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">TIN</label>
                <input
                  value={profileForm.tin_number}
                  onChange={(e) => setProfileForm((p) => ({ ...p, tin_number: e.target.value }))}
                  placeholder="Tax Identification Number"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">CAC number</label>
                <input
                  value={profileForm.cac_number}
                  onChange={(e) => setProfileForm((p) => ({ ...p, cac_number: e.target.value }))}
                  placeholder="RC / BN number"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="mt-3 px-4 py-2 rounded-xl bg-[#1B3A2D] text-white text-xs font-bold hover:bg-[#243f2f] disabled:opacity-60 transition-all"
            >
              {savingProfile ? 'Saving…' : 'Save taxpayer details'}
            </button>
          </div>

          {/* Checklist */}
          {prep && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">Pre-filing checklist</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${checklistDone === checklistTotal ? 'bg-lime-100 text-lime-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {checklistDone}/{checklistTotal} complete
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {prep.readiness.checklist.map((item) => (
                  <div key={item.id} className={`flex items-start gap-2.5 p-3 rounded-xl border ${item.done ? 'bg-lime-50 border-lime-200' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${item.done ? 'bg-lime-500 text-white' : 'bg-gray-300 text-white'}`}>
                      {item.done ? '✓' : '!'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                      {!item.done && <p className="text-[10px] text-gray-500 mt-0.5">{item.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Worksheet tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['vat', 'wht', 'cit'] as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  tab === key
                    ? 'bg-[#1B3A2D] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {key === 'vat' ? 'VAT Return' : key === 'wht' ? 'WHT Schedule' : 'CIT Prep'}
              </button>
            ))}
          </div>

          {activeWorksheet && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">{activeWorksheet.title}</h2>
              <WorksheetSection worksheet={activeWorksheet} />
            </div>
          )}

          {/* Disclaimer */}
          {prep && (
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Disclaimer:</strong> {prep.disclaimer}
            </div>
          )}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around px-2 py-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 py-1 px-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{dashIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">Dashboard</span>
            </Link>
            <Link href="/transactions" className="flex flex-col items-center gap-1 py-1 px-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{txIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-gray-400">Transactions</span>
            </Link>
            <Link href="/firs" className="flex flex-col items-center gap-1 py-1 px-2">
              <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#162518]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{firsIcon}</svg>
              </div>
              <span className="text-[10px] font-semibold text-lime-600">FIRS</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
