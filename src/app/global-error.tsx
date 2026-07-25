'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#f7f8f5] px-4 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-[#162518]">Application error</h2>
          <p className="mt-2 text-sm text-[#6b8f72]">
            {error.message || 'A critical error stopped the app from loading.'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#162518] text-white text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
