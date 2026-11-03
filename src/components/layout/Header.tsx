import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useCartStore } from '../../stores/useCartStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { AppRoute } from '../../types';
import { Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, setTheme, route, go, deliverTo, q, setQ, setAddressModalOpen } = useAppStore();
  const bag = useCartStore((s) => s.bag);
  const { isAuthenticated, user, setAuthModalOpen } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (targetRoute: AppRoute) => {
    if (targetRoute === 'chat' && !isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    go(targetRoute);
  };

  const navItems: { label: string; route: AppRoute }[] = [
    { label: 'Products', route: 'products' },
    { label: 'Showrooms', route: 'showrooms' },
    { label: 'Chats', route: 'chat' },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 md:gap-6 h-[70px] px-4 md:px-[34px] bg-[var(--bg)] border-b border-[var(--s2)] transition-colors duration-200">
      {/* Left: Brand Logo & Delivery Location */}
      <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
        <button
          onClick={() => go('home')}
          className="yc flex items-center gap-2 focus:outline-none"
          title="Yorder Home"
        >
          <img
            src="/assets/logo-dark.png"
            alt="Yorder"
            className="ylogo-d h-[26px] w-auto object-contain"
          />
          <img
            src="/assets/logo-light.png"
            alt="Yorder"
            className="ylogo-l h-[26px] w-auto object-contain"
          />
        </button>

        <div className="hidden sm:block w-[1px] h-[26px] bg-[var(--bd)]" />

        {/* Deliver To */}
        <div className="relative">
          <button
            onClick={() => setAddressModalOpen(true)}
            className="yc flex flex-col items-start gap-[3px] text-left group"
            title="Select or Add Delivery Address with Map"
          >
            <span className="font-medium text-[8.5px] leading-none tracking-[0.18em] text-[var(--gold)] flex items-center gap-1">
              DELIVER TO
            </span>
            <span className="font-semibold text-[13px] leading-none tracking-[-0.01em] text-[var(--t1)] group-hover:text-[var(--gold)] transition-colors flex items-center gap-1">
              {deliverTo}
              <span className="text-[10px] text-[var(--t3)] group-hover:text-[var(--gold)]">▾</span>
            </span>
          </button>
        </div>
      </div>

      {/* Middle: Live Search Bar */}
      <div className="flex-1 max-w-[420px] mx-2 hidden sm:flex items-center gap-[11px] h-[40px] px-4 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors">
        <span className="text-[14px] text-[var(--t4)] select-none">⌕</span>
        <input
          className="yin w-full bg-transparent border-0 outline-none text-[12.5px] text-[var(--t1)] placeholder-[var(--t4)]"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (route !== 'products') {
              go('products');
            }
          }}
          placeholder="Search products & showrooms"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="text-xs text-[var(--t3)] hover:text-[var(--t1)]"
          >
            ×
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="hidden lg:flex items-center gap-5">
        {navItems.map((n) => {
          const isActive = route === n.route;
          return (
            <button
              key={n.route}
              onClick={() => handleNavClick(n.route)}
              className="yc text-[12px] font-medium leading-none transition-colors"
              style={{
                color: isActive ? 'var(--t1)' : 'var(--t3)',
              }}
            >
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Theme Switch, Bag, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme Pill Toggle */}
        <div className="flex items-center gap-[3px] p-[3px] rounded-[18px] bg-[var(--s1)] border border-[var(--bd)]">
          <button
            onClick={() => setTheme('dark')}
            className="yc px-3 py-[5px] rounded-[15px] text-[10px] leading-none transition-all"
            style={{
              background: theme === 'dark' ? 'var(--acc)' : 'transparent',
              color: theme === 'dark' ? 'var(--on-acc)' : 'var(--t3)',
              fontWeight: theme === 'dark' ? 600 : 500,
            }}
          >
            Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            className="yc px-3 py-[5px] rounded-[15px] text-[10px] leading-none transition-all"
            style={{
              background: theme === 'light' ? 'var(--acc)' : 'transparent',
              color: theme === 'light' ? 'var(--on-acc)' : 'var(--t3)',
              fontWeight: theme === 'light' ? 600 : 500,
            }}
          >
            Light
          </button>
        </div>

        {/* Bag Pill Button */}
        <button
          onClick={() => go('bag')}
          className="yc relative flex items-center gap-[9px] h-[34px] px-[15px] rounded-[17px] bg-[var(--s1)] border border-[var(--bd)] text-[11.5px] font-medium text-[var(--t2)] hover:border-[var(--gold)] transition-colors"
        >
          <span>Bag</span>
          <span className="font-mono text-[11px] font-medium text-[var(--gold)]">
            {bag.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          </span>
        </button>

        {/* Avatar / Account Pill */}
        {isAuthenticated && user ? (
          <button
            onClick={() => go('profile')}
            title={`Account: ${user.phone || user.first_name || 'Member'}`}
            className="h-[34px] px-3 rounded-[17px] bg-[var(--s1)] border border-[var(--bd)] flex items-center gap-2 font-medium text-[11.5px] text-[var(--t1)] hover:border-[var(--gold)] cursor-pointer select-none flex-shrink-0 transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-[var(--gold)] text-black flex items-center justify-center text-[10px] font-bold">
              {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
            </span>
            <span className="hidden sm:inline text-xs text-[var(--t1)]">
              {user.first_name || (user.phone ? `+91 ${user.phone.slice(-4)}` : 'Profile')}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            title="Sign in with mobile number"
            className="h-[34px] px-3.5 rounded-[17px] bg-[var(--acc)] text-[var(--on-acc)] flex items-center gap-1.5 font-semibold text-[11.5px] hover:opacity-90 active:scale-95 cursor-pointer select-none flex-shrink-0 transition-all shadow-sm"
          >
            <span>Log in</span>
          </button>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="yc lg:hidden p-2 rounded-lg text-[var(--t1)] hover:bg-[var(--s1)]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-[70px] left-0 right-0 bg-[var(--bg)] border-b border-[var(--s2)] p-4 flex flex-col gap-4 lg:hidden shadow-2xl z-50">
          <div className="flex items-center gap-2 h-[40px] px-3 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)]">
            <span className="text-[14px] text-[var(--t4)]">⌕</span>
            <input
              className="yin w-full bg-transparent border-0 outline-none text-[12.5px] text-[var(--t1)]"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                go('products');
                setMobileMenuOpen(false);
              }}
              placeholder="Search products & showrooms"
            />
          </div>

          <div className="flex flex-col gap-2">
            {navItems.map((n) => (
              <button
                key={n.route}
                onClick={() => {
                  handleNavClick(n.route);
                  setMobileMenuOpen(false);
                }}
                className="yc flex items-center justify-between p-3 rounded-lg text-sm font-medium text-[var(--t1)] hover:bg-[var(--s1)]"
              >
                <span>{n.label}</span>
                <span className="text-[var(--t3)] text-xs">›</span>
              </button>
            ))}
            <button
              onClick={() => {
                setAuthModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="yc flex items-center justify-between p-3 rounded-lg text-sm font-medium text-[var(--gold)] hover:bg-[var(--s1)] border-t border-[var(--bd)] mt-2"
            >
              <span>{isAuthenticated ? 'My Profile & Orders' : 'Sign In / Account'}</span>
              <span className="text-xs">›</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
