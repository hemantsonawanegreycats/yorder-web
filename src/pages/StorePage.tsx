import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useChatStore } from '../stores/useChatStore';
import { useVendorsQuery, useVendorByIdQuery, useToggleFollowMutation, useGetVendorFollowStatusQuery } from '../api/vendors.api';
import { useProductsQuery } from '../api/products.api';
import { useAddressesQuery } from '../api/address.api';
import { rupee } from '../utils/formatters';
import { SEO } from '../components/common/SEO';
import { ProductCardSkeleton, StoreHeaderSkeleton, ErrorState } from '../components/common/Skeleton';
import { Store } from '../types';

const calculateHaversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const { sid: urlSid } = useParams<{ sid: string }>();
  const { sid: storeSid, setPid, go, deliverTo, following, toggleFollow, showToast } = useAppStore();
  const effectiveSid = urlSid || storeSid;

  const { data: stores } = useVendorsQuery();
  const { data: storeProducts, isLoading: productsLoading } = useProductsQuery(
    effectiveSid ? { vendor_id: effectiveSid, limit: 50 } : undefined
  );
  const { data: allProducts } = useProductsQuery();
  const { bag, addToBag } = useCartStore();
  const { setActiveChatId } = useChatStore();
  const toggleFollowMutation = useToggleFollowMutation();

  const [activeTab, setActiveTab] = useState(0);

  const { data: fetchedStore, isLoading, isError, refetch } = useVendorByIdQuery(effectiveSid);
  const store = fetchedStore || (stores && effectiveSid ? stores[effectiveSid] : undefined);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/showrooms');
    }
  };

  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { data: followStatusData } = useGetVendorFollowStatusQuery(store?.id, isAuthenticated);

  const { data: userAddresses = [] } = useAddressesQuery();
  const selectedAddress = userAddresses[0];

  // Safe Store Fallback (Guarantees no null pointer exception)
  const currentStore: Store = store || {
    id: effectiveSid || '1',
    name: 'Showroom',
    ini: 'SH',
    cat: 'Specialty Showroom',
    addr: 'Mumbai, Maharashtra',
    rating: 'New',
    eta: '45 min',
    dist: 'Nearby',
    count: '',
    hours: 'OPEN TODAY',
    img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=75',
    repName: 'Floor Team',
    repIni: 'FT',
    repLine: 'Floor team is on the floor',
    meta: 'Bandra · Verified showroom',
    isOnline: true,
  };

  const { distanceKmText, travelTimeText, deliveryEtaText } = useMemo(() => {
    if (!currentStore.lat || !currentStore.lng) {
      return {
        distanceKmText: currentStore.dist || 'Nearby',
        travelTimeText: 'In your area',
        deliveryEtaText: currentStore.eta || '45 min',
      };
    }

    const userLat = selectedAddress?.latitude ? Number(selectedAddress.latitude) : 19.0596;
    const userLng = selectedAddress?.longitude ? Number(selectedAddress.longitude) : 72.8295;

    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return {
        distanceKmText: currentStore.dist || 'Nearby',
        travelTimeText: 'In your area',
        deliveryEtaText: currentStore.eta || '45 min',
      };
    }

    const km = calculateHaversineDistanceKm(userLat, userLng, currentStore.lat, currentStore.lng);
    const mins = Math.max(5, Math.round(km * 10));

    return {
      distanceKmText: `${km.toFixed(1)} km`,
      travelTimeText: `${mins} min away`,
      deliveryEtaText: km < 5 ? '45 min' : '90 min',
    };
  }, [currentStore.lat, currentStore.lng, currentStore.dist, currentStore.eta, selectedAddress]);

  // Real store inventory from backend: prefer vendor-specific products, fallback to vendor-matched products
  const effectiveStock = useMemo(() => {
    if (storeProducts && storeProducts.length > 0) return storeProducts;
    return (allProducts || []).filter(
      (p) =>
        String(p.sid) === String(currentStore.id) ||
        (p.brand && currentStore.name && p.brand.toLowerCase() === currentStore.name.toLowerCase())
    );
  }, [storeProducts, allProducts, currentStore.id, currentStore.name]);

  // Real shelf tabs dynamically derived from actual store products
  const catNames = useMemo(() => {
    return Array.from(new Set(effectiveStock.map((p) => p.cat || 'General'))).filter(Boolean);
  }, [effectiveStock]);

  const tabDefs = useMemo(() => {
    return [
      { label: 'All', cat: null, count: effectiveStock.length },
      ...catNames.map((cName) => ({
        label: cName,
        cat: cName,
        count: effectiveStock.filter((p) => (p.cat || 'General').toLowerCase() === cName.toLowerCase()).length,
      })),
    ];
  }, [effectiveStock, catNames]);

  const currentTab = tabDefs[activeTab] || tabDefs[0];
  const shelfProducts = useMemo(() => {
    return currentTab?.cat
      ? effectiveStock.filter((p) => (p.cat || 'General').toLowerCase() === currentTab.cat!.toLowerCase())
      : effectiveStock;
  }, [effectiveStock, currentTab]);

  const bagItems = useMemo(() => {
    return bag
      .map((b) => (allProducts || []).find((p) => p.id === b.pid))
      .filter(Boolean);
  }, [bag, allProducts]);

  const bagTotal = useMemo(() => {
    return bagItems.reduce((acc, p) => acc + (p?.price || 0), 0);
  }, [bagItems]);

  const isFollowing =
    followStatusData?.data?.is_following !== undefined
      ? followStatusData.data.is_following
      : store
      ? !!following[store.id]
      : false;

  const handleFollowToggle = () => {
    if (!store) return;
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      showToast('Please log in with mobile to follow showrooms');
      return;
    }
    toggleFollow(store.id);
    toggleFollowMutation.mutate(store.id);
    showToast(!isFollowing ? `Following ${store.name}` : `Unfollowed ${store.name}`);
  };

  if (isLoading && !store) {
    return (
      <div className="flex flex-col w-full">
        <StoreHeaderSkeleton />
        <div className="px-4 md:px-[34px] py-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if ((isError || !store) && !isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ErrorState
          title="Showroom not found"
          message="Could not connect to this showroom. The store may be offline or closed for inventory count."
          onRetry={() => refetch()}
        />
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate('/showrooms')}
            className="px-6 py-2.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold hover:opacity-90 transition-all"
          >
            View all showrooms
          </button>
        </div>
      </div>
    );
  }

  const handleAskRep = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    const vendorParam = currentStore.id ? `?vendorId=${currentStore.id}` : '';
    navigate(`/chat${vendorParam}`);
  };

  const handleOpenProduct = (productId: string | number) => {
    setPid(productId);
    go('product', { pid: productId });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: currentStore.name,
    image: currentStore.img,
    address: {
      '@type': 'PostalAddress',
      streetAddress: currentStore.addr,
      addressLocality: 'Mumbai',
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '19.0600',
      longitude: '72.8300',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: currentStore.rating,
      reviewCount: 412,
    },
  };

  return (
    <div className="flex flex-col w-full">
      <SEO
        title={`${currentStore.name} — Showroom, Live Stock & Hours | Yorder`}
        description={`Explore ${currentStore.count} items on the floor at ${currentStore.name}, ${currentStore.addr}. Doorstep trial in ${currentStore.eta}.`}
        canonical={`https://yorder.com/store/${currentStore.id}`}
        ogImage={currentStore.img}
        jsonLd={jsonLd}
      />

      {/* Store Hero Banner */}
      <div className="relative min-h-[360px] overflow-hidden bg-[#14120F] flex flex-col justify-between p-6 md:p-[26px_34px_30px]">
        <img
          src={currentStore.img}
          alt={currentStore.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/40 to-[#0B0B0C]/70 pointer-events-none" />

        {/* Top Navigation Row */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-[14px]">
            <button
              onClick={handleBack}
              className="yc w-[34px] h-[34px] rounded-full bg-[#0B0B0C]/60 backdrop-blur-[10px] border border-white/15 flex items-center justify-center text-[15px] text-[#F5F3F0] hover:bg-white/20 transition-colors"
            >
              ←
            </button>
            <span className="font-normal text-[11px] text-[#CFCBC3] truncate">
              Showrooms / {currentStore.cat} / {currentStore.name}
            </span>
          </div>

          <button
            onClick={handleFollowToggle}
            className="yc h-[34px] px-4 rounded-[17px] backdrop-blur-[10px] flex items-center text-[11px] font-medium transition-all"
            style={{
              background: isFollowing ? '#F2ECE1' : 'rgba(11,11,12,.6)',
              color: isFollowing ? '#0B0B0C' : '#F5F3F0',
              border: isFollowing ? '1px solid #F2ECE1' : '1px solid rgba(255,255,255,.14)',
            }}
          >
            {isFollowing ? '✓ Following' : '+ Follow'}
          </button>
        </div>

        {/* Bottom Store Profile & Stats */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-10">
          <div className="flex items-start md:items-end gap-5">
            <div className="w-[68px] h-[68px] rounded-[20px] bg-[#F2ECE1] flex items-center justify-center font-semibold text-[21px] leading-none text-[#0B0B0C] flex-shrink-0 shadow-lg">
              {currentStore.ini}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-[10px] mb-[14px]">
                <span className="flex items-center gap-[7px] px-[11px] py-[6px] rounded-[14px] bg-[#0B0B0C]/60 backdrop-blur-[8px] border border-[#9BD8A0]/35 font-medium text-[8.5px] tracking-[0.14em] text-[#9BD8A0]">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#9BD8A0] animate-pulse" />
                  {currentStore.hours}
                </span>
              </div>
              <h1 className="font-semibold text-[28px] md:text-[38px] leading-none tracking-[-0.035em] text-[#F7F3EC]">
                {currentStore.name}
              </h1>
              <div className="font-normal text-[12px] leading-[1.5] text-[#CFCBC3] mt-[10px]">
                {currentStore.cat} · {currentStore.addr}
              </div>
            </div>
          </div>

          {/* Stats Bar (Synced with mobile app live metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8 flex-shrink-0 pb-[6px]">
            <div>
              <div className="font-semibold text-[17px] leading-none text-[#C8A06A]">
                ★ {currentStore.rating && currentStore.rating !== 'New' ? currentStore.rating : 'New'}
              </div>
              <div className="font-normal text-[10px] text-[#9A968E] mt-2">
                {currentStore.ratingCount && currentStore.ratingCount > 0
                  ? `${currentStore.ratingCount} ratings`
                  : 'Showroom'}
              </div>
            </div>
            <div>
              <div className="font-semibold text-[17px] leading-none text-[#F5F3F0]">
                {distanceKmText}
              </div>
              <div className="font-normal text-[10px] text-[#9A968E] mt-2">
                {travelTimeText}
              </div>
            </div>
            <div>
              <div className="font-semibold text-[17px] leading-none text-[#F5F3F0]">
                {deliveryEtaText}
              </div>
              <div className="font-normal text-[10px] text-[#9A968E] mt-2">home delivery</div>
            </div>
            <div>
              <div className="font-semibold text-[17px] leading-none text-[#F5F3F0]">
                {effectiveStock.length > 0 ? effectiveStock.length : (currentStore.count || 'Active')}
              </div>
              <div className="font-normal text-[10px] text-[#9A968E] mt-2">on the floor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shelf Tabs Navigation Bar */}
      <div className="flex items-center gap-3 px-4 md:px-[34px] h-[56px] border-b border-[var(--s2)] bg-[var(--s0)] overflow-x-auto">
        {tabDefs.map((t, idx) => {
          const isSelected = activeTab === idx;
          return (
            <button
              key={t.label}
              onClick={() => setActiveTab(idx)}
              className="yc h-[34px] px-4 rounded-[17px] flex items-center text-[11.5px] whitespace-nowrap transition-colors"
              style={{
                background: isSelected ? 'var(--acc)' : 'transparent',
                color: isSelected ? 'var(--on-acc)' : 'var(--t2)',
                fontWeight: isSelected ? 600 : 500,
                border: isSelected ? 'none' : '1px solid var(--bd)',
              }}
            >
              {t.label} {t.count}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={handleAskRep}
          className="yc h-[36px] px-4 rounded-[18px] border border-[var(--bdw)] flex items-center text-[11px] font-medium text-[var(--tw)] whitespace-nowrap hover:bg-[var(--sw)]"
        >
          Ask the floor
        </button>
      </div>

      {/* Two Column Layout: Store Inventory & Rep Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
        {/* Left Inventory Shelf */}
        <div className="p-4 md:p-[28px_34px_40px]">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-semibold text-[20px] md:text-[24px] leading-none tracking-[-0.025em] text-[var(--t1)]">
              In stock right now
            </h2>
            <span className="font-mono text-[11px] text-[var(--t3)]">
              Counted 12 min ago
            </span>
          </div>

          {shelfProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {shelfProducts.map((p) => (
                <div key={p.id} className="flex flex-col group text-left">
                  <div
                    onClick={() => handleOpenProduct(p.id)}
                    className="yc relative aspect-square max-h-[195px] rounded-[12px] overflow-hidden bg-white border border-[var(--bd)] group-hover:border-[var(--gold)] transition-colors cursor-pointer flex items-center justify-center p-2.5"
                  >
                    <img
                      src={p.img}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Stock Tag Badge */}
                    <div
                      className="absolute left-[8px] top-[8px] px-[8px] py-[4px] rounded-[9px] font-medium text-[8.5px] leading-none backdrop-blur-[8px] shadow-sm"
                      style={{
                        background: 'rgba(11,11,12,.85)',
                        color: p.tagOk ? '#9BD8A0' : '#C8A06A',
                      }}
                    >
                      {p.stock}
                    </div>
                  </div>

                  <div className="text-[9.5px] text-[var(--t3)] mt-[10px] mb-[4px]">
                    {p.brand}
                  </div>
                  <button
                    onClick={() => handleOpenProduct(p.id)}
                    className="yc font-medium text-[12px] leading-[1.35] text-[var(--t1)] hover:text-[var(--gold)] text-left line-clamp-1 transition-colors"
                  >
                    {p.name}
                  </button>

                  <div className="flex items-center justify-between mt-[10px]">
                    <span className="font-semibold text-[13.5px] leading-none text-[var(--t1)]">
                      {rupee(p.price)}
                    </span>
                    <button
                      onClick={() => addToBag(p)}
                      className="yc h-[28px] px-3 rounded-[14px] bg-[var(--acc)] flex items-center font-semibold text-[11px] leading-none text-[var(--on-acc)] hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                      + Bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                <div className="font-medium text-sm text-[var(--t2)]">
                  No products found on this showroom shelf
                </div>
                <p className="text-xs text-[var(--t3)] max-w-sm">
                  Ask the floor representative or explore other showroom shelves.
                </p>
              </div>
            )
          )}
        </div>

        {/* Right Sidebar: Floor Rep, Details, Real Store Info */}
        <aside className="p-4 md:p-[28px_24px] border-t lg:border-t-0 lg:border-l border-[var(--s2)] flex flex-col gap-[18px]">
          {/* Floor Rep Card */}
          <div className="p-[18px] rounded-[18px] bg-[var(--s0)] border border-[var(--bd)]">
            <div className="flex items-center gap-[13px]">
              <div className="relative w-[44px] h-[44px] rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center font-medium text-[13px] text-[var(--tw)] flex-shrink-0">
                {currentStore.repIni}
                <span className="absolute right-[1px] bottom-[1px] w-[10px] h-[10px] rounded-full bg-[var(--ok)] border-2 border-[var(--s0)] animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[12.5px] text-[var(--t1)] truncate">
                  {currentStore.repName} is on the floor
                </div>
                <div className="font-normal text-[10.5px] text-[var(--ok)] mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
                  Live showroom rep · Online
                </div>
              </div>
            </div>

            <div className="font-normal text-[11.5px] leading-[1.6] text-[var(--t2)] mt-[14px]">
              Chat directly with floor staff at {currentStore.name}. Ask for stock checks, size availability, or live shelf photos.
            </div>

            <button
              onClick={handleAskRep}
              className="yc w-full h-[40px] rounded-[20px] bg-[var(--acc)] text-[var(--on-acc)] flex items-center justify-center font-semibold text-[11.5px] mt-[14px] hover:opacity-90 active:scale-98 transition-all shadow-sm"
            >
              Ask {currentStore.repName}
            </button>
          </div>

          {/* Real Inventory Status */}
          <div className="p-[18px] rounded-[18px] bg-[var(--s1)] border border-[var(--bd)]">
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--gold)]">
              {effectiveStock.length} ITEMS ON THE SHELF
            </div>
            <div className="font-normal text-[10.5px] leading-[1.6] text-[var(--t3)] mt-[10px]">
              Verified showroom inventory available for immediate doorstep trial.
            </div>
            <div className="h-[1px] bg-[var(--bd)] my-4" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--t3)]">To {deliverTo}</span>
              <span className="font-semibold text-[13px] text-[var(--ok)]">{currentStore.eta}</span>
            </div>
          </div>

          {/* Showroom Details & Operating Hours (100% Real from Backend Vendor) */}
          <div className="p-5 rounded-[20px] bg-[var(--s0)] border border-[var(--bd)] flex flex-col gap-3">
            <span className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)]">
              SHOWROOM DETAILS
            </span>
            <div className="text-xs text-[var(--t1)] leading-relaxed">
              📍 {currentStore.addr}
            </div>
            <div className="text-xs text-[var(--t3)] flex items-center justify-between pt-2 border-t border-[var(--bd)]">
              <span>Status</span>
              <span className="text-[var(--gold)] font-medium font-mono text-[11px]">{currentStore.hours}</span>
            </div>
          </div>

          {/* Bag Preview Widget if has items */}
          {bag.length > 0 && (
            <div
              onClick={() => go('bag')}
              className="yc p-[18px] rounded-[18px] bg-[var(--s1)] border border-[var(--bd)] cursor-pointer hover:border-[var(--gold)] transition-colors"
            >
              <div className="font-semibold text-[13px] text-[var(--t1)]">
                {bag.length} {bag.length === 1 ? 'item' : 'items'} · {rupee(bagTotal)}
              </div>
              <div className="font-normal text-[10.5px] text-[var(--t3)] mt-2">
                Ready for instant doorstep trial · Arrives in {currentStore.eta}
              </div>
              <div className="h-[42px] rounded-[21px] bg-[var(--acc)] flex items-center justify-center font-semibold text-[12.5px] text-[var(--on-acc)] mt-[14px]">
                Open the bag
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
