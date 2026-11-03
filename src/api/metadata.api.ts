import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface BannerItem {
  id: number;
  name: string;
  image_url: string;
  filter?: Record<string, any>;
}

export interface MetadataResponse {
  id: number;
  name: string;
  data: BannerItem[];
}

export const fetchHomeBanner = async (): Promise<BannerItem | null> => {
  try {
    const resp = await apiClient.get('/admin/metadata/name/yo_customer_home_banner');
    if (resp.data?.status && resp.data?.data?.data && Array.isArray(resp.data.data.data)) {
      const items = resp.data.data.data;
      return items[0] || null;
    }
  } catch (err) {
    console.error('Failed to fetch home banner metadata:', err);
  }
  return null;
};

export const useHomeBannerQuery = () => {
  return useQuery({
    queryKey: ['homeBanner'],
    queryFn: fetchHomeBanner,
    staleTime: 30 * 60 * 1000,
  });
};
