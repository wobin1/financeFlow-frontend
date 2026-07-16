import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-[#f7f8f5]/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#162518] flex items-center justify-center">
              <svg className="w-4 h-4 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">FinanceFlow</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-[#1B3A2D] text-white px-4 py-2 rounded-xl hover:bg-[#243f2f] active:scale-95 transition-all"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-lime-400/10 blur-3xl" />
          <div className="absolute top-48 -left-24 w-[350px] h-[350px] rounded-full bg-[#1B3A2D]/8 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-lime-400/20 border border-lime-400/30 text-[#1B3A2D] text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"/>
            Built for Nigerian businesses
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6 max-w-3xl mx-auto">
            Smart finance for{' '}
            <span className="text-[#1B3A2D] relative">
              growing businesses
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 6C50 2 150 2 298 6" stroke="#a3e635" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect your Nigerian bank account, let AI categorize every transaction,
            and get real-time insights — all in one clean dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#1B3A2D] text-white font-semibold text-sm hover:bg-[#243f2f] active:scale-[0.98] transition-all shadow-md"
            >
              Start for free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:border-[#1B3A2D] hover:text-[#1B3A2D] transition-all"
            >
              Sign in to dashboard
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-400">No credit card required · Setup in under 2 minutes</p>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="bg-[#162518]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '50K+', label: 'Businesses served' },
            { value: '99.9%', label: 'Uptime reliability' },
            { value: '₦2B+', label: 'Transactions processed' },
            { value: '<2 min', label: 'Average setup time' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl sm:text-3xl font-bold text-lime-400">{value}</p>
              <p className="text-[#6b9e7a] text-xs sm:text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Everything your business needs</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
            From automatic transaction imports to AI-driven insights — FinanceFlow handles the bookkeeping so you can focus on growth.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              ),
              color: 'bg-lime-100 text-lime-700',
              title: 'AI-Powered Categorization',
              desc: 'Every transaction is automatically tagged with the right category — saving hours of manual bookkeeping.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              ),
              color: 'bg-[#1B3A2D]/10 text-[#1B3A2D]',
              title: 'Nigerian Bank Sync',
              desc: 'Powered by Mono — connect GTBank, Access, Zenith, UBA, and 50+ other Nigerian banks in seconds.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              ),
              color: 'bg-blue-100 text-blue-700',
              title: 'Real-time Insights',
              desc: 'Track income vs expenses with live charts. See your financial health at a glance, every single day.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              ),
              color: 'bg-purple-100 text-purple-700',
              title: 'Auto-sync Transactions',
              desc: 'Hit refresh and get the latest from your bank instantly. No manual CSV uploads, no delays.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              ),
              color: 'bg-orange-100 text-orange-700',
              title: 'Bank-grade Security',
              desc: 'Encrypted data, read-only bank access, and zero credential storage. Your money stays yours.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              ),
              color: 'bg-teal-100 text-teal-700',
              title: 'Clean Audit Trail',
              desc: 'Every transaction timestamped, categorized, and searchable. Perfect for tax season or investor reviews.',
            },
          ].map(({ icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {icon}
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1.5">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-[#162518]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Up and running in minutes</h2>
            <p className="text-[#6b9e7a] text-sm sm:text-base max-w-xl mx-auto">
              Three simple steps from signup to full financial clarity.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-[#1B3A2D]" aria-hidden="true"/>

            {[
              {
                step: '01',
                title: 'Create your account',
                desc: 'Sign up in seconds with just your email. No lengthy forms, no waiting.',
              },
              {
                step: '02',
                title: 'Connect your bank',
                desc: 'Securely link your Nigerian bank account via Mono — read-only, safe, instant.',
              },
              {
                step: '03',
                title: 'Watch the magic',
                desc: 'Transactions sync automatically, AI categorizes them, and your dashboard lights up.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-lime-400 flex items-center justify-center mx-auto mb-5 relative z-10">
                  <span className="text-[#162518] font-bold text-sm">{step}</span>
                </div>
                <h3 className="text-white font-bold text-base mb-2">{title}</h3>
                <p className="text-[#6b9e7a] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Simple pricing</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
            Start free. Upgrade when you need AI categorization, FIRS prep, or higher limits.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: 'Free',
              price: '₦0',
              blurb: 'Essentials to get going',
              features: ['Manual transactions only', '50 transactions / month', 'Basic dashboard'],
            },
            {
              name: 'Starter',
              price: '₦3,500',
              blurb: 'Unlimited tracking + tax prep',
              features: ['No bank linking', 'Unlimited transactions', 'Manual categorization', 'FIRS filing prep'],
            },
            {
              name: 'Growth',
              price: '₦10,000',
              blurb: 'Bank sync and AI categorization',
              features: ['2 bank accounts', 'Unlimited transactions', 'AI categorization', 'FIRS CSV export', 'Advanced analytics'],
              featured: true,
            },
            {
              name: 'Business',
              price: '₦20,000',
              blurb: 'More accounts + priority support',
              features: ['5 bank accounts', 'Unlimited transactions', 'Everything in Growth', 'Priority support'],
            },
          ].map(({ name, price, blurb, features, featured }) => (
            <div
              key={name}
              className={`rounded-2xl p-5 border flex flex-col ${
                featured
                  ? 'bg-[#1B3A2D] border-[#1B3A2D] text-white shadow-md'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <p className={`text-sm font-bold ${featured ? 'text-lime-400' : 'text-gray-900'}`}>{name}</p>
              <p className={`mt-2 text-2xl font-bold ${featured ? 'text-white' : 'text-gray-900'}`}>
                {price}
                <span className={`text-xs font-medium ml-1 ${featured ? 'text-[#6b9e7a]' : 'text-gray-400'}`}>/mo</span>
              </p>
              <p className={`text-xs mt-2 ${featured ? 'text-[#9bb8a3]' : 'text-gray-500'}`}>{blurb}</p>
              <ul className={`mt-4 space-y-2 flex-1 ${featured ? 'text-[#c5d9cb]' : 'text-gray-600'}`}>
                {features.map((f) => (
                  <li key={f} className="text-xs flex gap-2">
                    <span className={featured ? 'text-lime-400' : 'text-[#1B3A2D]'}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-5 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                  featured
                    ? 'bg-lime-400 text-[#162518] hover:bg-lime-300'
                    : 'bg-[#1B3A2D] text-white hover:bg-[#243f2f]'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <div className="bg-[#1B3A2D] rounded-3xl px-8 sm:px-16 py-14 text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-lime-400/10 blur-2xl pointer-events-none" aria-hidden="true"/>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" aria-hidden="true"/>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to take control of your finances?
            </h2>
            <p className="text-[#6b9e7a] text-sm sm:text-base mb-8 max-w-xl mx-auto">
              Join 50,000+ Nigerian businesses already using FinanceFlow to track, categorize, and grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-lime-400 text-[#162518] font-bold text-sm hover:bg-lime-300 active:scale-[0.98] transition-all"
              >
                Get started free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#162518] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">FinanceFlow</span>
          </div>
          <p className="text-gray-400 text-xs">© 2026 FinanceFlow. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <Link href="/login" className="hover:text-gray-700 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-gray-700 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
