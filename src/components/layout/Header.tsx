import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useCartStore } from '../../stores/useCartStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useOrdersQuery } from '../../api/orders.api';
import { AppRoute } from '../../types';
import { Menu, X, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, setTheme, route, go, deliverTo, q, setQ, setAddressModalOpen } = useAppStore();
  const bag = useCartStore((s) => s.bag);
  const { isAuthenticated, user, setAuthModalOpen } = useAuthStore();
  const { data: orders } = useOrdersQuery();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeOrder = isAuthenticated
    ? orders?.find((o: any) => {
        const s = (o.current_order_status?.name || o.status || '').toLowerCase();
        return !o.orderCompleted && s !== 'delivered' && s !== 'cancelled';
      })
    : null;

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
    <header className="sticky top-0 z-50 flex flex-col bg-[var(--bg)] border-b border-[var(--s2)] transition-colors duration-200 w-full">
      {/* Main Header Row */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 md:gap-6 h-[56px] sm:h-[70px] px-2.5 sm:px-4 md:px-[34px] w-full">
        {/* Left: Brand Logo & Delivery Location */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0 flex-shrink">
          <button
            onClick={() => go('home')}
            className="yc flex items-center gap-2 focus:outline-none flex-shrink-0"
            title="Yorder Home"
          >
            <img
              src="/assets/logo-dark.png"
              alt="Yorder"
              className="ylogo-d h-[19px] sm:h-[26px] w-auto object-contain"
            />
            <img
              src="/assets/logo-light.png"
              alt="Yorder"
              className="ylogo-l h-[19px] sm:h-[26px] w-auto object-contain"
            />
          </button>

          <div className="w-[1px] h-[20px] sm:h-[26px] bg-[var(--bd)] flex-shrink-0" />

          {/* Deliver To */}
          <div className="relative min-w-0">
            <button
              onClick={() => setAddressModalOpen(true)}
              className="yc flex flex-col items-start gap-[2px] sm:gap-[3px] text-left group min-w-0 max-w-[92px] sm:max-w-[160px] md:max-w-[200px]"
              title="Select or Add Delivery Address with Map"
            >
              <span className="font-medium text-[7px] sm:text-[8.5px] leading-none tracking-[0.14em] sm:tracking-[0.18em] text-[var(--gold)] flex items-center gap-1 whitespace-nowrap">
                DELIVER TO
              </span>
              <span className="font-semibold text-[11px] sm:text-[13px] leading-none tracking-[-0.01em] text-[var(--t1)] group-hover:text-[var(--gold)] transition-colors flex items-center gap-1 max-w-full">
                <span className="truncate">{deliverTo}</span>
                <span className="text-[9px] sm:text-[10px] text-[var(--t3)] group-hover:text-[var(--gold)] flex-shrink-0">▾</span>
              </span>
            </button>
          </div>
        </div>

        {/* Middle: Live Search Bar (Tablet & Desktop) */}
        <div className="flex-1 max-w-[420px] mx-2 hidden md:flex items-center gap-[11px] h-[40px] px-4 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors">
          <span className="text-[14px] text-[var(--t4)] select-none">⌕</span>
          <input
            className="yin w-full bg-transparent border-0 outline-none text-[12.5px] text-[var(--t1)] placeholder-[var(--t4)]"
            maxLength={80}
            aria-label="Search products and showrooms"
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
              aria-label="Clear search"
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

        {/* Right Controls: Theme Switch, Active Order, Bag, Profile */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Compact Theme Toggle (Mobile <sm) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="yc sm:hidden h-[28px] w-[28px] rounded-full bg-[var(--s1)] border border-[var(--bd)] flex items-center justify-center text-[var(--t2)] hover:border-[var(--gold)] transition-colors flex-shrink-0"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={13} className="text-[var(--gold)]" /> : <Moon size={13} className="text-[var(--t2)]" />}
          </button>

          {/* Theme Pill Toggle (Tablet & Desktop sm+) */}
          <div className="hidden sm:flex items-center gap-[3px] p-[3px] rounded-[18px] bg-[var(--s1)] border border-[var(--bd)]">
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

          {/* Active Order Live Tracker Pill (Always visible on mobile & desktop when active) */}
          {activeOrder && (
            <button
              onClick={() => go('order', { orderId: activeOrder.id })}
              className="yc flex items-center gap-1 sm:gap-1.5 h-[28px] sm:h-[34px] px-2 sm:px-3 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/35 text-[var(--gold)] text-[9.5px] sm:text-[11px] font-semibold hover:bg-[var(--gold)]/20 transition-all shadow-xs flex-shrink-0"
              title={`Track active order #${activeOrder.id}`}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--gold)] animate-pulse" />
              <span className="sm:hidden">#{activeOrder.id}</span>
              <span className="hidden sm:inline">Track #{activeOrder.id}</span>
            </button>
          )}

          {/* Bag Pill Button */}
          <button
            onClick={() => go('bag')}
            className="yc relative flex items-center gap-1.5 sm:gap-[9px] h-[28px] sm:h-[34px] px-2.5 sm:px-[15px] rounded-[17px] bg-[var(--s1)] border border-[var(--bd)] text-[10.5px] sm:text-[11.5px] font-medium text-[var(--t2)] hover:border-[var(--gold)] transition-colors flex-shrink-0"
          >
            <span>Bag</span>
            <span className="font-mono text-[10px] sm:text-[11px] font-medium text-[var(--gold)]">
              {bag.reduce((sum, item) => sum + (item.quantity || 1), 0)}
            </span>
          </button>

          {/* Avatar / Account Pill */}
          {isAuthenticated && user ? (
            <button
              onClick={() => go('profile')}
              title={`Account: ${user.phone || user.first_name || 'Member'}`}
              className="h-[28px] sm:h-[34px] px-1.5 sm:px-3 rounded-[17px] bg-[var(--s1)] border border-[var(--bd)] flex items-center gap-2 font-medium text-[11px] sm:text-[11.5px] text-[var(--t1)] hover:border-[var(--gold)] cursor-pointer select-none flex-shrink-0 transition-colors"
            >
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--gold)] text-black flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
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
              className="h-[28px] sm:h-[34px] px-2.5 sm:px-3.5 rounded-[17px] bg-[var(--acc)] text-[var(--on-acc)] flex items-center gap-1.5 font-semibold text-[10px] sm:text-[11.5px] hover:opacity-90 active:scale-95 cursor-pointer select-none flex-shrink-0 transition-all shadow-sm whitespace-nowrap"
            >
              <span>Log in</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="yc lg:hidden p-1.5 sm:p-2 rounded-lg text-[var(--t1)] hover:bg-[var(--s1)] flex-shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Persistent Mobile Search Bar Row (<md) */}
      <div className="flex md:hidden px-2.5 sm:px-4 pb-2.5 pt-0.5 w-full">
        <div className="w-full flex items-center gap-2 h-[36px] px-3 rounded-[10px] bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors">
          <span className="text-[13px] text-[var(--t4)] select-none">⌕</span>
          <input
            className="yin w-full bg-transparent border-0 outline-none text-[12px] text-[var(--t1)] placeholder-[var(--t4)]"
            maxLength={80}
            aria-label="Search products and showrooms"
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
              className="text-sm text-[var(--t3)] hover:text-[var(--t1)] px-1"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[var(--bg)] border-b border-[var(--s2)] p-3.5 sm:p-4 flex flex-col gap-3.5 lg:hidden shadow-2xl z-50 max-h-[calc(100dvh-100px)] overflow-y-auto">
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] bg-[var(--s1)] border border-[var(--bd)]">
            <span className="text-[11px] font-medium text-[var(--t3)] uppercase tracking-wider">Appearance</span>
            <div className="flex items-center gap-1 p-[2px] rounded-[14px] bg-[var(--bg)] border border-[var(--bd)]">
              <button
                onClick={() => setTheme('dark')}
                className="yc px-2.5 py-1 rounded-[12px] text-[10px] leading-none transition-all"
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
                className="yc px-2.5 py-1 rounded-[12px] text-[10px] leading-none transition-all"
                style={{
                  background: theme === 'light' ? 'var(--acc)' : 'transparent',
                  color: theme === 'light' ? 'var(--on-acc)' : 'var(--t3)',
                  fontWeight: theme === 'light' ? 600 : 500,
                }}
              >
                Light
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {activeOrder && (
              <button
                onClick={() => {
                  go('order', { orderId: activeOrder.id });
                  setMobileMenuOpen(false);
                }}
                className="yc flex items-center justify-between p-3 rounded-lg text-sm font-semibold text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/25"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
                  <span>Track Active Delivery #{activeOrder.id}</span>
                </div>
                <span className="text-xs">›</span>
              </button>
            )}
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
                if (isAuthenticated) {
                  go('profile');
                } else {
                  setAuthModalOpen(true);
                }
                setMobileMenuOpen(false);
              }}
              className="yc flex items-center justify-between p-3 rounded-lg text-sm font-medium text-[var(--gold)] hover:bg-[var(--s1)] border-t border-[var(--bd)] mt-1"
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
