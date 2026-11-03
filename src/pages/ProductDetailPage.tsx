import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useChatStore } from '../stores/useChatStore';
import { useProductsQuery, useProductByIdQuery } from '../api/products.api';
import { useVendorsQuery } from '../api/vendors.api';
import { rupee } from '../utils/formatters';
import { SEO } from '../components/common/SEO';
import { ProductDetailSkeleton, ErrorState } from '../components/common/Skeleton';

export const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { pid: urlPid } = useParams<{ pid: string }>();
  const { pid: storePid, setPid, setSid, go, showToast } = useAppStore();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const effectivePid = urlPid || storePid;

  const { data: allProducts } = useProductsQuery();
  const { data: stores } = useVendorsQuery();
  const { addToBag } = useCartStore();
  const { setActiveChatId } = useChatStore();

  const [activeGal, setActiveGal] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);

  const { data: fetchedProduct, isLoading, isError, refetch } = useProductByIdQuery(effectivePid);
  const product =
    fetchedProduct ||
    (allProducts || []).find((p) => String(p.id) === String(effectivePid));

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/products');
    }
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (isError || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState
          title="Product not found on store shelf"
          message="This showroom product may have been purchased or returned to inventory. Try exploring other items on the floor."
          onRetry={() => refetch()}
        />
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold hover:opacity-90 transition-all"
          >
            Browse all products
          </button>
        </div>
      </div>
    );
  }

  const store = (stores && stores[product.sid]) || Object.values(stores || {})[0];

  const gallery = product.gal && product.gal.length > 0 ? product.gal : [product.img];
  const currentImage = gallery[activeGal] || gallery[0];

  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : [];

  // Related products from same store
  const related = (allProducts || [])
    .filter((p) => p.sid === product.sid && p.id !== product.id)
    .slice(0, 5);

  const handleOpenStore = () => {
    setSid(product.sid);
    go('store', { sid: product.sid });
  };

  const handleAddCurrent = () => {
    const size = sizes.length > 0 ? sizes[selectedSizeIdx] || sizes[0] : '';
    addToBag(product, size);
  };

  const handleAskRep = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setActiveChatId('t1');
    go('chat');
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: gallery,
    description: product.note,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.tagOk ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability',
      seller: {
        '@type': 'Organization',
        name: store?.name || 'Local Showroom',
      },
    },
  };

  return (
    <div className="flex flex-col w-full">
      <SEO
        title={`${product.name} — ${rupee(product.price)} | Yorder`}
        description={`Get ${product.name} from ${store?.name || product.brand}. ${product.stock} in stock. Try 10 minutes at your door before deciding.`}
        canonical={`https://yorder.com/product/${product.id}`}
        ogImage={product.img}
        ogType="product"
        jsonLd={jsonLd}
      />

      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-4 h-[52px] px-4 md:px-[34px] border-b border-[var(--s2)]">
        <div className="flex items-center gap-[14px] min-w-0">
          <button
            onClick={handleBack}
            className="yc text-[14px] text-[var(--t2)] hover:text-[var(--t1)] transition-colors p-1"
            title="Go back"
            aria-label="Go back"
          >
            ←
          </button>
          <span className="font-normal text-[11px] text-[var(--t3)] truncate">
            {product.cat} / {product.brand} / {product.name}
          </span>
        </div>

        {store && (
          <button
            onClick={handleOpenStore}
            className="yc font-medium text-[11px] leading-none tracking-[0.14em] text-[var(--gold)] uppercase hover:underline truncate max-w-[300px]"
          >
            {store.name} · {store.addr}
          </button>
        )}
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px]">
        {/* Left Column: Gallery, Reassurance, Related */}
        <div className="p-4 md:p-[32px_34px] flex flex-col md:flex-row gap-4 md:gap-5">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 w-full md:w-[84px] overflow-x-auto md:overflow-visible flex-shrink-0 order-2 md:order-1">
            {gallery.map((img, idx) => {
              const isSelected = activeGal === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveGal(idx)}
                  className="yc relative aspect-square w-[70px] md:w-full rounded-[12px] overflow-hidden bg-[var(--s1)] flex-shrink-0 transition-all"
                  style={{
                    border: isSelected ? '1px solid var(--gold)' : '1px solid var(--bd)',
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>

          {/* Main Visual Display */}
          <div className="flex-1 flex flex-col gap-4 order-1 md:order-2 min-w-0">
            <div className="relative aspect-[1.1] w-full rounded-[22px] overflow-hidden bg-[var(--s1)] border border-[var(--bd)]">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Shelf Tag Pill */}
              <div className="absolute left-[18px] top-[18px] flex items-center gap-2 px-[13px] py-[7px] rounded-[20px] bg-[#0B0B0C]/70 backdrop-blur-[8px] font-medium text-[9px] tracking-[0.14em] text-[#9BD8A0]">
                ● ON THE SHELF NOW
              </div>
            </div>

            {/* Two Reassurance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-[16px] bg-[var(--s1)] border border-[var(--bd)] flex items-center gap-[14px]">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-[14px] text-[var(--gold)] flex-shrink-0">
                  ▤
                </div>
                <div className="font-normal text-[11px] leading-[1.6] text-[var(--t2)]">
                  {product.note}
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-[var(--s1)] border border-[var(--bd)] flex items-center gap-[14px]">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-[14px] text-[var(--gold)] flex-shrink-0">
                  ↺
                </div>
                <div className="font-normal text-[11px] leading-[1.6] text-[var(--t2)]">
                  Try at your door. The rider waits ten minutes; nothing is charged until you keep it.
                </div>
              </div>
            </div>

            {/* Also on this Shelf */}
            {related.length > 0 && (
              <div className="pt-4">
                <h3 className="font-semibold text-[15px] text-[var(--t1)] mb-4">
                  Also on this shelf
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                  {related.map((rp) => (
                    <div
                      key={rp.id}
                      onClick={() => {
                        setPid(rp.id);
                        go('product', { pid: rp.id });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="yc flex flex-col cursor-pointer group"
                    >
                      <div className="aspect-square rounded-[14px] overflow-hidden bg-[var(--s1)] border border-[var(--bd)] group-hover:border-[var(--gold)] transition-colors">
                        <img
                          src={rp.img}
                          alt={rp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="font-medium text-[11px] leading-[1.4] text-[var(--t2)] group-hover:text-[var(--t1)] mt-[10px] line-clamp-1">
                        {rp.name}
                      </div>
                      <div className="font-semibold text-[12px] text-[var(--t1)] mt-[7px]">
                        {rupee(rp.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Purchasing Column */}
        <aside className="p-6 md:p-[32px_28px_36px] border-t lg:border-t-0 lg:border-l border-[var(--s2)] flex flex-col justify-start">
          <div className="font-medium text-[9.5px] leading-none tracking-[0.16em] text-[var(--gold)] uppercase">
            {product.brand}
          </div>
          <h1 className="font-semibold text-[26px] md:text-[30px] leading-[1.15] tracking-[-0.03em] text-[var(--t1)] mt-[14px]">
            {product.name}
          </h1>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 mt-4">
            <span className="font-semibold text-[26px] leading-none tracking-[-0.02em] text-[var(--t1)]">
              {rupee(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="font-normal text-[13px] text-[var(--t4)] line-through">
                {rupee(product.mrp)}
              </span>
            )}
            <span className="font-medium text-[11px] text-[var(--ok)]">
              {product.off}
            </span>
          </div>

          <div className="h-[1px] bg-[var(--s2)] my-[26px]" />

          {/* Sizes */}
          <div className="flex items-baseline justify-between mb-[14px]">
            <div className="font-semibold text-[13.5px] text-[var(--t1)]">
              {sizes.length > 0 ? 'Select size' : 'One variant on this shelf'}
            </div>
            <button
              onClick={() => showToast('Standard UK/US sizing applies.')}
              className="yc font-medium text-[11px] text-[var(--gold)] hover:underline"
            >
              Size guide
            </button>
          </div>

          {sizes.length > 0 ? (
            <div className="grid grid-cols-4 gap-[10px]">
              {sizes.map((sz, idx) => {
                const isSelected = selectedSizeIdx === idx;
                const isOutOfStock = idx === 3;
                return (
                  <button
                    key={sz}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSizeIdx(idx)}
                    className="yc h-[58px] rounded-[13px] flex flex-col items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: isSelected ? 'var(--acc)' : 'transparent',
                      border: isSelected ? 'none' : isOutOfStock ? '1px solid var(--s2)' : '1px solid var(--bd)',
                      opacity: isOutOfStock ? 0.55 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span
                      className="font-semibold text-[13px] leading-none"
                      style={{
                        color: isSelected ? 'var(--on-acc)' : isOutOfStock ? 'var(--t3)' : 'var(--t1)',
                      }}
                    >
                      {sz}
                    </span>
                    <span className="font-normal text-[9px] leading-none text-[var(--t3)]">
                      In stock
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3.5 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] text-xs text-[var(--t2)]">
              Standard size available. Ready for immediate dispatch.
            </div>
          )}

          {/* Real On-Demand Showroom Dispatch */}
          <div className="p-[16px_18px] rounded-[16px] bg-[var(--s1)] border border-[var(--bd)] mt-[24px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
                <span className="font-semibold text-[13px] text-[var(--t1)]">
                  Instant Showroom Dispatch
                </span>
              </div>
              <span className="font-medium text-[11px] text-[var(--ok)] bg-[var(--ok)]/10 px-2 py-0.5 rounded-full border border-[var(--ok)]/20">
                Free Trial
              </span>
            </div>
            <div className="text-[11.5px] text-[var(--t2)] mt-2 leading-[1.5]">
              Dispatched directly from <span className="text-[var(--gold)] font-medium">{store?.name || product.brand}</span>. Rider waits while you try it on.
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--bd)] text-[10.5px] text-[var(--t3)] font-mono">
              <span>⏱ {store?.eta || '45 min'}</span>
              <span>·</span>
              <span>📍 {store?.addr || 'Bandra West'}</span>
              <span>·</span>
              <span>🚪 Try at door</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 mt-[26px]">
            <button
              onClick={handleAddCurrent}
              className="yc flex-1 h-[48px] rounded-[24px] bg-[var(--acc)] flex items-center justify-center gap-2.5 shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="font-semibold text-[13px] text-[var(--on-acc)]">
                Add to bag
              </span>
              <span className="font-medium text-[11.5px] text-[var(--t3)]">
                {rupee(product.price)}
              </span>
            </button>
            <button
              onClick={handleAskRep}
              className="yc h-[48px] px-[22px] rounded-[24px] border border-[var(--bdw)] flex items-center font-semibold text-[12.5px] text-[var(--tw)] hover:bg-[var(--sw)] active:scale-95 transition-all flex-shrink-0"
            >
              Ask the shop
            </button>
          </div>

          {/* Rep Assurance */}
          {store && (
            <div className="mt-[22px] p-4 rounded-[16px] bg-[var(--s0)] border border-[var(--bd)] flex items-center gap-[13px]">
              <div className="relative w-[38px] h-[38px] rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center font-medium text-[12px] text-[var(--tw)] flex-shrink-0">
                {store.repIni}
                <span className="absolute right-0 bottom-0 w-[10px] h-[10px] rounded-full bg-[var(--ok)] border-2 border-[var(--s0)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[12px] text-[var(--t1)] truncate">
                  {store.repName} can hold this
                </div>
                <div className="font-normal text-[10px] text-[var(--t3)] mt-[6px]">
                  One hour, no card needed
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
