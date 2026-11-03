import { create } from 'zustand';
import { publicClient, apiClient, getStoredToken, setStoredToken, removeStoredToken } from '../api/client';
import { useCartStore } from './useCartStore';

export interface UserProfile {
  id: number;
  isGuest: boolean;
  phone?: string;
  email?: string;
  profile?: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;

  // Actions
  setAuthModalOpen: (open: boolean) => void;
  initAuth: () => Promise<string | null>;
  fetchProfile: () => Promise<UserProfile | null>;
  sendOtp: (phone: string) => Promise<{ status: boolean; message: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ status: boolean; message: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authModalOpen: false,

  setAuthModalOpen: (open: boolean) => set({ authModalOpen: open }),

  initAuth: async () => {
    let currentToken = getStoredToken();
    if (currentToken) {
      set({ token: currentToken });
      await get().fetchProfile();
      return currentToken;
    }

    try {
      set({ isLoading: true });
      const resp = await publicClient.post('/auth/user/guest/login', {});
      if (resp.data && resp.data.token) {
        const token = resp.data.token;
        setStoredToken(token);
        set({ token, user: resp.data.data, isAuthenticated: false, isLoading: false });
        return token;
      }
    } catch (err) {
      console.error('Failed to initiate guest login:', err);
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  fetchProfile: async () => {
    try {
      const resp = await apiClient.get('/user/profile');
      if (resp.data?.status && resp.data?.data) {
        const userData: UserProfile = resp.data.data;
        const isAuthed = !userData.isGuest && !!(userData.phone || userData.first_name);
        set({ user: userData, isAuthenticated: isAuthed });
        return userData;
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
    }
    return null;
  },

  sendOtp: async (phone: string) => {
    try {
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      const resp = await publicClient.post('/auth/user/login/signup/phone', {
        phone_number: cleanDigits,
        phone_prefix: 91,
        phone: `+91${cleanDigits}`,
      });
      return {
        status: resp.data?.status ?? true,
        message: resp.data?.message || 'OTP sent successfully to your mobile number',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send OTP. Please try again.';
      return { status: false, message: msg };
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    try {
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      const resp = await publicClient.post('/auth/user/phone/otp/verify', {
        phone_number: cleanDigits,
        phone_prefix: 91,
        otp: otp.trim(),
        phone: `+91${cleanDigits}`,
      });
      if (resp.data && resp.data.token) {
        const token = resp.data.token;
        setStoredToken(token);
        set({ token, isAuthenticated: true });
        await get().fetchProfile();
        // Clean session cart and load this user's cart from backend
        useCartStore.getState().resetCart();
        await useCartStore.getState().syncBackendCart();
        return {
          status: true,
          message: resp.data.message || 'Logged in successfully',
        };
      }
      return {
        status: false,
        message: resp.data?.message || 'Invalid OTP code',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Verification failed. Please check OTP.';
      return { status: false, message: msg };
    }
  },

  logout: async () => {
    removeStoredToken();
    set({ token: null, user: null, isAuthenticated: false });
    // Reset and clear old user's cart from memory and localStorage
    useCartStore.getState().resetCart();
    await get().initAuth();
    await useCartStore.getState().syncBackendCart();
  },
}));
