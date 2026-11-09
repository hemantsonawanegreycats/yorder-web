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

  const isFashionProduct = /fashion|apparel|clothing|shoes|footwear|sneakers|streetwear|t-shirt|shirt|shorts|hoodie|sweatpant/i.test(
    `${product.cat} ${product.name}`
  );
  const showSizeGuide = isFashionProduct && sizes.length > 0;

  // Related products from same store
  const related = (allProducts || [])
    .filter((p) => p.sid === product.sid && p.id !== product.id)
    .slice(0, 5);

  const handleOpenStore = () => {
    setSid(product.sid);
    go('store', { sid: product.sid });
  };

  const handleAddCurrent = () => {
    if (isCurrentOutOfStock) {
      showToast('This item is currently out of stock.');
      return;
    }
    const size = sizes.length > 0 ? sizes[selectedSizeIdx] || sizes[0] : '';
    const vp = product.variableProducts?.[selectedSizeIdx];
    addToBag(product, size, vp?.id);
  };

  const activeVariant = product.variableProducts?.[selectedSizeIdx];
  const activePrice = Number(activeVariant?.sellPrice ?? activeVariant?.price ?? product.price);
  const activeMrp = Number(activeVariant?.price ?? activeVariant?.sellPrice ?? product.mrp);

  const getVariantQty = (v: any): number | undefined => {
    if (!v) return undefined;
    if (typeof v.availableQty === 'number') return v.availableQty;
    if (typeof v.availableQuantity === 'number') return v.availableQuantity;
    return undefined;
  };

  const isVariantOutOfStock = (v: any): boolean => {
    if (product.isVendorManageInventory === false) return false;
    const qty = getVariantQty(v);
    if (qty !== undefined) {
      return qty <= 0;
    }
    return !product.tagOk;
  };

  const isCurrentOutOfStock = activeVariant
    ? isVariantOutOfStock(activeVariant)
    : !product.tagOk;

  const handleAskRep = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    const vendorParam = product.sid ? `?vendorId=${product.sid}` : '';
    navigate(`/chat${vendorParam}`);
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
      <div className="border-b border-[var(--s2)] bg-[var(--bg)]">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4 h-[48px] px-4 md:px-8">
          <div className="flex items-center gap-[12px] min-w-0">
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
              className="yc font-medium text-[10.5px] leading-none tracking-[0.14em] text-[var(--gold)] uppercase hover:underline truncate max-w-[300px]"
            >
              {store.name} · {store.addr}
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="max-w-[1100px] mx-auto w-full px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_370px] xl:grid-cols-[minmax(0,1fr)_390px] gap-6 lg:gap-8 items-start">
          {/* Left Column: Gallery, Reassurance, Related */}
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Thumbnails (Only show if multiple images exist) */}
              {gallery.length > 1 && (
                <div className="flex md:flex-col gap-2 w-full md:w-[60px] overflow-x-auto md:overflow-visible flex-shrink-0 order-2 md:order-1">
                  {gallery.map((img, idx) => {
                    const isSelected = activeGal === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveGal(idx)}
                        className="yc relative aspect-square w-[52px] md:w-full rounded-[8px] overflow-hidden bg-white flex-shrink-0 transition-all p-1 flex items-center justify-center shadow-xs"
                        style={{
                          border: isSelected ? '1.5px solid var(--gold)' : '1px solid var(--bd)',
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main Visual Display - Compact, White Background, Never Oversized */}
              <div className="flex-1 flex flex-col gap-3 order-1 md:order-2 min-w-0">
                <div className="relative aspect-square max-h-[360px] md:max-h-[380px] w-full rounded-[16px] overflow-hidden bg-white border border-[var(--bd)] flex items-center justify-center p-4">
                  <img
                    src={currentImage}
                    alt={product.name}
                    className={`max-h-[92%] max-w-[92%] object-contain transition-opacity ${
                      isCurrentOutOfStock ? 'opacity-75 grayscale-[20%]' : ''
                    }`}
                  />
                  {/* Shelf Tag Pill */}
                  {isCurrentOutOfStock ? (
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[14px] bg-[#0B0B0C]/85 backdrop-blur-[8px] font-medium text-[8px] tracking-[0.12em] text-[#EF4444] border border-[#EF4444]/30 shadow-sm">
                      ○ CURRENTLY OUT OF STOCK
                    </div>
                  ) : (
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[14px] bg-[#0B0B0C]/85 backdrop-blur-[8px] font-medium text-[8px] tracking-[0.12em] text-[#9BD8A0] border border-white/10 shadow-sm">
                      ● ON THE SHELF NOW
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Two Reassurance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] flex items-center gap-2.5">
                <div className="w-[28px] h-[28px] rounded-[8px] bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-[12px] text-[var(--gold)] flex-shrink-0">
                  ▤
                </div>
                <div className="font-normal text-[10.5px] leading-[1.45] text-[var(--t2)] line-clamp-2">
                  {product.note}
                </div>
              </div>

              <div className="p-3 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] flex items-center gap-2.5">
                <div className="w-[28px] h-[28px] rounded-[8px] bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-[12px] text-[var(--gold)] flex-shrink-0">
                  ↺
                </div>
                <div className="font-normal text-[10.5px] leading-[1.45] text-[var(--t2)]">
                  Try at your door. The rider waits ten minutes; nothing is charged until you keep it.
                </div>
              </div>
            </div>

            {/* Also on this Shelf */}
            {related.length > 0 && (
              <div className="pt-2">
                <h3 className="font-semibold text-[14px] text-[var(--t1)] mb-3">
                  Also on this shelf
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                      <div className="aspect-square rounded-[12px] overflow-hidden bg-white border border-[var(--bd)] group-hover:border-[var(--gold)] transition-colors p-1.5 flex items-center justify-center">
                        <img
                          src={rp.img}
                          alt={rp.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="font-medium text-[10.5px] leading-[1.35] text-[var(--t2)] group-hover:text-[var(--t1)] mt-[7px] line-clamp-1">
                        {rp.name}
                      </div>
                      <div className="font-semibold text-[11.5px] text-[var(--t1)] mt-[4px]">
                        {rupee(rp.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Purchasing Column */}
          <aside className="lg:sticky lg:top-[76px] flex flex-col justify-start">
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--gold)] uppercase">
              {product.brand}
            </div>
            <h1 className="font-semibold text-[22px] md:text-[24px] leading-[1.2] tracking-[-0.025em] text-[var(--t1)] mt-2.5">
              {product.name}
            </h1>

            {/* Pricing */}
            <div className="flex items-baseline gap-2.5 mt-2.5">
              <span className="font-semibold text-[20px] md:text-[22px] leading-none tracking-[-0.02em] text-[var(--t1)]">
                {rupee(activePrice)}
              </span>
              {activeMrp > activePrice && (
                <span className="font-normal text-[11.5px] text-[var(--t4)] line-through">
                  {rupee(activeMrp)}
                </span>
              )}
              <span className="font-medium text-[10px] text-[var(--ok)]">
                {product.off}
              </span>
            </div>

            {/* Sizes / Variants (Only shown if real variants exist) */}
            {sizes.length > 0 && (
              <>
                <div className="h-[1px] bg-[var(--s2)] my-3.5" />
                <div className="flex items-baseline justify-between mb-2">
                  <div className="font-semibold text-[12px] text-[var(--t1)]">
                    Select {isFashionProduct ? 'size' : 'option'}
                  </div>
                  {showSizeGuide && (
                    <button
                      onClick={() => showToast('Standard UK/US sizing applies.')}
                      className="yc font-medium text-[10px] text-[var(--gold)] hover:underline"
                    >
                      Size guide
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {sizes.map((sz, idx) => {
                    const isSelected = selectedSizeIdx === idx;
                    const vp = product.variableProducts?.[idx];
                    const isVariantOut = isVariantOutOfStock(vp);
                    return (
                      <button
                        key={`${sz}-${idx}`}
                        onClick={() => setSelectedSizeIdx(idx)}
                        className="yc h-[44px] rounded-[9px] flex flex-col items-center justify-center gap-0.5 transition-all"
                        style={{
                          background: isSelected ? 'var(--acc)' : 'transparent',
                          border: isSelected
                            ? 'none'
                            : isVariantOut
                            ? '1px solid var(--s2)'
                            : '1px solid var(--bd)',
                          opacity: isVariantOut && !isSelected ? 0.6 : 1,
                        }}
                      >
                        <span
                          className="font-semibold text-[11.5px] leading-none"
                          style={{
                            color: isSelected ? 'var(--on-acc)' : isVariantOut ? 'var(--t3)' : 'var(--t1)',
                          }}
                        >
                          {sz}
                        </span>
                        <span
                          className="font-normal text-[8px] leading-none"
                          style={{
                            color: isSelected ? 'var(--on-acc)' : isVariantOut ? '#EF4444' : 'var(--t3)',
                          }}
                        >
                          {isVariantOut ? 'Out of stock' : 'In stock'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Real On-Demand Showroom Dispatch / Out of stock indicator */}
            {isCurrentOutOfStock ? (
              <div className="p-3.5 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span className="font-semibold text-[12.5px] text-[var(--t1)]">
                      Currently Sold Out on Floor
                    </span>
                  </div>
                  <span className="font-medium text-[10px] text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/20">
                    Out of Stock
                  </span>
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-1.5 leading-[1.5]">
                  This item is currently out of stock at <span className="text-[var(--gold)] font-medium">{store?.name || product.brand}</span>. You can chat with the showroom rep below to enquire about restock.
                </div>
                <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-[var(--bd)] text-[10px] text-[var(--t3)] font-mono">
                  <span>📍 {store?.addr || 'Bandra West'}</span>
                  <span>·</span>
                  <span>💬 Showroom chat available</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
                    <span className="font-semibold text-[12.5px] text-[var(--t1)]">
                      Instant Showroom Dispatch
                    </span>
                  </div>
                  <span className="font-medium text-[10px] text-[var(--ok)] bg-[var(--ok)]/10 px-2 py-0.5 rounded-full border border-[var(--ok)]/20">
                    {isFashionProduct ? 'Free Trial' : 'Verified Stock'}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--t2)] mt-1.5 leading-[1.5]">
                  Dispatched directly from <span className="text-[var(--gold)] font-medium">{store?.name || product.brand}</span>.{' '}
                  {isFashionProduct
                    ? 'Rider waits while you try it on.'
                    : 'Delivered directly from the showroom floor.'}
                </div>
                <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-[var(--bd)] text-[10px] text-[var(--t3)] font-mono">
                  <span>⏱ {store?.eta || '45 min'}</span>
                  <span>·</span>
                  <span>📍 {store?.addr || 'Bandra West'}</span>
                  <span>·</span>
                  <span>🚪 {isFashionProduct ? 'Try at door' : 'Doorstep delivery'}</span>
                </div>
              </div>
            )}

            {/* Action CTAs */}
            <div className="flex items-center gap-2.5 mt-4">
              <button
                disabled={isCurrentOutOfStock}
                onClick={handleAddCurrent}
                className="yc flex-1 h-[44px] rounded-[22px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isCurrentOutOfStock ? 'var(--s2)' : 'var(--acc)',
                  color: isCurrentOutOfStock ? 'var(--t3)' : 'var(--on-acc)',
                }}
              >
                <span className="font-semibold text-[12.5px]">
                  {isCurrentOutOfStock ? 'Out of stock' : 'Add to bag'}
                </span>
                {!isCurrentOutOfStock && (
                  <span className="font-medium text-[11px] opacity-80">
                    {rupee(activePrice)}
                  </span>
                )}
              </button>
              <button
                onClick={handleAskRep}
                className="yc h-[44px] px-4 rounded-[22px] border border-[var(--bdw)] flex items-center font-semibold text-[12px] text-[var(--tw)] hover:bg-[var(--sw)] active:scale-95 transition-all flex-shrink-0"
              >
                Ask the shop
              </button>
            </div>

            {/* Rep Assurance */}
            {store && (
              <div className="mt-3.5 p-3 rounded-[14px] bg-[var(--s0)] border border-[var(--bd)] flex items-center gap-2.5">
                <div className="relative w-[34px] h-[34px] rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center font-medium text-[11px] text-[var(--tw)] flex-shrink-0">
                  {store.repIni}
                  <span
                    className={`absolute right-0 bottom-0 w-[8px] h-[8px] rounded-full border-2 border-[var(--s0)] ${
                      isCurrentOutOfStock ? 'bg-[var(--t3)]' : 'bg-[var(--ok)]'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[11.5px] text-[var(--t1)] truncate">
                    {isCurrentOutOfStock
                      ? `Ask ${store.repName} about restock`
                      : `${store.repName} can hold this`}
                  </div>
                  <div className="font-normal text-[9.5px] text-[var(--t3)] mt-0.5">
                    {isCurrentOutOfStock ? 'Chat directly with floor rep' : 'One hour, no card needed'}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
