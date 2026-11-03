import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export interface ValidateCouponPayload {
  code: string;
  cartAmount?: number;
  vendorId?: number;
}

export interface ValidateCouponResponse {
  status: boolean;
  message: string;
  data: {
    valid: boolean;
    discount: number;
    couponCode: string;
    message?: string;
    vendorId?: number;
  };
}

export const validateCoupon = async (payload: ValidateCouponPayload): Promise<ValidateCouponResponse> => {
  const resp = await apiClient.post('/user/coupon/validate', payload);
  return resp.data;
};

export const useValidateCouponMutation = () => {
  return useMutation({
    mutationFn: validateCoupon,
  });
};
