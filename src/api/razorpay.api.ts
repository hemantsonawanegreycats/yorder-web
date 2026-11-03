import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface RazorpayOrderData {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
  attempts?: number;
  notes?: Record<string, any>;
  created_at?: number;
}

export interface RazorpayCreateResponse {
  status: boolean;
  message: string;
  data: RazorpayOrderData;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}

export interface RazorpayVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    transaction_id?: string;
  };
}

/**
 * Creates a Razorpay order on the backend (/user/razorpay/payment/create)
 */
export const useCreateRazorpayOrderMutation = () => {
  return useMutation({
    mutationFn: async (amount: number): Promise<RazorpayCreateResponse> => {
      const resp = await apiClient.post('/user/razorpay/payment/create', { amount });
      return resp.data;
    },
  });
};

/**
 * Verifies Razorpay payment signature on backend (/user/razorpay/payment/verify)
 */
export const useVerifyRazorpayPaymentMutation = () => {
  return useMutation({
    mutationFn: async (payload: RazorpayVerifyPayload): Promise<RazorpayVerifyResponse> => {
      const resp = await apiClient.post('/user/razorpay/payment/verify', payload);
      return resp.data;
    },
  });
};

/**
 * Checks payment status by merchant order id
 */
export const fetchRazorpayPaymentStatus = async (merchantOrderId: string) => {
  const resp = await apiClient.get(`/user/razorpay/payment/${merchantOrderId}/status`);
  return resp.data;
};
