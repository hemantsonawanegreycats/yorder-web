import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const Toast: React.FC = () => {
  const { toast, go } = useAppStore();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 bottom-[34px] -translate-x-1/2 z-[90] flex items-center gap-[14px] px-5 py-[14px] rounded-[22px] bg-[var(--glass)] backdrop-blur-[12px] border border-[var(--bdw)] shadow-[0_18px_40px_rgba(0,0,0,0.35)] animate-toast pointer-events-auto"
    >
      <span className="w-[6px] h-[6px] rounded-full bg-[var(--gold)] flex-shrink-0" />
      <span className="text-[12px] font-medium leading-none text-[var(--t1)] whitespace-nowrap">
        {toast}
      </span>
      <button
        onClick={() => go('bag')}
        className="yc text-[11px] font-semibold leading-none text-[var(--gold)] hover:underline whitespace-nowrap ml-2"
      >
        View bag
      </button>
    </div>
  );
};
