'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';

type Status = 'verifying' | 'success' | 'error';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }

    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Your email has been verified.');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(
          err.response?.data?.detail ||
            'This verification link is invalid or has expired.',
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center">
        {status === 'verifying' && (
          <>
            <span className="w-10 h-10 border-2 border-gray-200 border-t-[#1B3A2D] rounded-full animate-spin inline-block mb-5" />
            <h1 className="text-xl font-bold text-gray-900">Verifying your email…</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-lime-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#1B3A2D]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-xl bg-[#1B3A2D] text-white font-semibold text-sm hover:bg-[#243f2f] transition-all"
            >
              Sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-xl bg-[#1B3A2D] text-white font-semibold text-sm hover:bg-[#243f2f] transition-all"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
