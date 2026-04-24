'use client';

import { useState } from 'react';
import { MonoService, monoApiService } from '@/lib/mono';

interface MonoConnectProps {
  onSuccess?: (accountData: any) => void;
  onError?: (error: any) => void;
}

const BANKS = ['GTBank', 'First Bank', 'UBA', 'Zenith', 'Access', 'Fidelity'];

export default function MonoConnect({ onSuccess, onError }: MonoConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const monoService = MonoService.getInstance();

      await monoService.initializeConnect({
        onSuccess: async (response) => {
          try {
            const authResult = await monoApiService.exchangeToken(response.code);
            const accountInfo = await monoApiService.getAccountInfo(authResult.account_id);
            setIsConnecting(false);
            onSuccess?.(accountInfo);
          } catch (err: any) {
            console.error('Mono auth error:', err);
            setError('Failed to connect bank account. Please try again.');
            setIsConnecting(false);
            onError?.(err);
          }
        },
        onClose: () => {
          setIsConnecting(false);
        }
      });
    } catch (err: any) {
      console.error('Mono initialization error:', err);
      setError('Failed to initialize bank connection. Please try again.');
      setIsConnecting(false);
      onError?.(err);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Bank icon + description */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1B3A2D] flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-lime-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">Nigerian Bank Account</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Securely link your account to automatically import and categorize transactions. Bank-grade encryption via Mono.
          </p>
        </div>
      </div>

      {/* Supported banks chips */}
      <div>
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Supported banks</p>
        <div className="flex flex-wrap gap-1.5">
          {BANKS.map((bank) => (
            <span
              key={bank}
              className="px-2.5 py-1 rounded-lg bg-[#f0f2ee] text-[#1B3A2D] text-xs font-medium border border-gray-200"
            >
              {bank}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-lg bg-[#f0f2ee] text-gray-400 text-xs font-medium border border-gray-200">
            +20 more
          </span>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-lime-50 border border-lime-200">
        <svg className="w-4 h-4 text-lime-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <p className="text-xs text-lime-700 font-medium">256-bit encrypted · read-only access · no card details stored</p>
      </div>

      {/* CTA button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full py-3.5 rounded-xl bg-[#1B3A2D] text-white text-sm font-bold hover:bg-[#243f2f] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            Connecting…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            Connect Bank Account
          </span>
        )}
      </button>
    </div>
  );
}
