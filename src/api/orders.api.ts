import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface OrderItem {
  product: {
    id: number;
    name: string;
    price: number;
    sellPrice: number;
    image?: string;
  };
  quantity: number;
  price: number;
  variant?: {
    id: number;
    sku?: string;
    price?: number;
    sellPrice?: number;
    attributes?: any;
    image?: string;
  } | null;
}

export interface CurrentOrderStatus {
  id: number;
  name: string;
  comment?: string;
  createdAt?: string;
}

export interface BackendOrder {
  id: number;
  item: OrderItem[];
  vendor: {
    id: number;
    name: string;
    icon?: string;
    address?: {
      formated_address?: string;
    };
    isOnline?: boolean;
  };
  current_order_status: CurrentOrderStatus;
  status_history?: CurrentOrderStatus[];
  delivery_address: {
    id: number;
    formated_address: string;
    latitude?: string | number;
    longitude?: string | number;
  };
  billing_address?: {
    id: number;
    formated_address: string;
  };
  paymentMethod?: {
    id: number;
    name: string;
    description?: string;
  };
  delivery_by?: {
    id: number;
    user?: {
      first_name?: string;
      last_name?: string;
      profile?: string;
      phone?: {
        number?: string;
      };
    };
  };
  deliveryOtp?: string;
  totalAmount: number;
  discount: number;
  payAmount: number;
  deliveryFee: number;
  totalTax?: number;
  isPaid: boolean;
  orderCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  cart_id: number | string;
  payment_method: string;
  delivery_address_id: number;
  billing_address_id: number;
  isPaid?: boolean;
  transaction_id?: number;
  coupons?: Record<number, string>;
}

export const fetchAllOrders = async (): Promise<BackendOrder[]> => {
  try {
    const resp = await apiClient.get('/user/order/all');
    if (resp.data?.status && Array.isArray(resp.data?.data)) {
      return resp.data.data;
    }
  } catch (err) {
    console.warn('Failed to fetch orders from backend:', err);
  }
  return [];
};

export const fetchOrderById = async (orderId: number | string): Promise<BackendOrder | null> => {
  try {
    const resp = await apiClient.get(`/user/order/${orderId}`);
    if (resp.data?.status && resp.data?.data) {
      return resp.data.data;
    }
  } catch (err) {
    console.warn(`Failed to fetch order ${orderId}:`, err);
  }
  return null;
};

export const useOrdersQuery = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchAllOrders,
    staleTime: 10 * 1000,
  });
};

export const useOrderByIdQuery = (orderId?: number | string | null, enabled = true) => {
  return useQuery({
    queryKey: ['order', String(orderId)],
    queryFn: () => (orderId ? fetchOrderById(orderId) : null),
    enabled: enabled && !!orderId,
    refetchInterval: (query) => {
      const order = query.state.data;
      if (!order) return false;
      const s = order.current_order_status?.name?.toLowerCase();
      const isActive = !order.orderCompleted && s !== 'delivered' && s !== 'cancelled';
      return isActive ? 10000 : false;
    },
  });
};

export const useCreateOrderFromCartMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cart_id,
      ...payload
    }: CreateOrderPayload): Promise<BackendOrder> => {
      const resp = await apiClient.post(`/user/cart/${cart_id}/order/create`, payload);
      if (resp.data && resp.data.status === false) {
        throw new Error(resp.data.message || 'Failed to place order');
      }
      // data may be an array of created orders or a single order object
      const data = resp.data.data;
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCancelOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      comment = 'Cancelled by user',
    }: {
      orderId: number | string;
      comment?: string;
    }) => {
      const resp = await apiClient.put(`/user/order/${orderId}`, {
        status: 'cancelled',
        status_comment: comment,
      });
      return resp.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', String(variables.orderId)] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
