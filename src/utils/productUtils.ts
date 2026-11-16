import { Product, Store } from '../types';

/**
 * Determine if a product is out of stock.
 * Mirrors the mobile app: stock is only enforced when the vendor manages inventory
 * (`is_vendor_manage_inventory`). Otherwise the product is always purchasable.
 */
export const isProductOutOfStock = (product: Product): boolean => {
  if (!product) return true;
  if (!product.isVendorManageInventory) return false;
  if (Array.isArray(product.variableProducts) && product.variableProducts.length > 0) {
    return product.variableProducts.every((v) => {
      const q = v?.availableQty ?? v?.availableQuantity;
      return Number(q ?? 0) <= 0;
    });
  }
  return Number(product.availableQuantity ?? 0) <= 0;
};

/**
 * Get the maximum available stock quantity for a specific product / variant in the bag (capped at 10).
 * Like the mobile app, stock limits only apply when the vendor manages inventory.
 */
export const getMaxAvailableQuantity = (
  product?: Product | null,
  variantId?: number | string,
  size?: string
): number => {
  if (!product) return 10;
  if (!product.isVendorManageInventory) return 10;

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
      return Math.max(0, Math.min(10, Number(q ?? 0)));
    }
  }

  if (product.availableQuantity !== undefined && product.availableQuantity !== null) {
    return Math.max(0, Math.min(10, Number(product.availableQuantity)));
  }

  return product.tagOk === false ? 0 : 10;
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
