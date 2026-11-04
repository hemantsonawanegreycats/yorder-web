import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useRecentActivityQuery } from '../../api/activity.api';
import { useHomeBannersQuery, BannerItem } from '../../api/metadata.api';
import { useVendorsQuery } from '../../api/vendors.api';

export const HeroBanner: React.FC = () => {
  const { go, setPid, setCat, setQ, deliverTo } = useAppStore();
  const { data: feed } = useRecentActivityQuery();
  const { data: banners = [] } = useHomeBannersQuery();
  const { data: stores } = useVendorsQuery();

  const storeList = useMemo(() => Object.values(stores || {}), [stores]);
  const showroomCount = storeList.length;

  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-cycle through banners if multiple exist
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [banners]);

  const activeBanner: BannerItem | undefined =
    banners.length > 0 ? banners[activeIndex] || banners[0] : undefined;

  const handleShopDrop = (bannerItem?: BannerItem) => {
    const item = bannerItem || activeBanner;
    if (!item) {
      go('products');
      return;
    }

    const targetCat = item.categorie || item.categorys || item.filter?.categorys;
    const targetSearch = item.filter?.search || item.name;

    if (targetCat) {
      setCat(targetCat);
      setQ('');
      go('products');
    } else if (targetSearch && targetSearch !== 'The Suede Faded Archive') {
      setQ(targetSearch);
      setCat('All');
      go('products');
    } else {
      go('products');
    }
  };

  const heroImage =
    activeBanner?.image_url || activeBanner?.image || '/assets/hero-drop.jpg';
  const heroName = activeBanner?.name || 'The Suede Faded Archive';
  const categoryTag = (
    activeBanner?.categorie ||
    activeBanner?.categorys ||
    'SUPERKICKS'
  ).toUpperCase();
  const storeLocation = (activeBanner?.location || 'LINKING ROAD').toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[1px] bg-[var(--s2)] border-b border-[var(--s2)]">
      {/* Left: Hero Live Drop Banner */}
      <div className="relative min-h-[460px] md:h-[500px] overflow-hidden bg-[#0E0C09] flex flex-col justify-between p-6 md:p-10 select-none">
        <img
          src={heroImage}
          alt={heroName}
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/75 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/90 via-transparent to-transparent pointer-events-none" />

        {/* Live Drop Pill Badge (Synced with mobile app live status) */}
        <div className="relative z-10 self-start flex items-center gap-2 px-[13px] py-[7px] rounded-[20px] bg-[#0B0B0C]/70 backdrop-blur-[8px] border border-[#C8A06A]/40 shadow-sm">
          <span className="w-[6px] h-[6px] rounded-full bg-[#4FB44D] shadow-[0_0_8px_#4FB44D] animate-pulse" />
          <span className="font-medium text-[9px] leading-none tracking-[0.16em] text-[#E7D9C1]">
            LIVE DROP · IN STORE
          </span>
        </div>

        {/* Hero Copy & Functional CTA */}
        <div className="relative z-10 max-w-[560px] mt-12 md:mt-0">
          <div className="font-medium text-[9.5px] leading-none tracking-[0.18em] text-[#C8A06A] mb-3">
            {categoryTag} · {storeLocation}
          </div>
          <h1 className="font-light text-[36px] md:text-[52px] leading-[1.05] tracking-[-0.04em] text-[#F7F3EC] mb-[24px]">
            {activeBanner?.name ? (
              <span className="font-semibold">{activeBanner.name}</span>
            ) : (
              <>
                The Suede
                <br />
                <span className="font-semibold">Faded Archive</span>
              </>
            )}
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => handleShopDrop(activeBanner)}
              className="yc h-[46px] px-[28px] rounded-[23px] bg-[#F2ECE1] flex items-center font-semibold text-[13px] leading-none text-[#0B0B0C] hover:opacity-90 active:scale-95 shadow-lg transition-transform"
            >
              Shop the drop
            </button>
            <div className="flex items-center gap-2 text-[12px] font-normal text-[#CFCBC3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4FB44D]" />
              <span>In stock · Delivered in minutes</span>
            </div>
          </div>
        </div>

        {/* Minimalist Carousel Dots (if multiple banners exist from backend) */}
        {banners.length > 1 && (
          <div className="relative z-10 flex items-center gap-2 pt-4">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? 'w-6 bg-[#F2ECE1]'
                    : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Live Feed & Local Stats */}
      <div className="flex flex-col bg-[var(--bg)]">
        {/* Bandra Is Buying Live Ticker */}
        <div className="flex-1 p-[24px] md:p-[28px] border-b border-[var(--s2)]">
          <div className="flex items-center justify-between mb-[18px]">
            <div className="flex items-center gap-2">
              <span className="w-[6px] h-[6px] rounded-full bg-[var(--ok)] animate-ping" />
              <span className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--gold)]">
                {deliverTo ? `${deliverTo.toUpperCase()} IS BUYING` : 'BANDRA IS BUYING'}
              </span>
            </div>
            <span className="font-normal text-[9.5px] leading-none text-[var(--t3)]">
              last 30 min
            </span>
          </div>

          <div className="flex flex-col gap-[13px]">
            {feed && feed.length > 0 ? (
              feed.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPid(item.pid);
                    go('product', { pid: item.pid });
                  }}
                  className="yc flex items-center gap-3 pb-[13px] border-b border-[var(--s2)] cursor-pointer group"
                >
                  <div className="w-[34px] h-[34px] rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center font-medium text-[11px] text-[var(--tw)] flex-shrink-0 group-hover:scale-105 transition-transform">
                    {item.ini}
                  </div>
                  <div className="flex-1 font-normal text-[11.5px] leading-[1.5] text-[var(--t2)] group-hover:text-[var(--t1)] transition-colors line-clamp-2">
                    {item.text}
                  </div>
                  <div className="w-[34px] h-[34px] rounded-[9px] overflow-hidden relative bg-white flex-shrink-0 border border-[var(--bd)] p-0.5 flex items-center justify-center">
                    <img
                      src={item.img}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[11.5px] text-[var(--t3)] py-4 text-center">
                Fetching recent activity from local stores...
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="font-normal text-[10.5px] text-[var(--t3)]">
                Live stock counted by hand across {deliverTo || 'Mumbai'}
              </span>
              <button
                onClick={() => go('products')}
                className="yc font-medium text-[10.5px] text-[var(--gold)] hover:underline"
              >
                Browse all products
              </button>
            </div>
          </div>
        </div>

        {/* 2 Local Stats Columns */}
        <div className="grid grid-cols-2 gap-[1px] bg-[var(--s2)]">
          <div className="p-[22px] md:p-[24px] bg-[var(--bg)]">
            <div className="font-semibold text-[22px] leading-none font-mono tracking-[-0.02em] text-[var(--t1)]">
              {showroomCount > 0 ? showroomCount : '30'}
            </div>
            <div className="font-normal text-[10.5px] leading-[1.5] text-[var(--t3)] mt-2">
              showrooms live
              <br />
              in {deliverTo || 'Mumbai'}
            </div>
          </div>
          <div className="p-[22px] md:p-[24px] bg-[var(--bg)]">
            <div className="font-semibold text-[22px] leading-none font-mono tracking-[-0.02em] text-[var(--t1)]">
              45 min
            </div>
            <div className="font-normal text-[10.5px] leading-[1.5] text-[var(--t3)] mt-2">
              median delivery
              <br />
              to your door
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
