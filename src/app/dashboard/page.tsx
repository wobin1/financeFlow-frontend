'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">FinanceFlow</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome back!</span>
              <Button variant="outline" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_income)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(Math.abs(summary.total_expenses))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Amount</p>
                    <p className={`text-2xl font-bold ${summary.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.net_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.pending_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="flex space-x-2">
                {(bankConnected || user?.plaid_access_token) && (
                  <Button variant="outline" size="sm" onClick={handleSyncTransactions} disabled={isSyncing}>
                    {isSyncing ? 'Syncing...' : '↻ Sync'}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sync result banner */}
            {syncResult && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                ✅ Sync complete — <strong>{syncResult.processed}</strong> new transactions imported, <strong>{syncResult.skipped}</strong> already existed.
              </div>
            )}

            {isSyncing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Syncing transactions from your bank...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                {!bankConnected && !user?.plaid_access_token ? (
                  <div>
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-gray-600 mb-4">Connect your Nigerian bank account to get started</p>
                    <Button onClick={() => setShowMonoConnect(true)}>
                      Connect Bank Account
                    </Button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-600">No transactions found</p>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Pull the latest transactions from your bank</p>
                    <Button onClick={handleSyncTransactions} disabled={isSyncing}>
                      Sync Transactions
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <svg className={`w-5 h-5 ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={transaction.amount > 0 ? "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" : "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"} />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.merchant_name}</p>
                        <p className="text-sm text-gray-600">{transaction.category || 'Uncategorized'}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.transaction_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Mono Connect Modal */}
      {showMonoConnect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Connect Your Bank Account</h2>
                <button
                  onClick={() => setShowMonoConnect(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <MonoConnect
                onSuccess={handleMonoSuccess}
                onError={(error) => {
                  console.error('Mono Connect error:', error);
                  setShowMonoConnect(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
