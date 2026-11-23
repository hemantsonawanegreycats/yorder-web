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

  const isVendorManageInventory =
    vendor?.is_vendor_manage_inventory === true ||
    vendor?.is_vendor_manage_inventory === 1 ||
    vendor?.is_vendor_manage_inventory === '1';
  const variableProducts = Array.isArray(bp.variableProducts) ? bp.variableProducts : [];

  let isOutOfStock = false;
  let totalStockCount = 0;

  // Match the mobile app: stock counts are only enforced when the vendor manages inventory.
  // Vendors that don't manage inventory leave availableQuantity at 0, which must NOT be read as "sold out".
  if (!isVendorManageInventory) {
    isOutOfStock = false;
  } else if (variableProducts.length > 0) {
    let allVariantsOut = true;
    let anyQtySpecified = false;

    for (const v of variableProducts) {
      const q = v?.availableQty ?? v?.availableQuantity;
      if (q !== undefined && q !== null) {
        anyQtySpecified = true;
        const numQ = Number(q);
        totalStockCount += Math.max(0, numQ);
        if (numQ > 0) {
          allVariantsOut = false;
        }
      }
    }

    if (anyQtySpecified) {
      isOutOfStock = allVariantsOut;
    } else {
      const baseQty = bp.availableQuantity ?? bp.availableQty;
      if (baseQty !== undefined && baseQty !== null) {
        isOutOfStock = Number(baseQty) <= 0;
        totalStockCount = Math.max(0, Number(baseQty));
      } else {
        isOutOfStock = false;
      }
    }
  } else {
    const baseQty = bp.availableQuantity ?? bp.availableQty;
    if (baseQty !== undefined && baseQty !== null) {
      isOutOfStock = Number(baseQty) <= 0;
      totalStockCount = Math.max(0, Number(baseQty));
    } else {
      isOutOfStock = false;
    }
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

let fallbackFeedCache: Product[] | null = null;
let fallbackFeedPromise: Promise<Product[]> | null = null;

export const loadFallbackFeedProducts = async (): Promise<Product[]> => {
  if (fallbackFeedCache) return fallbackFeedCache;
  if (fallbackFeedPromise) return fallbackFeedPromise;

  fallbackFeedPromise = (async () => {
    try {
      const res = await fetch('/google-feed.xml');
      if (!res.ok) return [];
      const xmlText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'application/xml');
      const itemNodes = Array.from(doc.getElementsByTagName('item'));
      const getTag = (el: Element, tag: string): string => {
        const node = el.getElementsByTagName(tag)[0] || el.getElementsByTagName(`g:${tag}`)[0];
        return node?.textContent?.trim() || '';
      };

      const parsed: Product[] = itemNodes.map((item) => {
        const id = getTag(item, 'id');
        const name = getTag(item, 'title') || 'Showroom Product';
        const brand = getTag(item, 'brand') || 'Yorder Showroom';
        const description = getTag(item, 'description') || name;
        const img = getTag(item, 'image_link') || 'https://ywsglobal.com/assets/hero-drop.jpg';
        const priceStr = getTag(item, 'price').replace(/[^\d.]/g, '');
        const price = Number(priceStr) || 0;
        const availability = getTag(item, 'availability');
        const isInStock = availability !== 'out_of_stock';

        return {
          id,
          name,
          brand,
          cat: brand,
          sid: '62',
          price,
          mrp: price,
          off: 'BEST PRICE',
          img,
          gal: [img],
          sizes: ['Standard'],
          stock: isInStock ? 'In stock' : 'Out of stock',
          tagOk: isInStock,
          note: description,
          vendorName: brand,
          rating: 4.8,
          variableProducts: [],
          availableQuantity: isInStock ? 5 : 0,
          isVendorManageInventory: false,
        };
      });

      if (parsed.length > 0) {
        fallbackFeedCache = parsed;
      }
      return parsed;
    } catch (err) {
      console.warn('Failed to parse fallback google-feed.xml:', err);
      return [];
    } finally {
      fallbackFeedPromise = null;
    }
  })();

  return fallbackFeedPromise;
};

export const fetchProducts = async (params?: Record<string, any>): Promise<Product[]> => {
  try {
    const resp = await apiClient.get('/user/product/all', {
      params: { limit: 50, ...params },
    });
    if (resp.data && Array.isArray(resp.data.data) && resp.data.data.length > 0) {
      return resp.data.data.map(mapBackendToProduct);
    }
  } catch (error) {
    console.error('Failed to fetch real backend products, using feed fallback:', error);
  }
  const fallback = await loadFallbackFeedProducts();
  const limit = Number(params?.limit) || 50;
  return fallback.slice(0, limit);
};

export const fetchProductById = async (id: string | number): Promise<Product | null> => {
  const cleanId = String(id).replace(/\D/g, '');
  if (!cleanId) return null;
  try {
    const resp = await apiClient.get(`/user/product/${cleanId}`);
    const productData = resp.data?.data ?? resp.data?.product ?? (resp.data?.id ? resp.data : null);
    if (productData) {
      return mapBackendToProduct(productData);
    }
  } catch (error) {
    console.error(`Failed to fetch real product ${id} from backend, checking feed fallback:`, error);
  }
  const fallback = await loadFallbackFeedProducts();
  return fallback.find((p) => String(p.id) === cleanId) || null;
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

      try {
        const resp = await apiClient.get('/user/product/all', {
          params: queryParams,
        });

        const rawItems = Array.isArray(resp.data?.data) ? resp.data.data : [];
        if (rawItems.length > 0) {
          const items = rawItems.map(mapBackendToProduct);
          return {
            items,
            nextPage: items.length >= limit ? pageParam + 1 : undefined,
          };
        }
      } catch (err) {
        console.warn('Infinite products backend fetch failed, falling back to google-feed.xml:', err);
      }

      let fallback = await loadFallbackFeedProducts();
      if (params?.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        fallback = fallback.filter(
          (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
        );
      }
      const start = (pageParam - 1) * limit;
      const items = fallback.slice(start, start + limit);
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
