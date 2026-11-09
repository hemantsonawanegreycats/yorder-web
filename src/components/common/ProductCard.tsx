import React, { useState } from 'react';
import { Product, Store } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useCartStore } from '../../stores/useCartStore';
import { useVendorsQuery } from '../../api/vendors.api';
import { rupee } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  store?: Store;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, store }) => {
  const { go, setPid, setSid, showToast } = useAppStore();
  const addToBag = useCartStore((s) => s.addToBag);
  const [imgError, setImgError] = useState(false);
  const { data: stores } = useVendorsQuery();

  const currentStore = store || (stores && product.sid ? stores[product.sid] : undefined);
  const isStoreClosed = currentStore ? currentStore.isOpen === false : false;

  const isOutOfStock = (() => {
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
  })();

  const hasMultipleVariants = Array.isArray(product.variableProducts) && product.variableProducts.length > 1;

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
    if (isStoreClosed) {
      showToast(`${currentStore?.name || 'Showroom'} is currently closed.`);
      handleOpenProduct();
      return;
    }
    if (hasMultipleVariants) {
      handleOpenProduct();
      return;
    }
    addToBag(product);
  };

  const storeName = currentStore?.name || product.brand || 'Local Showroom';
  const storeRating = currentStore?.rating || product.rating || '4.8';
  const etaText = currentStore
    ? isStoreClosed
      ? (currentStore.hours || 'Store Closed')
      : `${currentStore.eta} · ${currentStore.dist}`
    : 'Today · 1.5 km';

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
            isOutOfStock ? 'opacity-50 grayscale' : isStoreClosed ? 'opacity-70 grayscale-[20%]' : ''
          }`}
          loading="lazy"
        />

        {/* Out of Stock, Store Closed, or Off Badge */}
        {isOutOfStock ? (
          <div className="absolute left-[7px] top-[7px] px-[7px] py-[3.5px] rounded-[6px] bg-[#EF4444] font-bold text-[8px] tracking-wider leading-none text-white shadow-md uppercase">
            Sold Out
          </div>
        ) : isStoreClosed ? (
          <div className="absolute left-[7px] top-[7px] px-[7px] py-[3.5px] rounded-[6px] bg-[#0B0B0C]/90 backdrop-blur-md font-semibold text-[7.5px] tracking-wider leading-none text-neutral-300 border border-white/15 shadow-sm uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            Closed
          </div>
        ) : product.off ? (
          <div className="absolute left-[7px] top-[7px] px-[6px] py-[3px] rounded-[6px] bg-[#0B0B0C]/85 backdrop-blur-md font-medium text-[8px] leading-none text-[var(--gold)] border border-white/10 shadow-sm">
            {product.off}
          </div>
        ) : null}

        {/* Quick Add Button, Closed indicator, or Out of Stock indicator */}
        {isOutOfStock ? (
          <button
            disabled={true}
            onClick={(e) => e.stopPropagation()}
            title="Out of stock"
            aria-label="Out of stock"
            className="absolute right-[7px] bottom-[7px] px-[8px] py-[4px] rounded-full bg-black/85 backdrop-blur-sm text-[8px] font-semibold uppercase tracking-wider text-[#EF4444] border border-[#EF4444]/40 cursor-not-allowed shadow-sm select-none"
          >
            Out of stock
          </button>
        ) : isStoreClosed ? (
          <button
            onClick={handleAdd}
            title={`${currentStore?.name || 'Showroom'} is currently closed · Click to view details & contact rep`}
            aria-label="Store closed"
            className="yc absolute right-[7px] bottom-[7px] px-[8px] py-[4px] rounded-full bg-[#1A1918]/90 backdrop-blur-sm text-[8px] font-medium uppercase tracking-wider text-neutral-300 border border-white/15 hover:border-[var(--gold)] hover:text-white transition-all shadow-sm select-none"
          >
            Store Closed
          </button>
        ) : (
          <button
            onClick={handleAdd}
            title={hasMultipleVariants ? 'Select options' : 'Add to bag'}
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
      <div className={`text-[9px] font-normal leading-none mt-[4px] truncate ${isStoreClosed ? 'text-neutral-400 font-medium' : 'text-[var(--t3)]'}`}>
        {etaText}
      </div>
    </div>
  );
};
