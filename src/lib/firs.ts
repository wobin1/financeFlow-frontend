import api from './api';

export interface FirsField {
  key: string;
  label: string;
  value: number | string;
  portal_hint?: string;
}

export interface FirsWorksheet {
  title: string;
  rate?: string;
  fields: FirsField[];
  summary: Record<string, number | string>;
  notes: string[];
  line_items?: Record<string, unknown>[];
  supporting_transactions?: Record<string, unknown>[];
  revenue_breakdown?: Record<string, number>;
  expense_breakdown?: Record<string, number>;
}

export interface FirsChecklistItem {
  id: string;
  label: string;
  done: boolean;
  action: string;
}

export interface FirsFilingPrep {
  period: {
    year: number;
    month: number;
    label: string;
    start_date: string;
    end_date: string;
  };
  taxpayer: {
    business_name?: string;
    tin_number?: string;
    cac_number?: string;
    business_type?: string;
    currency: string;
  };
  readiness: {
    ready_for_review: boolean;
    checklist: FirsChecklistItem[];
    transaction_count: number;
  };
  vat: FirsWorksheet;
  wht: FirsWorksheet;
  cit: FirsWorksheet;
  disclaimer: string;
  generated_at: string;
}

export const firsService = {
  async getFilingPrep(year?: number, month?: number): Promise<FirsFilingPrep> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const response = await api.get('/firs/prep', { params });
    return response.data;
  },

  async downloadCsv(year?: number, month?: number): Promise<void> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const response = await api.get('/firs/export', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `firs-prep-${year || 'current'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export async function updateTaxProfile(data: {
  business_name?: string;
  tin_number?: string;
  cac_number?: string;
}) {
  const response = await api.put('/users/profile', data);
  return response.data;
}
