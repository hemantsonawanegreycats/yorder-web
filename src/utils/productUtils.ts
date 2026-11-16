import { Product, Store } from '../types';

/**
 * Determine if a product is out of stock by inspecting tagOk,
 * variable products quantities, and availableQuantity.
 */
export const isProductOutOfStock = (product: Product): boolean => {
  if (product.tagOk === false) return true;
  if (Array.isArray(product.variableProducts) && product.variableProducts.length > 0) {
    let anyQty = false;
    const allOut = product.variableProducts.every((v) => {
      const q = v?.availableQty ?? v?.availableQuantity;
      if (q !== undefined && q !== null) {
        anyQty = true;
        return Number(q) <= 0;
      }
      return false;
    });
    if (anyQty && allOut) return true;
  }
  if (product.availableQuantity !== undefined && product.availableQuantity !== null) {
    return Number(product.availableQuantity) <= 0;
  }
  return !product.tagOk;
};

/**
 * Get the maximum available stock quantity for a specific product / variant in the bag (capped at 10).
 */
export const getMaxAvailableQuantity = (
  product?: Product | null,
  variantId?: number | string,
  size?: string
): number => {
  if (!product) return 10;

  if (Array.isArray(product.variableProducts) && product.variableProducts.length > 0) {
    let matchedVariant = variantId
      ? product.variableProducts.find((v: any) => String(v.id) === String(variantId))
      : undefined;

    if (!matchedVariant && size) {
      matchedVariant = product.variableProducts.find(
        (v: any) =>
          (v.size && String(v.size).toLowerCase() === size.toLowerCase()) ||
          (v.title && String(v.title).toLowerCase() === size.toLowerCase()) ||
          (v.attributes?.size && String(v.attributes.size).toLowerCase() === size.toLowerCase()) ||
          (v.attributes?.title && String(v.attributes.title).toLowerCase() === size.toLowerCase())
      );
    }

    if (matchedVariant) {
      const q = matchedVariant.availableQty ?? matchedVariant.availableQuantity;
      if (q !== undefined && q !== null) {
        return Math.max(0, Math.min(10, Number(q)));
      }
    }
  }

  if (product.tagOk === false) return 0;

  if (product.availableQuantity !== undefined && product.availableQuantity !== null) {
    return Math.max(0, Math.min(10, Number(product.availableQuantity)));
  }

  return product.tagOk ? 10 : 0;
};

/**
 * Determine if a specific bag item (product + variant/size) is out of stock.
 */
export const isBagItemOutOfStock = (
  product?: Product | null,
  variantId?: number | string,
  size?: string
): boolean => {
  if (!product) return false;
  if (isProductOutOfStock(product)) return true;
  return getMaxAvailableQuantity(product, variantId, size) <= 0;
};

/**
 * Determine if the product's showroom is currently closed.
 */
export const isProductStoreClosed = (product: Product, stores?: Record<string, Store>): boolean => {
  if (!stores || !product.sid) return false;
  const store = stores[product.sid];
  return store ? store.isOpen === false : false;
};

/**
 * Calculate the discount percentage of a product.
 */
export const getProductDiscountPercent = (product: Product): number => {
  if (product.mrp > product.price && product.mrp > 0) {
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }
  return 0;
};
