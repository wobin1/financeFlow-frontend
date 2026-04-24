'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MonoService, monoApiService } from '@/lib/mono';

interface MonoConnectProps {
  onSuccess?: (accountData: any) => void;
  onError?: (error: any) => void;
}

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
            setError('Failed to connect bank account');
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
      setError('Failed to initialize bank connection');
      setIsConnecting(false);
      onError?.(err);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Connect Your Nigerian Bank Account</h3>
            <p className="text-sm text-gray-600 mt-1">
              Securely connect your bank account to automatically import and categorize transactions. 
              We support all major Nigerian banks including GTBank, First Bank, UBA, Zenith, and more.
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full sm:w-auto"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              'Connect Bank Account'
            )}
          </Button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>🔒 Your banking information is encrypted and secure. We use Mono's bank-grade security.</p>
          <p>📱 Supported banks: GTBank, First Bank, UBA, Zenith, Access Bank, Fidelity, and 20+ others.</p>
        </div>
      </div>
    </div>
  );
}
