'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full h-10 rounded-xl border border-[#d8ddd2] bg-[#fbfcf9] text-sm text-[#162518] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all ' +
  'hover:border-[#c5cebc] hover:bg-white ' +
  'focus:outline-none focus:border-[#162518] focus:bg-white focus:ring-2 focus:ring-[#162518]/10 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#fbfcf9]';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  compact?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, compact, children, id, ...props },
  ref,
) {
  const selectId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('space-y-1.5 min-w-0', compact && 'space-y-0')}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b8f72]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          className={cn(
            fieldBase,
            'appearance-none cursor-pointer',
            compact ? 'h-9 pl-2.5 pr-8 text-[13px]' : 'pl-3 pr-10',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <span
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center text-[#6b8f72]',
            compact ? 'w-8' : 'w-10',
          )}
          aria-hidden
        >
          <svg
            className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.25}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {hint && <p className="text-xs text-[#6b8f72]">{hint}</p>}
    </div>
  );
});

Select.displayName = 'Select';
