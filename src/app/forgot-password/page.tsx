'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
    } catch {
      // Backend returns a generic response; keep the message neutral either way.
      setMessage('If an account exists for that email, a reset link is on its way.');
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all';

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-lime-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#1B3A2D]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-xl bg-[#1B3A2D] text-white font-semibold text-sm hover:bg-[#243f2f] transition-all"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot your password?</h1>
            <p className="text-gray-500 text-sm mb-8">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#1B3A2D] text-white font-semibold text-sm hover:bg-[#243f2f] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Remembered it?{' '}
              <Link href="/login" className="font-semibold text-[#1B3A2D] hover:text-lime-700 transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
