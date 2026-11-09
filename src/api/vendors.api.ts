import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { Store } from '../types';
import { getStoreStatusDetails } from '../utils/storeStatus';

export interface BackendVendor {
  id: number;
  name: string;
  isOnline: boolean;
  coverImage?: string;
  image?: { url: string; useType?: { name: string } }[];
  icon?: string;
  rating?: number;
  rating_count?: number;
  categorys?: { id: number; name: string }[];
  address?: {
    formated_address?: string;
    nearBy?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
  };
  open_hours?: {
    id: number;
    day: string;
    open: string;
    close: string;
    isClosed: boolean | number;
  }[];
  owner?: {
    first_name?: string;
    last_name?: string;
    profile?: string;
  };
  _count?: {
    Product?: number;
  };
  is_following?: boolean;
}

export const mapBackendToStore = (bv: any): Store => {
  if (!bv) {
    return {
      id: '1',
      name: 'Showroom',
      ini: 'SH',
      cat: 'Specialty Showroom',
      addr: 'Mumbai, Maharashtra',
      rating: 'New',
      eta: '45 min',
      dist: 'Nearby',
      count: '',
      hours: 'OPEN TODAY',
      img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=75',
      repName: 'Floor Team',
      repIni: 'FT',
      repLine: 'Floor team is on the floor',
      meta: 'Bandra · Verified showroom',
      isOnline: true,
    };
  }

  const name = bv.name || 'Showroom';
  const words = name.split(' ').filter(Boolean);
  const ini = words.map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'SH';
  const cat = bv.categorys?.[0]?.name || bv.category?.[0]?.name || 'Specialty Showroom';
  const addr = bv.address?.formated_address || `${bv.address?.city || 'Mumbai'}, Maharashtra`;
  const img =
    bv.coverImage ||
    bv.icon ||
    bv.image?.[0]?.url ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=75';

  const countStr = bv._count?.Product ? String(bv._count.Product) : '';
  const rep = bv.owner?.first_name || words[0] || 'Floor Team';
  const repIni = rep.slice(0, 2).toUpperCase();

  const statusInfo = getStoreStatusDetails(bv.open_hours);
  const isStoreActive = bv.isOnline !== false && statusInfo.isOpen;

  const rawRating = bv.rating && Number(bv.rating) > 0 ? Number(bv.rating).toFixed(1) : 'New';
  const ratingCount = bv.rating_count ? Number(bv.rating_count) : undefined;

  return {
    id: String(bv.id || '1'),
    name,
    ini,
    cat,
    addr,
    rating: rawRating,
    ratingCount,
    eta: '45 min',
    dist: 'Nearby',
    count: countStr,
    hours: statusInfo.statusText,
    img,
    repName: rep,
    repIni,
    repLine: `${rep} is on the floor`,
    meta: `${bv.address?.nearBy || bv.address?.city || 'Bandra'} · ${countStr ? `${countStr} items` : 'Live stock'}`,
    isOnline: bv.isOnline ?? true,
    isOpen: isStoreActive,
    openHours: Array.isArray(bv.open_hours) ? bv.open_hours : [],
    lat: bv.address?.latitude ? parseFloat(String(bv.address.latitude)) : undefined,
    lng: bv.address?.longitude ? parseFloat(String(bv.address.longitude)) : undefined,
  };
};

export const fetchVendors = async (): Promise<Record<string, Store>> => {
  try {
    const resp = await apiClient.get('/user/vendor/all', {
      params: { limit: 30 },
    });
    const vendorList = resp.data?.data || (Array.isArray(resp.data) ? resp.data : []);
    if (Array.isArray(vendorList)) {
      const mapped: Record<string, Store> = {};
      vendorList.forEach((bv: BackendVendor) => {
        const store = mapBackendToStore(bv);
        mapped[store.id] = store;
      });
      return mapped;
    }
  } catch (error) {
    console.error('Failed to fetch real vendors from backend:', error);
  }
  return {};
};

export const fetchVendorById = async (id: string | number): Promise<Store | null> => {
  const cleanId = String(id).replace('bv-', '');
  try {
    const resp = await apiClient.get(`/user/vendor/${cleanId}`);
    const vendorData = resp.data?.data || (resp.data?.id ? resp.data : null);
    if (vendorData) {
      return mapBackendToStore(vendorData);
    }
  } catch (error) {
    console.error(`Failed to fetch real vendor ${id} from backend:`, error);
  }
  return null;
};

export const useVendorByIdQuery = (id: string | number | undefined) => {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: () => (id ? fetchVendorById(id) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useVendorsQuery = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useToggleFollowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vendorId: number | string) => {
      const id = typeof vendorId === 'string' && vendorId.startsWith('bv-') ? vendorId.replace('bv-', '') : vendorId;
      const resp = await apiClient.post(`/user/vendor/${id}/follow`);
      return resp.data;
    },
    onSuccess: (_, vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendorFollowStatus', vendorId] });
    },
  });
};

export const useGetVendorFollowStatusQuery = (vendorId?: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['vendorFollowStatus', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const id = typeof vendorId === 'string' && vendorId.startsWith('bv-') ? vendorId.replace('bv-', '') : vendorId;
      const resp = await apiClient.get(`/user/vendor/${id}/follow-status`);
      return resp.data;
    },
    enabled: !!vendorId && enabled,
    staleTime: 60 * 1000,
  });
};
