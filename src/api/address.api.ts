import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface UserAddress {
  id: number;
  address1?: string;
  address2?: string;
  street?: string;
  sublocality?: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: number | string;
  nearBy?: string;
  latitude?: number | string;
  longitude?: number | string;
  formated_address: string;
  type?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface CreateAddressPayload {
  addressLine1: string;
  addressLine2?: string;
  nearBy?: string;
  city: string;
  state: string;
  zipCode: string;
  type?: 'user_home' | 'user_office' | 'user_other';
  latitude?: number | string;
  longitude?: number | string;
}

export const fetchAllAddresses = async (): Promise<UserAddress[]> => {
  try {
    const resp = await apiClient.get('/user/address/all');
    if (resp.data?.status && Array.isArray(resp.data?.data)) {
      return resp.data.data;
    }
  } catch (err) {
    console.warn('Failed to fetch addresses:', err);
  }
  return [];
};

export const useAddressesQuery = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAllAddresses,
    staleTime: 60 * 1000,
  });
};

export const useCreateAddressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAddressPayload) => {
      const resp = await apiClient.post('/user/address', payload);
      if (resp.data && resp.data.status === false) {
        throw new Error(resp.data.message || 'Failed to create address');
      }
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useDeleteAddressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const resp = await apiClient.delete(`/user/address/${id}`);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
