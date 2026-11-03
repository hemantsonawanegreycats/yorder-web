import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface InquiryMessage {
  id: number;
  inquiryId: number;
  senderId: number;
  senderType: 'user' | 'vendor';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Inquiry {
  id: number;
  userId: number;
  vendorId: number;
  status: string;
  lastMessageAt: string;
  userUnreadCount: number;
  vendor: {
    id: number;
    name: string;
    icon?: string | null;
  };
  messages?: InquiryMessage[];
}

export const fetchInquiries = async (): Promise<Inquiry[]> => {
  try {
    const resp = await apiClient.get('/user/inquiry/all', {
      params: { page: 1, limit: 20 },
    });
    if (resp.data?.status && Array.isArray(resp.data?.data)) {
      return resp.data.data;
    }
  } catch (err) {
    console.warn('Failed to fetch inquiries from backend:', err);
  }
  return [];
};

export const fetchInquiryMessages = async (inquiryId: number | string): Promise<InquiryMessage[]> => {
  try {
    const resp = await apiClient.get(`/user/inquiry/${inquiryId}/messages`, {
      params: { page: 1, limit: 50 },
    });
    if (resp.data?.status && Array.isArray(resp.data?.data)) {
      return resp.data.data;
    }
  } catch (err) {
    console.warn(`Failed to fetch messages for inquiry ${inquiryId}:`, err);
  }
  return [];
};

export const useInquiriesQuery = () => {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: fetchInquiries,
    staleTime: 15 * 1000,
  });
};

export const useInquiryMessagesQuery = (inquiryId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['inquiryMessages', inquiryId],
    queryFn: () => fetchInquiryMessages(inquiryId),
    enabled: enabled && !!inquiryId && !String(inquiryId).startsWith('t'),
    staleTime: 10 * 1000,
  });
};

export const useCreateInquiryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vendorId: number) => {
      const resp = await apiClient.post('/user/inquiry', { vendorId });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
};

export const useSendInquiryMessageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inquiryId, message }: { inquiryId: number; message: string }) => {
      const resp = await apiClient.post(`/user/inquiry/${inquiryId}/message`, { message });
      return resp.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inquiryMessages', variables.inquiryId] });
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
};
