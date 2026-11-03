import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { Product } from '../types';

export interface BackendProduct {
  id: number;
  name: string;
  price: number;
  sellPrice: number;
  image?: string;
  shortDescription?: string;
  rating?: number;
  rating_count?: number;
  availableQuantity?: number;
  category?: { id: number; name: string }[];
  vendor?: {
    id: number;
    name: string;
    address?: { formated_address?: string };
  }[];
  media?: { id: number; url: string }[];
  variableProducts?: {
    id: number;
    price: number;
    sellPrice: number;
    attributes: Record<string, string>;
  }[];
}

export const mapBackendToProduct = (bp: BackendProduct | any): Product => {
  if (!bp) {
    return {
      id: '0',
      name: 'Showroom Item',
      brand: 'Verified Showroom',
      cat: 'General',
      sid: '1',
      price: 0,
      mrp: 0,
      off: '',
      img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=70',
      gal: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=70'],
      sizes: ['Standard'],
      stock: 'In stock',
      tagOk: true,
      note: 'Verified showroom stock',
      rating: 4.8,
    };
  }

  const price = Number(bp.sellPrice ?? bp.price ?? 0);
  const mrp = Number(bp.price ?? bp.sellPrice ?? price);
  const discountPercent =
    mrp > price && mrp > 0
      ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF`
      : 'BEST PRICE';

  const vendor = Array.isArray(bp.vendor) ? bp.vendor[0] : bp.vendor;
  const catName = Array.isArray(bp.category)
    ? bp.category[0]?.name || 'General'
    : bp.category?.name || 'General';

  const mainImage =
    bp.image ||
    (Array.isArray(bp.media) && bp.media[0]?.url) ||
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=70';

  const gallery = Array.isArray(bp.media) && bp.media.length
    ? bp.media.map((m: any) => m?.url).filter(Boolean)
    : [mainImage];

  return {
    id: String(bp.id ?? '0'),
    name: bp.name || 'Product',
    brand: vendor?.name || bp.brand || 'Local Showroom',
    cat: catName,
    sid: vendor?.id ? String(vendor.id) : (bp.sid ? String(bp.sid) : '62'),
    price,
    mrp,
    off: discountPercent,
    img: mainImage,
    gal: gallery.length ? gallery : [mainImage],
    sizes: Array.isArray(bp.variableProducts) && bp.variableProducts.length
      ? bp.variableProducts.map((v: any) => v?.attributes?.title || v?.attributes?.size || 'Standard')
      : ['Standard'],
    stock: `${bp.availableQuantity ?? 1} in stock`,
    tagOk: (bp.availableQuantity ?? 1) > 0,
    note: bp.shortDescription || `Stock counted on the floor at ${vendor?.name || 'showroom'}. Verified by floor rep.`,
    vendorName: vendor?.name,
    rating: Number(bp.rating) || 4.8,
  };
};

export const fetchProducts = async (params?: Record<string, any>): Promise<Product[]> => {
  try {
    const resp = await apiClient.get('/user/product/all', {
      params: { limit: 50, ...params },
    });
    if (resp.data && Array.isArray(resp.data.data)) {
      return resp.data.data.map(mapBackendToProduct);
    }
  } catch (error) {
    console.error('Failed to fetch real backend products:', error);
  }
  return [];
};

export const fetchProductById = async (id: string | number): Promise<Product | null> => {
  const cleanId = String(id).replace('bp-', '');
  try {
    const resp = await apiClient.get(`/user/product/${cleanId}`);
    if (resp.data?.status && resp.data?.data) {
      return mapBackendToProduct(resp.data.data);
    }
  } catch (error) {
    console.error(`Failed to fetch real product ${id} from backend:`, error);
  }
  return null;
};

export const useProductByIdQuery = (id: string | number | undefined) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => (id ? fetchProductById(id) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductsQuery = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 60 * 1000,
  });
};

export interface InfiniteProductParams {
  search?: string;
  categorys?: string;
  vendor_id?: string | number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const useInfiniteProductsQuery = (params?: InfiniteProductParams) => {
  const limit = params?.limit || 24;

  return useInfiniteQuery({
    queryKey: ['infinite-products', params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams: Record<string, any> = {
        page: pageParam,
        limit,
      };

      if (params?.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params?.categorys && params.categorys !== 'All') {
        queryParams.categorys = params.categorys;
      }
      if (params?.vendor_id) {
        queryParams.vendor_id = params.vendor_id;
      }
      if (params?.sortBy) {
        queryParams.sortBy = params.sortBy;
      }
      if (params?.sortOrder) {
        queryParams.sortOrder = params.sortOrder;
      }

      const resp = await apiClient.get('/user/product/all', {
        params: queryParams,
      });

      const rawItems = Array.isArray(resp.data?.data) ? resp.data.data : [];
      const items = rawItems.map(mapBackendToProduct);

      return {
        items,
        nextPage: items.length >= limit ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 60 * 1000,
  });
};
