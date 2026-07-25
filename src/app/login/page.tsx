'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { authService } from '@/lib/auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);
    setResendState('idle');
    try {
      await authService.login({ username: email, password });
      const next = searchParams.get('next');
      const safeNext =
        next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      router.push(safeNext);
    } catch (err: any) {
      const detail: string = err.response?.data?.detail || 'Invalid email or password';
      setError(detail);
      if (err.response?.status === 403 && /verify your email/i.test(detail)) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      await authService.resendVerification(email);
    } catch {
      /* generic response — ignore */
    } finally {
      setResendState('sent');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[45%] bg-[#162518] flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#162518]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <span className="text-white font-bold text-xl">FinanceFlow</span>
        </div>

        {/* Center content */}
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart finance<br />for Nigerian<br />businesses
          </h2>
          <p className="text-[#6b9e7a] text-base leading-relaxed">
            Connect your bank, track transactions, and grow your business with AI-powered insights.
          </p>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-[#1B3A2D] rounded-2xl p-4">
              <p className="text-lime-400 text-2xl font-bold">99.9%</p>
              <p className="text-[#6b9e7a] text-xs mt-1">Uptime reliability</p>
            </div>
            <div className="bg-[#1B3A2D] rounded-2xl p-4">
              <p className="text-lime-400 text-2xl font-bold">50K+</p>
              <p className="text-[#6b9e7a] text-xs mt-1">Businesses served</p>
            </div>
          </div>
        </div>

        <p className="text-[#3d6b4a] text-xs">© 2026 FinanceFlow. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-[#f7f8f5] px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#162518] flex items-center justify-center">
              <span className="text-lime-400 text-xs font-bold">FF</span>
            </div>
            <span className="font-bold text-gray-900">FinanceFlow</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                {error}
                {needsVerification && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState !== 'idle'}
                    className="mt-2 block font-semibold text-red-800 underline disabled:no-underline disabled:opacity-70"
                  >
                    {resendState === 'idle' && 'Resend verification email'}
                    {resendState === 'sending' && 'Sending…'}
                    {resendState === 'sent' && 'Verification email sent — check your inbox'}
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm font-semibold text-[#1B3A2D] hover:text-lime-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1B3A2D] text-white font-semibold text-sm hover:bg-[#243f2f] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#1B3A2D] hover:text-lime-700 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
