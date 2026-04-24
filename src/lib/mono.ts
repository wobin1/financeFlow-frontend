import api from './api';

// The Mono Connect CDN script exposes window.Connect (not window.MonoConnect)
declare global {
  interface Window {
    Connect: new (config: {
      key: string;
      onSuccess: (data: { code: string; [key: string]: any }) => void;
      onClose?: () => void;
      onLoad?: () => void;
      onEvent?: (event: string, data: any) => void;
    }) => {
      setup: () => void;
      open: () => void;
      close: () => void;
    };
  }
}

export class MonoService {
  private static instance: MonoService;

  static getInstance(): MonoService {
    if (!MonoService.instance) {
      MonoService.instance = new MonoService();
    }
    return MonoService.instance;
  }

  async loadMonoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Connect) {
        resolve();
        return;
      }

      const existing = document.getElementById('mono-connect-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.id = 'mono-connect-script';
      script.src = 'https://connect.withmono.com/connect.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Mono Connect script'));
      document.head.appendChild(script);
    });
  }

  async initializeConnect(config: {
    onSuccess: (data: { code: string }) => void;
    onClose?: () => void;
    onEvent?: (event: string, data: any) => void;
  }): Promise<void> {
    await this.loadMonoScript();

    const publicKey = process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY || '';

    if (!window.Connect) {
      throw new Error('Mono Connect script failed to load');
    }

    const connect = new window.Connect({
      key: publicKey,
      onSuccess: config.onSuccess,
      onClose: config.onClose,
      onEvent: config.onEvent,
    });

    connect.setup();
    connect.open();
  }
}

// API service methods for Mono integration
export const monoApiService = {
  async exchangeToken(code: string) {
    const response = await api.post('/mono/auth', { code });
    return response.data;
  },

  async getAccountInfo(accountId: string) {
    const response = await api.get(`/mono/account/${accountId}/info`);
    return response.data;
  },

  async getTransactions(accountId: string, limit: number = 50) {
    const response = await api.get(`/mono/account/${accountId}/transactions`, {
      params: { limit }
    });
    return response.data;
  },

  async syncTransactions() {
    const response = await api.post('/mono/account/sync');
    return response.data;
  }
};
