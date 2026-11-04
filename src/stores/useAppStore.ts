import { create } from 'zustand';
import { AppRoute, ThemeMode } from '../types';

interface AppState {
  theme: ThemeMode;
  route: AppRoute;
  back: AppRoute;
  deliverTo: string;
  q: string;
  cat: string;
  brand: string | null;
  sort: number;
  pid: string | number;
  sid: string | number;
  shelfTab: number;
  idx: number;
  toast: string | null;
  stage: number;
  keep: Record<number, boolean>;
  following: Record<string, boolean>;
  addressModalOpen: boolean;
  navigate: ((path: string) => void) | null;

  // Actions
  setNavigate: (nav: (path: string) => void) => void;
  setAddressModalOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setRoute: (route: AppRoute, extra?: Partial<AppState>) => void;
  go: (route: AppRoute, extra?: Partial<AppState>) => void;
  setDeliverTo: (location: string) => void;
  setQ: (query: string) => void;
  setCat: (cat: string) => void;
  setBrand: (brand: string | null) => void;
  setSort: (sort: number) => void;
  cycleSort: () => void;
  clearFilters: () => void;
  setPid: (pid: string | number) => void;
  setSid: (sid: string | number) => void;
  setShelfTab: (tab: number) => void;
  setIdx: (idx: number) => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
  toggleFollow: (sid: string | number) => void;
  setStage: (stage: number) => void;
  toggleKeep: (index: number) => void;
  resetOrder: () => void;
}

export const routeToPath = (route: AppRoute, extra?: Record<string, any>): string => {
  switch (route) {
    case 'home':
      return '/';
    case 'products':
      return '/products';
    case 'showrooms':
      return '/showrooms';
    case 'store':
      return extra?.sid ? `/store/${extra.sid}` : '/showrooms';
    case 'product':
      return extra?.pid ? `/product/${extra.pid}` : '/products';
    case 'chat':
      return extra?.chatId ? `/chat/${extra.chatId}` : '/chat';
    case 'bag':
      return '/bag';
    case 'order':
      return '/order';
    case 'profile':
      return '/profile';
    default:
      return '/';
  }
};

let toastTimer: any = null;

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  route: 'home',
  back: 'home',
  deliverTo: 'Bandra West',
  q: '',
  cat: 'All',
  brand: null,
  sort: 0,
  pid: '',
  sid: '',
  shelfTab: 0,
  idx: 0,
  toast: null,
  stage: 0,
  keep: {},
  following: {},
  addressModalOpen: false,
  navigate: null,

  setNavigate: (navigate) => set({ navigate }),
  setAddressModalOpen: (open) => set({ addressModalOpen: open }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  setRoute: (route, extra) => {
    const prev = get().route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    set({ route, back: prev, ...extra });
  },

  go: (route, extra) => {
    const prev = get().route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    set({ route, back: prev, ...extra });

    const path = routeToPath(route, { ...get(), ...extra });
    const nav = get().navigate;
    if (nav) {
      nav(path);
    } else if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.location.href = path;
    }
  },

  setDeliverTo: (deliverTo) => set({ deliverTo }),
  setQ: (q) => set({ q, route: 'products' }),
  setCat: (cat) => set({ cat }),
  setBrand: (brand) => set((s) => ({ brand: s.brand === brand ? null : brand })),
  setSort: (sort) => set({ sort }),
  cycleSort: () => set((s) => ({ sort: (s.sort + 1) % 3 })),

  clearFilters: () => set({ cat: 'All', brand: null, q: '', sort: 0 }),
  setPid: (pid) => set({ pid }),
  setSid: (sid) => set({ sid }),
  setShelfTab: (shelfTab) => set({ shelfTab }),
  setIdx: (idx) => set({ idx }),

  showToast: (msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => {
      set({ toast: null });
    }, 2800);
  },

  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },

  toggleFollow: (sid) =>
    set((s) => ({
      following: {
        ...s.following,
        [sid]: !s.following[sid],
      },
    })),

  setStage: (stage) => set({ stage }),
  toggleKeep: (index) =>
    set((s) => ({
      keep: { ...s.keep, [index]: !s.keep[index] },
    })),

  resetOrder: () => set({ stage: 0, keep: {} }),
}));
