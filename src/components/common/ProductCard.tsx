import React, { useState } from 'react';
import { Product, Store } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useCartStore } from '../../stores/useCartStore';
import { rupee } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  store?: Store;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, store }) => {
  const { go, setPid, setSid } = useAppStore();
  const addToBag = useCartStore((s) => s.addToBag);
  const [imgError, setImgError] = useState(false);

  const isOutOfStock = (() => {
    if (product.isVendorManageInventory === false) return false;
    if (Array.isArray(product.variableProducts) && product.variableProducts.length > 0) {
      return product.variableProducts.every((v) => {
        const q =
          typeof v.availableQty === 'number'
            ? v.availableQty
            : typeof v.availableQuantity === 'number'
            ? v.availableQuantity
            : undefined;
        return q !== undefined ? q <= 0 : !product.tagOk;
      });
    }
    return !product.tagOk;
  })();

  const handleOpenProduct = () => {
    setPid(product.id);
    go('product', { pid: product.id });
  };

  const handleGoStore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.sid) {
      setSid(product.sid);
      go('store', { sid: product.sid });
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToBag(product);
  };

  const storeName = store?.name || product.brand || 'Local Showroom';
  const storeRating = store?.rating || product.rating || '4.8';
  const etaText = store ? `${store.eta} · ${store.dist}` : 'Today · 1.5 km';

  return (
    <div className="group flex flex-col w-full text-left">
      {/* Thumbnail Card Container */}
      <div
        onClick={handleOpenProduct}
        className="yc relative aspect-square max-h-[200px] w-full rounded-[12px] overflow-hidden bg-white border border-[var(--bd)] group-hover:border-[var(--gold)] transition-all cursor-pointer flex items-center justify-center p-2.5"
      >
        <img
          src={imgError ? 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=70' : product.img}
          alt={product.name}
          onError={() => setImgError(true)}
          className={`max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-300 ${
            isOutOfStock ? 'opacity-65 grayscale-[25%]' : ''
          }`}
          loading="lazy"
        />

        {/* Out of Stock or Off Badge */}
        {isOutOfStock ? (
          <div className="absolute left-[7px] top-[7px] px-[6px] py-[3px] rounded-[6px] bg-[#EF4444]/90 backdrop-blur-md font-semibold text-[7.5px] tracking-wider leading-none text-white border border-[#EF4444]/30 shadow-sm uppercase">
            Sold Out
          </div>
        ) : product.off ? (
          <div className="absolute left-[7px] top-[7px] px-[6px] py-[3px] rounded-[6px] bg-[#0B0B0C]/85 backdrop-blur-md font-medium text-[8px] leading-none text-[var(--gold)] border border-white/10 shadow-sm">
            {product.off}
          </div>
        ) : null}

        {/* Quick Add Button or Out of Stock indicator */}
        {isOutOfStock ? (
          <div
            title="Currently out of stock"
            className="absolute right-[7px] bottom-[7px] px-[7px] py-[3px] rounded-[6px] bg-black/75 backdrop-blur-sm text-[7.5px] font-medium uppercase tracking-wider text-neutral-400 border border-white/10"
          >
            Out of stock
          </div>
        ) : (
          <button
            onClick={handleAdd}
            title="Add to bag"
            aria-label={`Add ${product.name} to bag`}
            className="yc absolute right-[7px] bottom-[7px] w-[28px] h-[28px] rounded-full bg-[#0B0B0C] shadow-md border border-white/10 flex items-center justify-center font-normal text-[15px] leading-none text-white hover:bg-[var(--gold)] hover:text-black active:scale-95 transition-all"
          >
            +
          </button>
        )}
      </div>

      {/* Store & Rating */}
      <div className="flex items-center gap-[4px] mt-[8px] mb-[3px]">
        <button
          onClick={handleGoStore}
          className="yc text-[9.5px] font-normal leading-none text-[var(--t3)] hover:text-[var(--t1)] truncate max-w-[120px]"
        >
          {storeName}
        </button>
        <span className="text-[9px] font-medium leading-none text-[var(--gold)]">
          ★ {storeRating}
        </span>
      </div>

      {/* Product Title */}
      <button
        onClick={handleOpenProduct}
        className="yc text-[11.5px] font-medium leading-[1.3] text-[var(--t1)] hover:text-[var(--gold)] text-left line-clamp-1 transition-colors"
      >
        {product.name}
      </button>

      {/* Prices */}
      <div className="flex items-baseline gap-1.5 mt-[4px]">
        <span className="font-semibold text-[13px] leading-none text-[var(--t1)]">
          {rupee(product.price)}
        </span>
        {product.mrp > product.price && (
          <span className="font-normal text-[10px] leading-none text-[var(--t4)] line-through">
            {rupee(product.mrp)}
          </span>
        )}
      </div>

      {/* ETA Subtitle */}
      <div className="text-[9px] font-normal leading-none text-[var(--t3)] mt-[4px]">
        {etaText}
      </div>
    </div>
  );
};
