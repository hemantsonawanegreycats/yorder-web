import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface BackendCartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    sellPrice: number;
    image?: string;
    media?: { url: string }[];
    vendor?: {
      id: number;
      name: string;
      icon?: string;
      address?: {
        formated_address?: string;
      };
      isOnline?: boolean;
    }[];
    category?: {
      id: number;
      name: string;
    }[];
  };
  variant?: {
    id: number;
    sku: string;
    name: string;
    price: number;
    sellPrice: number;
    attributes?: Record<string, string>;
  } | null;
}

export interface BackendCart {
  id: number;
  name: string;
  items: BackendCartItem[];
  minOrderValue?: number;
}

export const fetchCart = async (): Promise<BackendCart | null> => {
  try {
    const resp = await apiClient.get('/user/cart/default');
    const data = resp.data?.data || (resp.data?.items ? resp.data : null);
    if (data) {
      return {
        ...data,
        items: Array.isArray(data.items) ? data.items : [],
        minOrderValue: resp.data?.minOrderValue || data.minOrderValue || 0,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch backend cart:', err);
  }
  return null;
};

export const useCartQuery = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 10 * 1000,
  });
};

export const useAddCartItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cartId,
      productId,
      quantity = 1,
      variantId,
    }: {
      cartId: number | string;
      productId: number | string;
      quantity?: number;
      variantId?: number;
    }) => {
      const resp = await apiClient.post(`/user/cart/${cartId}/item`, {
        product_id: Number(productId),
        quantity,
        ...(variantId ? { variant_id: variantId } : {}),
      });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveCartItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cartId,
      itemId,
    }: {
      cartId: number | string;
      itemId: number | string;
    }) => {
      const resp = await apiClient.delete(`/user/cart/${cartId}/item/${itemId}`);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
