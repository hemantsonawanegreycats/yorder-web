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

  // Robust attribute extraction across array and object formats
  const extractLabel = (v: any, idx: number): string => {
    if (!v) return 'Standard';
    if (Array.isArray(v.attributes) && v.attributes.length > 0) {
      const match =
        v.attributes.find((a: any) =>
          /size|title|option|uk|us|waist|fit/i.test(a?.name || a?.key || '')
        ) || v.attributes[0];
      const val = match?.value ?? match?.title ?? match?.name;
      if (val !== undefined && val !== null && String(val).trim()) return String(val).trim();
    }
    if (v.attributes && typeof v.attributes === 'object' && !Array.isArray(v.attributes)) {
      const entries = Object.entries(v.attributes);
      if (entries.length > 0) {
        const match =
          entries.find(([k]) => /size|title|option|uk|us|waist|fit/i.test(k)) || entries[0];
        const val = match[1];
        if (val !== undefined && val !== null && String(val).trim()) return String(val).trim();
      }
    }
    if (v.size && String(v.size).trim()) return String(v.size).trim();
    if (v.title && String(v.title).trim()) return String(v.title).trim();
    if (v.name && String(v.name).trim()) return String(v.name).trim();
    return `Variant ${idx + 1}`;
  };

  const rawSizes =
    Array.isArray(bp.variableProducts) && bp.variableProducts.length > 0
      ? bp.variableProducts.map(extractLabel)
      : [];

  const seenCounts: Record<string, number> = {};
  const deduplicatedSizes = rawSizes.map((sz: string) => {
    seenCounts[sz] = (seenCounts[sz] || 0) + 1;
    return seenCounts[sz] > 1 ? `${sz} (${seenCounts[sz]})` : sz;
  });

  const isVendorManageInventory = vendor?.is_vendor_manage_inventory !== false;
  const variableProducts = Array.isArray(bp.variableProducts) ? bp.variableProducts : [];

  let isOutOfStock = false;
  let totalStockCount = 0;

  if (variableProducts.length > 0) {
    let hasKnownStock = false;
    let allVariantsOut = true;
    for (const v of variableProducts) {
      const q = typeof v?.availableQty === 'number'
        ? v.availableQty
        : typeof v?.availableQuantity === 'number'
        ? v.availableQuantity
        : undefined;
      if (q !== undefined) {
        hasKnownStock = true;
        totalStockCount += Math.max(0, q);
        if (q > 0) {
          allVariantsOut = false;
        }
      }
    }
    if (hasKnownStock) {
      isOutOfStock = isVendorManageInventory ? allVariantsOut : false;
    } else {
      const baseQty = bp.availableQuantity ?? bp.availableQty;
      isOutOfStock = isVendorManageInventory && typeof baseQty === 'number' ? baseQty <= 0 : false;
      totalStockCount = typeof baseQty === 'number' ? baseQty : 1;
    }
  } else {
    const baseQty = bp.availableQuantity ?? bp.availableQty;
    isOutOfStock = isVendorManageInventory && typeof baseQty === 'number' ? baseQty <= 0 : false;
    totalStockCount = typeof baseQty === 'number' ? baseQty : 1;
  }

  const stockText = isOutOfStock
    ? 'Out of stock'
    : totalStockCount > 0
    ? `${totalStockCount} in stock`
    : 'In stock';

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
    sizes: deduplicatedSizes,
    stock: stockText,
    tagOk: !isOutOfStock,
    note: bp.shortDescription || `Stock counted on the floor at ${vendor?.name || 'showroom'}. Verified by floor rep.`,
    vendorName: vendor?.name,
    rating: Number(bp.rating) || 4.8,
    variableProducts,
    availableQuantity: bp.availableQuantity ?? bp.availableQty,
    isVendorManageInventory,
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
