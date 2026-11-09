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
