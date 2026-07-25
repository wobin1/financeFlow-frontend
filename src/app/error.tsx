'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8f5] px-4">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-[#162518]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[#6b8f72]">
          {error.message || 'An unexpected error occurred while rendering this page.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#162518] text-white text-sm font-semibold hover:bg-[#243f2f]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
