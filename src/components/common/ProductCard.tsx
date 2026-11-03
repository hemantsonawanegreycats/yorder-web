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
        className="yc relative aspect-[0.92] w-full rounded-[16px] overflow-hidden bg-[var(--s1)] border border-[var(--bd)] group-hover:border-[var(--bd2)] transition-all cursor-pointer"
      >
        <img
          src={imgError ? 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=70' : product.img}
          alt={product.name}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Off Badge */}
        {product.off && (
          <div className="absolute left-[11px] top-[11px] px-[9px] py-[5px] rounded-[11px] bg-[var(--bg)]/90 backdrop-blur-md font-medium text-[9px] leading-none text-[var(--gold)] border border-[var(--bdw)]">
            {product.off}
          </div>
        )}

        {/* Quick Add Button */}
        <button
          onClick={handleAdd}
          title="Add to bag"
          aria-label={`Add ${product.name} to bag`}
          className="yc absolute right-[10px] bottom-[10px] w-[34px] h-[34px] rounded-full bg-[var(--bg)] shadow-md border border-[var(--bd)] flex items-center justify-center font-normal text-[18px] leading-none text-[var(--t1)] hover:bg-[var(--acc)] hover:text-[var(--on-acc)] active:scale-95 transition-all"
        >
          +
        </button>
      </div>

      {/* Store & Rating */}
      <div className="flex items-center gap-[6px] mt-[13px] mb-[7px]">
        <button
          onClick={handleGoStore}
          className="yc text-[10px] font-normal leading-none text-[var(--t3)] hover:text-[var(--t1)] truncate max-w-[150px]"
        >
          {storeName}
        </button>
        <span className="text-[10px] font-medium leading-none text-[var(--gold)]">
          ★ {storeRating}
        </span>
      </div>

      {/* Product Title */}
      <button
        onClick={handleOpenProduct}
        className="yc text-[12.5px] font-medium leading-[1.4] text-[var(--t1)] hover:text-[var(--gold)] text-left line-clamp-1 transition-colors"
      >
        {product.name}
      </button>

      {/* Prices */}
      <div className="flex items-baseline gap-2 mt-[9px]">
        <span className="font-semibold text-[14px] leading-none text-[var(--t1)]">
          {rupee(product.price)}
        </span>
        {product.mrp > product.price && (
          <span className="font-normal text-[11px] leading-none text-[var(--t4)] line-through">
            {rupee(product.mrp)}
          </span>
        )}
      </div>

      {/* ETA Subtitle */}
      <div className="text-[10px] font-normal leading-none text-[var(--t3)] mt-[8px]">
        {etaText}
      </div>
    </div>
  );
};
