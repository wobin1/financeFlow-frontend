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
import {
  AppPage,
  AppHeader,
  AppMain,
  AppPanel,
  AppLabel,
  CurrencyBadge,
  AppLoading,
  AppErrorState,
  fieldClassName,
} from '@/components/app/PageChrome';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api';

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
      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e4e7e0] text-[#6b8f72] hover:bg-[#f7f8f5] hover:border-[#162518] hover:text-[#162518] transition-all"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function WorksheetSection({ worksheet }: { worksheet: FirsWorksheet }) {
  return (
    <div className="flex flex-col gap-4">
      {worksheet.rate && (
        <p className="text-xs text-[#6b8f72]">
          Rate: <span className="font-semibold text-[#162518]">{worksheet.rate}</span>
        </p>
      )}

      <div className="flex flex-col gap-3">
        {worksheet.fields.map((field: FirsField) => (
          <AppPanel
            key={field.key}
            className="flex flex-col sm:flex-row sm:items-center gap-3 !p-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#162518]">{field.label}</p>
              {field.portal_hint && (
                <p className="text-xs text-[#9aab9e] mt-0.5">{field.portal_hint}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold text-[#162518] tabular-nums">
                {typeof field.value === 'number'
                  ? field.value.toLocaleString('en-NG', { minimumFractionDigits: 2 })
                  : Number(field.value).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
              <CopyButton value={field.value} />
            </div>
          </AppPanel>
        ))}
      </div>

      {worksheet.notes?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-[0.06em] mb-2">Notes</p>
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
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    tin_number: '',
    cac_number: '',
  });

  const loadPrep = useCallback(async () => {
    setLoading(true);
    setUpgradeRequired(false);
    setLoadError(null);
    try {
      const data = await firsService.getFilingPrep(year, month);
      setPrep(data);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 402) {
        setUpgradeRequired(true);
        setPrep(null);
      } else {
        setLoadError(getApiErrorMessage(e, 'Failed to load FIRS prep'));
        setPrep(null);
      }
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
    setProfileError(null);
    try {
      await updateTaxProfile(profileForm);
      await loadPrep();
    } catch (e) {
      setProfileError(getApiErrorMessage(e, 'Failed to save profile'));
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
    return <AppLoading label="Preparing FIRS filing data…" />;
  }

  return (
    <AppPage active="firs">
      <AppHeader
        title="FIRS Filing Prep"
        subtitle="Copy-ready figures for TaxPro-Max portal"
        actions={
          <>
            <button
              onClick={() => firsService.downloadCsv(year, month)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e4e7e0] text-xs font-semibold text-[#6b8f72] hover:border-[#162518] hover:text-[#162518] transition-all"
            >
              Export CSV
            </button>
            <CurrencyBadge currency={user?.currency} />
          </>
        }
      />

      <AppMain className="flex flex-col gap-5">

          {upgradeRequired && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-900">FIRS filing is on paid plans</p>
                <p className="text-xs text-amber-800 mt-1">
                  Upgrade to Starter or higher to unlock VAT, WHT, and CIT prep worksheets.
                </p>
              </div>
              <Link
                href="/billing"
                className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#162518] text-white text-sm font-semibold hover:bg-[#243f2f]"
              >
                View plans
              </Link>
            </div>
          )}

          {loadError && !upgradeRequired && (
            <AppErrorState message={loadError} onRetry={loadPrep} />
          )}

          {profileError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {profileError}
            </div>
          )}

          {/* Period selector */}
          <AppPanel className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 min-w-0">
              <AppLabel>Filing period</AppLabel>
              <div className="grid grid-cols-[1fr_7.5rem] gap-2.5 mt-2">
                <Select
                  aria-label="Filing month"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Filing year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ),
                  )}
                </Select>
              </div>
            </div>
            {prep && (
              <div className="sm:text-right shrink-0 sm:pl-2 sm:border-l sm:border-[#eef1ea]">
                <AppLabel>Period</AppLabel>
                <p className="text-sm font-bold text-[#162518] mt-1">{prep.period.label}</p>
                <p className="text-xs text-[#9aab9e]">
                  {prep.readiness.transaction_count} transactions
                </p>
              </div>
            )}
          </AppPanel>

          {/* Taxpayer profile */}
          <AppPanel>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#162518]">Taxpayer details</h2>
              <span className="text-xs text-[#9aab9e]">Used on FIRS portal</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <AppLabel>Business name</AppLabel>
                <input
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, business_name: e.target.value }))}
                  placeholder="Registered business name"
                  className={cn(fieldClassName, 'mt-1.5')}
                />
              </div>
              <div>
                <AppLabel>TIN</AppLabel>
                <input
                  value={profileForm.tin_number}
                  onChange={(e) => setProfileForm((p) => ({ ...p, tin_number: e.target.value }))}
                  placeholder="Tax Identification Number"
                  className={cn(fieldClassName, 'mt-1.5')}
                />
              </div>
              <div>
                <AppLabel>CAC number</AppLabel>
                <input
                  value={profileForm.cac_number}
                  onChange={(e) => setProfileForm((p) => ({ ...p, cac_number: e.target.value }))}
                  placeholder="RC / BN number"
                  className={cn(fieldClassName, 'mt-1.5')}
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="mt-4 px-4 py-2 rounded-xl bg-[#162518] text-white text-xs font-bold hover:bg-[#243f2f] disabled:opacity-60 transition-all"
            >
              {savingProfile ? 'Saving…' : 'Save taxpayer details'}
            </button>
          </AppPanel>

          {/* Checklist */}
          {prep && (
            <AppPanel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#162518]">Pre-filing checklist</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${checklistDone === checklistTotal ? 'bg-lime-100 text-lime-700' : 'bg-amber-100 text-amber-700'}`}>
                  {checklistDone}/{checklistTotal} complete
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {prep.readiness.checklist.map((item) => (
                  <div key={item.id} className={`flex items-start gap-2.5 p-3 rounded-xl border ${item.done ? 'bg-lime-50 border-lime-200' : 'bg-[#f7f8f5] border-[#e4e7e0]'}`}>
                    <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-lime-500 text-white' : 'bg-[#d8ddd2] text-[#6b8f72]'}`}>
                      {item.done ? (
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        <span className="text-[9px] font-bold">!</span>
                      )}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#162518]">{item.label}</p>
                      {!item.done && <p className="text-[10px] text-[#6b8f72] mt-0.5">{item.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </AppPanel>
          )}

          {/* Worksheet tabs */}
          <div className="flex gap-1 p-1 bg-[#eef1ea] rounded-xl overflow-x-auto scrollbar-none">
            {(['vat', 'wht', 'cit'] as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`shrink-0 flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                  tab === key
                    ? 'bg-[#162518] text-lime-400'
                    : 'text-[#6b8f72] hover:text-[#162518]'
                }`}
              >
                {key === 'vat' ? 'VAT Return' : key === 'wht' ? 'WHT Schedule' : 'CIT Prep'}
              </button>
            ))}
          </div>

          {activeWorksheet && (
            <div>
              <h2 className="text-base font-bold text-[#162518] mb-4">{activeWorksheet.title}</h2>
              <WorksheetSection worksheet={activeWorksheet} />
            </div>
          )}

          {/* Disclaimer */}
          {prep && (
            <div className="bg-[#eef1ea] border border-[#e4e7e0] rounded-2xl p-4 text-xs text-[#6b8f72] leading-relaxed">
              <strong className="text-[#162518]">Disclaimer:</strong> {prep.disclaimer}
            </div>
          )}
      </AppMain>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-[#e4e7e0]">
          <div className="flex items-center justify-around px-2 py-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 py-1 px-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9aab9e]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{dashIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-[#9aab9e]">Dashboard</span>
            </Link>
            <Link href="/transactions" className="flex flex-col items-center gap-1 py-1 px-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9aab9e]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{txIcon}</svg>
              </div>
              <span className="text-[10px] font-medium text-[#9aab9e]">Transactions</span>
            </Link>
            <Link href="/firs" className="flex flex-col items-center gap-1 py-1 px-2">
              <div className="w-8 h-8 rounded-xl bg-lime-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#162518]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">{firsIcon}</svg>
              </div>
              <span className="text-[10px] font-semibold text-[#162518]">FIRS</span>
            </Link>
          </div>
        </nav>
    </AppPage>
  );
}
