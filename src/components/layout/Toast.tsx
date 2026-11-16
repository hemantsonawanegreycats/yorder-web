import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const Toast: React.FC = () => {
  const { toast, go } = useAppStore();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 bottom-4 sm:bottom-[34px] -translate-x-1/2 w-max max-w-[calc(100vw-24px)] sm:max-w-[480px] z-[90] flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-[14px] rounded-[18px] sm:rounded-[22px] bg-[var(--glass)] backdrop-blur-[12px] border border-[var(--bdw)] shadow-[0_18px_40px_rgba(0,0,0,0.35)] animate-toast pointer-events-auto"
    >
      <span className="w-[6px] h-[6px] rounded-full bg-[var(--gold)] flex-shrink-0" />
      <span className="text-[11.5px] sm:text-[12px] font-medium leading-snug text-[var(--t1)] line-clamp-2 flex-1 min-w-0">
        {toast}
      </span>
      <button
        onClick={() => go('bag')}
        className="yc text-[11px] font-semibold leading-none text-[var(--gold)] hover:underline whitespace-nowrap flex-shrink-0 ml-1"
      >
        View bag
      </button>
    </div>
  );
};
