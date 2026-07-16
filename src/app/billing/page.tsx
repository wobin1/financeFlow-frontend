'use client';

import { Suspense } from 'react';
import BillingPageContent from './BillingPageContent';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading billing…</p>
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
