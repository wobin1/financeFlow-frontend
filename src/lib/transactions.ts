import api from './api';

export interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  transaction_date: string;
  raw_description: string;
  category: string | null;
  ai_confidence: number | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'flagged';
  created_at: string;
}

export interface TransactionCreate {
  merchant_name: string;
  amount: number;
  description: string;
  transaction_date: string;
}

export interface TransactionSummary {
  total_expenses: number;
  total_income: number;
  net_amount: number;
  pending_count: number;
  total_transactions: number;
  categories: Record<string, number>;
}

export const transactionService = {
  async getTransactions(params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<Transaction[]> {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  async updateTransaction(
    id: string,
    data: { status: string; category?: string }
  ): Promise<Transaction> {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  async getSummary(): Promise<TransactionSummary> {
    const response = await api.get('/transactions/summary/dashboard');
    return response.data;
  }
};
