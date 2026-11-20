import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';

export const Footer: React.FC = () => {
  const { go } = useAppStore();

  return (
    <footer className="border-t border-[var(--s2)] bg-[var(--s0)] px-4 sm:px-6 md:px-9 py-6 md:py-8 flex flex-col gap-5 mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
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

        {/* Policy & Navigation Links for Customers and Google Merchant Center */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-[var(--t3)]">
          <Link
            to="/showrooms"
            className="yc hover:text-[var(--gold)] transition-colors"
          >
            Showrooms
          </Link>
          <Link
            to="/return-policy"
            className="yc hover:text-[var(--gold)] transition-colors"
          >
            Return & Refund Policy
          </Link>
          <Link
            to="/shipping-policy"
            className="yc hover:text-[var(--gold)] transition-colors"
          >
            Shipping Policy
          </Link>
          <Link
            to="/contact"
            className="yc hover:text-[var(--gold)] transition-colors"
          >
            Contact Us
          </Link>
          <Link
            to="/terms"
            className="yc hover:text-[var(--gold)] transition-colors"
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className="yc hover:text-[var(--gold)] transition-colors"
          >
            Privacy
          </Link>
        </div>
      </div>

      {/* Verified Business Information Bar for Merchant Review */}
      <div className="border-t border-[var(--s2)]/50 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[var(--t4)] gap-2 text-center sm:text-left">
        <span>© {new Date().getFullYear()} Yorder Webservices. All rights reserved.</span>
        <span>Yorder Webservices • Linking Road, Bandra West, Mumbai, Maharashtra 400052 • +91 99877 31604 • yorderweb@ywsglobal.com</span>
      </div>
    </footer>
  );
};
