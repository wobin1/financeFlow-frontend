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
  source?: 'bank' | 'manual';
  vat_deductible?: boolean | null;
  wht_applicable?: boolean | null;
  wht_rate?: number | null;
  created_at: string;
}

export interface TransactionCreate {
  merchant_name: string;
  amount: number;
  description?: string;
  transaction_date: string;
  currency?: string;
  source?: 'bank' | 'manual';
  category: string;
  vat_deductible?: boolean | null;
  wht_applicable?: boolean | null;
  wht_rate?: number | null;
}

export interface TransactionSummary {
  total_expenses: number;
  total_income: number;
  net_amount: number;
  pending_count: number;
  total_transactions: number;
  categories: Record<string, number>;
}

/** Nigerian business categories used for manual categorization / FIRS prep */
export const BUSINESS_CATEGORIES: { value: string; label: string; group: string }[] = [
  { value: 'sales_revenue', label: 'Sales Revenue', group: 'Income' },
  { value: 'service_revenue', label: 'Service Revenue', group: 'Income' },
  { value: 'rental_income', label: 'Rental Income', group: 'Income' },
  { value: 'interest_income', label: 'Interest Income', group: 'Income' },
  { value: 'dividend_income', label: 'Dividend Income', group: 'Income' },
  { value: 'other_income', label: 'Other Income', group: 'Income' },
  { value: 'cost_of_goods_sold', label: 'Cost of Goods Sold', group: 'Cost of Sales' },
  { value: 'raw_materials', label: 'Raw Materials', group: 'Cost of Sales' },
  { value: 'direct_labor', label: 'Direct Labor', group: 'Cost of Sales' },
  { value: 'manufacturing_overhead', label: 'Manufacturing Overhead', group: 'Cost of Sales' },
  { value: 'salaries_wages', label: 'Salaries and Wages', group: 'Expenses' },
  { value: 'rent_expense', label: 'Rent Expense', group: 'Expenses' },
  { value: 'utilities', label: 'Utilities', group: 'Expenses' },
  { value: 'office_supplies', label: 'Office Supplies', group: 'Expenses' },
  { value: 'marketing_advertising', label: 'Marketing and Advertising', group: 'Expenses' },
  { value: 'professional_fees', label: 'Professional Fees', group: 'Expenses' },
  { value: 'insurance', label: 'Insurance', group: 'Expenses' },
  { value: 'bank_charges', label: 'Bank Charges', group: 'Expenses' },
  { value: 'transport_logistics', label: 'Transport and Logistics', group: 'Expenses' },
  { value: 'communication', label: 'Communication', group: 'Expenses' },
  { value: 'repairs_maintenance', label: 'Repairs and Maintenance', group: 'Expenses' },
  { value: 'training_development', label: 'Training and Development', group: 'Expenses' },
  { value: 'entertainment', label: 'Entertainment', group: 'Expenses' },
  { value: 'travel_expenses', label: 'Travel Expenses', group: 'Expenses' },
  { value: 'vat_payable', label: 'VAT Payable', group: 'Tax' },
  { value: 'withholding_tax', label: 'Withholding Tax', group: 'Tax' },
  { value: 'company_income_tax', label: 'Company Income Tax', group: 'Tax' },
  { value: 'personal_income_tax', label: 'Personal Income Tax', group: 'Tax' },
  { value: 'cash_bank', label: 'Cash and Bank', group: 'Assets' },
  { value: 'accounts_receivable', label: 'Accounts Receivable', group: 'Assets' },
  { value: 'inventory', label: 'Inventory', group: 'Assets' },
  { value: 'fixed_assets', label: 'Fixed Assets', group: 'Assets' },
  { value: 'investments', label: 'Investments', group: 'Assets' },
  { value: 'accounts_payable', label: 'Accounts Payable', group: 'Liabilities' },
  { value: 'loans_payable', label: 'Loans Payable', group: 'Liabilities' },
  { value: 'accrued_expenses', label: 'Accrued Expenses', group: 'Liabilities' },
  { value: 'personal', label: 'Personal (Non-business)', group: 'Other' },
];

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return 'Uncategorized';
  const match = BUSINESS_CATEGORIES.find((c) => c.value === value || c.label === value);
  return match?.label ?? value;
}

/** Categories that usually include reclaimable input VAT */
export const DEFAULT_VAT_DEDUCTIBLE_CATEGORIES = new Set([
  'cost_of_goods_sold',
  'raw_materials',
  'office_supplies',
  'marketing_advertising',
  'professional_fees',
  'utilities',
  'repairs_maintenance',
  'transport_logistics',
  'communication',
]);

export const WHT_RATE_OPTIONS = [
  { value: 2.5, label: '2.5%' },
  { value: 5, label: '5%' },
  { value: 10, label: '10%' },
];

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
    const response = await api.post('/transactions/', data);
    return response.data;
  },

  async updateTransaction(
    id: string,
    data: {
      status?: string;
      category?: string;
      vat_deductible?: boolean | null;
      wht_applicable?: boolean | null;
      wht_rate?: number | null;
    }
  ): Promise<Transaction> {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  async getSummary(): Promise<TransactionSummary> {
    const response = await api.get('/transactions/summary/dashboard');
    return response.data;
  }
};
