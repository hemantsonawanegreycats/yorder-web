import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

export const Footer: React.FC = () => {
  const { go, showToast } = useAppStore();

  return (
    <footer className="border-t border-[var(--s2)] bg-[var(--s0)] px-6 md:px-9 py-7 md:py-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 mt-auto">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <button onClick={() => go('home')} className="yc focus:outline-none">
          <img
            src="/assets/logo-dark.png"
            alt="Yorder"
            className="ylogo-d h-[20px] w-auto object-contain"
          />
          <img
            src="/assets/logo-light.png"
            alt="Yorder"
            className="ylogo-l h-[20px] w-auto object-contain"
          />
        </button>
        <span className="text-[11px] leading-[1.6] text-[var(--t3)] max-w-[320px]">
          Every item on Yorder sits on a real shelf in a real store near you.
        </span>
      </div>

      <div className="flex items-center gap-6 md:gap-8 text-[11px] text-[var(--t3)]">
        <button
          onClick={() => go('showrooms')}
          className="yc hover:text-[var(--gold)] transition-colors"
        >
          Showrooms
        </button>
        <button
          onClick={() => showToast('Vendor Partner Portal: Connect with onboarding team')}
          className="yc hover:text-[var(--gold)] transition-colors"
        >
          Sell on Yorder
        </button>
        <button
          onClick={() => showToast('Doorstep trial: 100% free return while rider waits 10 minutes')}
          className="yc hover:text-[var(--gold)] transition-colors"
        >
          Returns
        </button>
      </div>
    </footer>
  );
};
