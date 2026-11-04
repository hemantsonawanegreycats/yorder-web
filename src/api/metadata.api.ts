import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface BannerItem {
  id?: number | string;
  name?: string;
  image_url?: string;
  image?: any;
  filter?: Record<string, any>;
  categorie?: string;
  categorys?: string;
  location?: string;
}

export interface MetadataResponse {
  id: number;
  name: string;
  data: BannerItem[];
}

export const fetchHomeBanners = async (): Promise<BannerItem[]> => {
  try {
    const resp = await apiClient.get('/admin/metadata/name/yo_customer_home_banner');
    if (resp.data?.status && resp.data?.data?.data && Array.isArray(resp.data.data.data)) {
      return resp.data.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch home banner metadata:', err);
  }
  return [];
};

export const fetchHomeBanner = async (): Promise<BannerItem | null> => {
  const banners = await fetchHomeBanners();
  return banners[0] || null;
};

export const useHomeBannersQuery = () => {
  return useQuery({
    queryKey: ['homeBanners'],
    queryFn: fetchHomeBanners,
    staleTime: 15 * 60 * 1000,
  });
};

export const useHomeBannerQuery = () => {
  return useQuery({
    queryKey: ['homeBanner'],
    queryFn: fetchHomeBanner,
    staleTime: 15 * 60 * 1000,
  });
};
