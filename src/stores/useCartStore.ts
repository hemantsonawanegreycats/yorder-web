import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BagItem, Product } from '../types';
import { useAppStore } from './useAppStore';
import { useAuthStore } from './useAuthStore';
import { fetchCart, ensureCart, BackendCart } from '../api/cart.api';
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
  pendingAddProduct: { product: Product; size?: string; variantId?: number } | null;
  setPendingAddProduct: (item: { product: Product; size?: string; variantId?: number } | null) => void;
  addToBag: (product: Product, size?: string, variantId?: number) => Promise<void>;
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

        if (newQty > 10) {
          useAppStore.getState().showToast('Maximum order quantity is 10 units per item');
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

      addToBag: async (product: Product, size?: string, explicitVariantId?: number) => {
        // Option B: Require phone OTP login immediately when adding to bag
        const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
        if (!isAuthenticated) {
          set({ pendingAddProduct: { product, size, variantId: explicitVariantId } });
          setAuthModalOpen(true);
          useAppStore.getState().showToast('Please log in with mobile OTP to add items to your bag');
          return;
        }

        const selectedSize = size || (product.sizes?.length ? product.sizes[0] : 'Standard');
        const state = get();

        // 1. Determine variantId
        let variantId = explicitVariantId;
        if (!variantId && product.variableProducts?.length) {
          const matching = product.variableProducts.find(
            (v: any) =>
              (explicitVariantId && v.id === explicitVariantId) ||
              (v.size && String(v.size).toLowerCase() === selectedSize.toLowerCase()) ||
              (v.title && String(v.title).toLowerCase() === selectedSize.toLowerCase()) ||
              (v.attributes?.size && String(v.attributes.size).toLowerCase() === selectedSize.toLowerCase()) ||
              (v.attributes?.title && String(v.attributes.title).toLowerCase() === selectedSize.toLowerCase()) ||
              (Array.isArray(v.attributes) &&
                v.attributes.some(
                  (a: any) =>
                    (a?.value && String(a.value).toLowerCase() === selectedSize.toLowerCase()) ||
                    (a?.title && String(a.title).toLowerCase() === selectedSize.toLowerCase())
                ))
          );
          variantId = matching?.id || product.variableProducts[0]?.id;
        }

        // 2. Check if item already exists in bag
        const existingIdx = state.bag.findIndex(
          (b) =>
            String(b.pid) === String(product.id) &&
            (variantId ? b.variantId === variantId : b.size === selectedSize)
        );

        if (existingIdx >= 0) {
          await get().updateQuantity(existingIdx, 1);
          useAppStore.getState().showToast(`Added another ${product.name} to bag`);
          return;
        }

        // 3. Optimistically add item to bag immediately (0ms)
        const newItem: BagItem = {
          pid: String(product.id),
          size: selectedSize,
          quantity: 1,
          variantId,
          product,
        };

        set((s) => ({
          bag: [...s.bag, newItem],
        }));
        useAppStore.getState().showToast(`${product.name} added to the bag`);

        // 4. Ensure backend cart exists and sync to database
        try {
          const cart = await ensureCart();
          if (cart?.id) {
            set({ cartId: cart.id, minOrderValue: cart.minOrderValue || 0 });

            const requestBody: any = {
              product_id: Number(product.id),
              quantity: 1,
            };
            if (variantId) {
              requestBody.variant_id = Number(variantId);
            }

            const postResp = await apiClient.post(`/user/cart/${cart.id}/item`, requestBody);
            const createdItemId = postResp.data?.data?.id || postResp.data?.id;

            if (createdItemId) {
              set((s) => ({
                bag: s.bag.map((b) =>
                  String(b.pid) === String(product.id) &&
                  (variantId ? b.variantId === variantId : b.size === selectedSize)
                    ? { ...b, cartItemId: createdItemId, variantId }
                    : b
                ),
              }));
            }
          }
        } catch (e: any) {
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
            if (Array.isArray(backendCart.items) && backendCart.items.length > 0) {
              const mappedFromBackend: BagItem[] = backendCart.items.map((it) => {
                const product = mapBackendToProduct(it.product as any);
                return {
                  pid: String(it.product?.id || it.id),
                  size:
                    it.variant?.attributes?.title ||
                    it.variant?.attributes?.size ||
                    it.variant?.name ||
                    'Standard',
                  quantity: it.quantity || 1,
                  cartItemId: it.id,
                  variantId: it.variant?.id,
                  product,
                };
              });

              set({ bag: mappedFromBackend, isSyncing: false });
              return backendCart;
            } else if (Array.isArray(backendCart.items) && backendCart.items.length === 0) {
              // If backend cart is empty, keep local items and attempt to sync them to the backend cart
              const currentBag = get().bag;
              if (currentBag.length > 0) {
                for (const item of currentBag) {
                  try {
                    const postResp = await apiClient.post(`/user/cart/${backendCart.id}/item`, {
                      product_id: Number(item.pid),
                      quantity: item.quantity || 1,
                      ...(item.variantId ? { variant_id: Number(item.variantId) } : {}),
                    });
                    const realId = postResp.data?.data?.id || postResp.data?.id;
                    if (realId) {
                      item.cartItemId = realId;
                    }
                  } catch (pushErr) {
                    console.warn('Failed to sync local item to backend cart:', pushErr);
                  }
                }
              } else {
                set({ bag: [], isSyncing: false });
              }
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
