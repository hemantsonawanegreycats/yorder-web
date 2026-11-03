import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BagItem, Product } from '../types';
import { useAppStore } from './useAppStore';
import { useAuthStore } from './useAuthStore';
import { fetchCart, BackendCart } from '../api/cart.api';
import { mapBackendToProduct } from '../api/products.api';
import { apiClient } from '../api/client';

export interface AppliedCoupon {
  code: string;
  discount: number;
  vendorId?: number;
}

interface CartState {
  bag: BagItem[];
  cartId: number | null;
  selectedAddressId: number | null;
  appliedCoupon: AppliedCoupon | null;
  minOrderValue: number;
  pendingAddProduct: { product: Product; size?: string } | null;
  setPendingAddProduct: (item: { product: Product; size?: string } | null) => void;
  addToBag: (product: Product, size?: string) => Promise<void>;
  updateQuantity: (index: number, delta: number) => void;
  removeAt: (index: number) => void;
  clearBag: () => void;
  resetCart: () => void;
  setSelectedAddressId: (addressId: number | null) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  syncBackendCart: () => Promise<BackendCart | null>;
  isSyncing: boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      bag: [],
      cartId: null,
      selectedAddressId: null,
      appliedCoupon: null,
      minOrderValue: 0,
      pendingAddProduct: null,
      isSyncing: false,

      setPendingAddProduct: (item) => set({ pendingAddProduct: item }),

      setSelectedAddressId: (addressId) => set({ selectedAddressId: addressId }),

      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
        useAppStore.getState().showToast(`Coupon ${coupon.code} applied: ₹${coupon.discount} off`);
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
        useAppStore.getState().showToast('Coupon removed');
      },

      resetCart: () => {
        try {
          localStorage.removeItem('yorder_cart_storage');
        } catch (e) {
          console.warn('Failed to clear cart storage:', e);
        }
        set({
          bag: [],
          cartId: null,
          selectedAddressId: null,
          appliedCoupon: null,
          minOrderValue: 0,
          pendingAddProduct: null,
          isSyncing: false,
        });
      },

      updateQuantity: async (index: number, delta: number) => {
        const state = get();
        const currentItem = state.bag[index];
        if (!currentItem) return;

        const currentQty = currentItem.quantity || 1;
        const newQty = currentQty + delta;

        if (newQty <= 0) {
          get().removeAt(index);
          return;
        }

        const updated = [...state.bag];
        updated[index] = { ...currentItem, quantity: newQty };
        set({ bag: updated });

        // Sync with backend if cartItemId and cartId exist
        if (state.cartId && currentItem.cartItemId) {
          try {
            await apiClient.put(`/user/cart/${state.cartId}/item/${currentItem.cartItemId}`, {
              quantity: newQty,
            });
          } catch (e) {
            console.warn('Backend update quantity notice:', e);
          }
        }
      },

      removeAt: async (index: number) => {
        const state = get();
        const itemToRemove = state.bag[index];
        set((s) => ({
          bag: s.bag.filter((_, i) => i !== index),
        }));

        if (state.cartId && itemToRemove?.cartItemId) {
          try {
            await apiClient.delete(`/user/cart/${state.cartId}/item/${itemToRemove.cartItemId}`);
          } catch (e) {
            console.warn('Backend delete item notice:', e);
          }
        }
      },

      clearBag: () => {
        set({ bag: [], appliedCoupon: null });
      },

      addToBag: async (product: Product, size?: string) => {
        // Option B: Require phone OTP login immediately when adding to bag
        const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
        if (!isAuthenticated) {
          set({ pendingAddProduct: { product, size } });
          setAuthModalOpen(true);
          useAppStore.getState().showToast('Please log in with mobile OTP to add items to your bag');
          return;
        }

        const selectedSize = size || (product.sizes?.length ? product.sizes[0] : 'Standard');
        const state = get();

        // Check if item already exists in bag
        const existingIdx = state.bag.findIndex((b) => String(b.pid) === String(product.id) && b.size === selectedSize);
        if (existingIdx >= 0) {
          await get().updateQuantity(existingIdx, 1);
          useAppStore.getState().showToast(`Added another ${product.name} to bag`);
          return;
        }

        set((s) => ({
          bag: [...s.bag, { pid: product.id, size: selectedSize, quantity: 1, product }],
        }));
        useAppStore.getState().showToast(`${product.name} added to the bag`);

        // If backend cart exists or can be obtained, sync in background
        try {
          let cId = state.cartId;
          if (!cId) {
            const backend = await fetchCart();
            if (backend?.id) {
              cId = backend.id;
              set({ cartId: backend.id, minOrderValue: backend.minOrderValue || 0 });
            }
          }
          if (cId) {
            await apiClient.post(`/user/cart/${cId}/item`, {
              product_id: Number(product.id),
              quantity: 1,
            });
            await get().syncBackendCart();
          }
        } catch (e) {
          console.warn('Backend item sync notice:', e);
        }
      },

      syncBackendCart: async () => {
        try {
          set({ isSyncing: true });
          const backendCart = await fetchCart();
          if (backendCart?.id) {
            set({
              cartId: backendCart.id,
              minOrderValue: backendCart.minOrderValue || 0,
            });

            // If backend has items, map them directly as the source of truth
            if (Array.isArray(backendCart.items)) {
              const mappedFromBackend: BagItem[] = backendCart.items.map((it) => {
                const product = mapBackendToProduct(it.product as any);
                return {
                  pid: String(it.product.id),
                  size:
                    it.variant?.attributes?.title ||
                    it.variant?.attributes?.size ||
                    'Standard',
                  quantity: it.quantity || 1,
                  cartItemId: it.id,
                  variantId: it.variant?.id,
                  product,
                };
              });

              set({ bag: mappedFromBackend, isSyncing: false });
              return backendCart;
            }
          }
        } catch (e) {
          console.warn('Cart sync notice:', e);
        } finally {
          set({ isSyncing: false });
        }
        return null;
      },
    }),
    {
      name: 'yorder_cart_storage',
    }
  )
);
