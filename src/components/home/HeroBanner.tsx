import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useRecentActivityQuery } from '../../api/activity.api';
import { useHomeBannersQuery, BannerItem } from '../../api/metadata.api';
import { useVendorsQuery } from '../../api/vendors.api';

type RgbTuple = [number, number, number];
interface EdgePalette {
  gradientCss: string;
  isLight: boolean;
  needsScrim: boolean;
}

const edgePaletteCache = new Map<string, EdgePalette>();
const DEFAULT_PALETTE: EdgePalette = {
  gradientCss: 'linear-gradient(180deg, rgb(14, 12, 9) 0%, rgb(11, 11, 12) 100%)',
  isLight: false,
  needsScrim: false,
};

/** W3C WCAG 2.1 relative luminance for accurate light/dark contrast decisions */
const relativeLuminance = ([r, g, b]: RgbTuple): number => {
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * Samples 12 fine vertical stops along the leftmost 2.5% edge of the banner image
 * (pixel-column extrusion) so horizon lines, lighting gradients, and pedestals
 * align seamlessly across the left half, with WCAG contrast verification.
 */
const sampleLeftEdgePalette = (src: string): Promise<EdgePalette> => {
  if (!src) return Promise.resolve(DEFAULT_PALETTE);
  const cached = edgePaletteCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = 4;
        const h = 12;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }
        const stripWidth = Math.max(2, Math.round(img.naturalWidth * 0.025));
        ctx.drawImage(img, 0, 0, stripWidth, img.naturalHeight, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        const stops: RgbTuple[] = [];
        for (let y = 0; y < h; y++) {
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (data[idx + 3] < 128) continue;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
          stops.push(
            count > 0
              ? [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
              : [14, 12, 9]
          );
        }

        // Build exact 12-stop vertical gradient matching every height band of the edge
        const stopStrings = stops.map(
          ([r, g, b], i) => `rgb(${r}, ${g}, ${b}) ${((i / (h - 1)) * 100).toFixed(1)}%`
        );
        const gradientCss = `linear-gradient(180deg, ${stopStrings.join(', ')})`;

        // Compute WCAG contrast specifically over the text zone (rows 3..9)
        let tr = 0;
        let tg = 0;
        let tb = 0;
        const textRows = stops.slice(3, 10);
        textRows.forEach(([r, g, b]) => {
          tr += r;
          tg += g;
          tb += b;
        });
        const textBgRgb: RgbTuple = [
          Math.round(tr / textRows.length),
          Math.round(tg / textRows.length),
          Math.round(tb / textRows.length),
        ];

        const bgLum = relativeLuminance(textBgRgb);
        const whiteContrast = (1.0 + 0.05) / (bgLum + 0.05);
        const darkContrast = (bgLum + 0.05) / (0.005 + 0.05); // #111111 luminance ~0.005
        const isLight = darkContrast > whiteContrast;
        const bestContrast = Math.max(whiteContrast, darkContrast);

        const palette: EdgePalette = {
          gradientCss,
          isLight,
          needsScrim: bestContrast < 5.5,
        };
        edgePaletteCache.set(src, palette);
        resolve(palette);
      } catch {
        resolve(DEFAULT_PALETTE);
      }
    };
    img.onerror = () => resolve(DEFAULT_PALETTE);
    img.src = src;
  });
};

export const HeroBanner: React.FC = () => {
  const { go, setPid, setCat, setQ, deliverTo } = useAppStore();
  const { data: feed } = useRecentActivityQuery();
  const { data: banners = [] } = useHomeBannersQuery();
  const { data: stores } = useVendorsQuery();

  const storeList = useMemo(() => Object.values(stores || {}), [stores]);
  const showroomCount = storeList.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [palettesByUrl, setPalettesByUrl] = useState<Record<string, EdgePalette>>({});

  // Build normalized slide list (falls back cleanly to default slide before API resolves)
  const slides = useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b, idx) => ({
        key: String(b.id ?? idx),
        banner: b,
        image: b.image_url || b.image || '/assets/hero-drop.jpg',
        desktopImage: b.desktop_image_url,
        name: b.name || 'The Suede Faded Archive',
      }));
    }
    return [
      {
        key: 'default-drop',
        banner: undefined as BannerItem | undefined,
        image: '/assets/hero-drop.jpg',
        desktopImage: undefined as string | undefined,
        name: 'The Suede Faded Archive',
      },
    ];
  }, [banners]);

  // Pre-sample all banner palettes in parallel on mount so slide transitions have zero color lag
  useEffect(() => {
    let cancelled = false;
    const uniqueUrls = Array.from(new Set(slides.map((s) => s.image).filter(Boolean)));
    Promise.all(
      uniqueUrls.map(async (url) => {
        const palette = await sampleLeftEdgePalette(url);
        return [url, palette] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      setPalettesByUrl((prev) => {
        const next = { ...prev };
        for (const [url, palette] of entries) {
          next[url] = palette;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [slides]);

  // Auto-cycle through banners if multiple exist
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const safeIndex = activeIndex < slides.length ? activeIndex : 0;
  const activeSlide = slides[safeIndex] || slides[0];
  const activeBanner = activeSlide.banner;

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

  const categoryTag = (
    activeBanner?.categorie ||
    activeBanner?.categorys ||
    'SUPERKICKS'
  ).toUpperCase();
  const storeLocation = (activeBanner?.location || 'LINKING ROAD').toUpperCase();

  const activePalette = palettesByUrl[activeSlide.image] || DEFAULT_PALETTE;
  const isLight = !activeSlide.desktopImage && activePalette.isLight;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[1px] bg-[var(--s2)] border-b border-[var(--s2)]">
      {/* Left: Hero Live Drop Banner */}
      <div className="relative min-h-[360px] sm:min-h-[440px] md:h-[500px] overflow-hidden bg-[#0E0C09] flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none">
        {/* Stacked cross-fade slide layers (each carries its own 12-stop edge gradient + image for silky transitions) */}
        {slides.map((slide, idx) => {
          const isActive = idx === safeIndex;
          const palette = palettesByUrl[slide.image] || DEFAULT_PALETTE;
          return (
            <div
              key={slide.key}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ease-out pointer-events-none ${
                isActive ? 'opacity-100 z-[2]' : 'opacity-0 z-[1]'
              }`}
            >
              {/* Mobile: full-bleed cover matching mobile app */}
              <img
                src={slide.image}
                alt={isActive ? slide.name : ''}
                className="md:hidden absolute inset-0 w-full h-full object-cover object-center"
              />

              {slide.desktopImage ? (
                /* Dedicated wide desktop artwork when provided by CMS */
                <img
                  src={slide.desktopImage}
                  alt={isActive ? slide.name : ''}
                  className="hidden md:block absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <>
                  {/* Desktop: 12-stop pixel-column vertical edge extrusion */}
                  <div
                    style={{ background: palette.gradientCss }}
                    className="hidden md:block absolute inset-0"
                  />
                  {/* Desktop: uncropped natural-aspect image on the right feathered seamlessly into the 12-stop edge */}
                  <img
                    src={slide.image}
                    alt={isActive ? slide.name : ''}
                    style={{
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 16%)',
                      maskImage: 'linear-gradient(to right, transparent 0%, black 16%)',
                    }}
                    className="hidden md:block absolute inset-y-0 right-0 h-full w-auto max-w-[78%] object-contain object-right"
                  />
                  {/* WCAG mid-tone contrast scrim (only rendered when contrast ratio < 5.5:1) */}
                  {palette.needsScrim && (
                    <div
                      style={{
                        background: palette.isLight
                          ? 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.18) 38%, transparent 65%)'
                          : 'linear-gradient(90deg, rgba(11,11,12,0.45) 0%, rgba(11,11,12,0.22) 38%, transparent 65%)',
                      }}
                      className="hidden md:block absolute inset-0"
                    />
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Mobile dark gradient for text legibility */}
        <div className="md:hidden absolute inset-0 z-[3] bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/70 to-transparent pointer-events-none" />
        <div className="md:hidden absolute inset-0 z-[3] bg-gradient-to-t from-[#0B0B0C]/85 via-transparent to-transparent pointer-events-none" />

        {/* Live Drop Pill Badge (Synced with mobile app live status) */}
        <div
          className={`relative z-10 self-start flex items-center gap-2 px-3 sm:px-[13px] py-1.5 sm:py-[7px] rounded-[20px] backdrop-blur-[8px] shadow-sm transition-colors duration-500 ${
            isLight
              ? 'bg-[#0B0B0C]/70 md:bg-[#111111]/80 border border-[#C8A06A]/40 md:border-black/15'
              : 'bg-[#0B0B0C]/70 border border-[#C8A06A]/40'
          }`}
        >
          <span className="w-[6px] h-[6px] rounded-full bg-[#4FB44D] shadow-[0_0_8px_#4FB44D] animate-pulse" />
          <span className="font-medium text-[8.5px] sm:text-[9px] leading-none tracking-[0.16em] text-[#E7D9C1]">
            LIVE DROP · IN STORE
          </span>
        </div>

        {/* Hero Copy & Functional CTA */}
        <div className="relative z-10 max-w-[560px] mt-8 sm:mt-12 md:mt-0">
          <div
            className={`font-medium text-[9px] sm:text-[9.5px] leading-none tracking-[0.16em] sm:tracking-[0.18em] mb-2.5 sm:mb-3 truncate transition-colors duration-500 ${
              isLight ? 'text-[#C8A06A] md:text-[#5C4326]' : 'text-[#C8A06A]'
            }`}
          >
            {categoryTag} · {storeLocation}
          </div>
          <h1
            className={`font-light text-[28px] sm:text-[36px] md:text-[52px] leading-[1.08] md:leading-[1.05] tracking-[-0.04em] mb-4 sm:mb-[24px] transition-colors duration-500 ${
              isLight ? 'text-[#F7F3EC] md:text-[#111111]' : 'text-[#F7F3EC]'
            }`}
          >
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

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => handleShopDrop(activeBanner)}
              className={`yc h-[40px] sm:h-[46px] px-5 sm:px-[28px] rounded-[23px] flex items-center font-semibold text-[12px] sm:text-[13px] leading-none hover:opacity-90 active:scale-95 shadow-lg transition-all duration-500 ${
                isLight
                  ? 'bg-[#F2ECE1] text-[#0B0B0C] md:bg-[#111111] md:text-[#F7F3EC]'
                  : 'bg-[#F2ECE1] text-[#0B0B0C]'
              }`}
            >
              Shop the drop
            </button>
            <div
              className={`flex items-center gap-2 text-[11px] sm:text-[12px] font-normal transition-colors duration-500 ${
                isLight ? 'text-[#CFCBC3] md:text-[#2A2622]' : 'text-[#CFCBC3]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4FB44D] flex-shrink-0" />
              <span>In stock · Delivered in minutes</span>
            </div>
          </div>
        </div>

        {/* Minimalist Carousel Dots (if multiple banners exist from backend) */}
        {banners.length > 1 && (
          <div className="relative z-10 flex items-center gap-2 pt-3 sm:pt-4">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? isLight
                      ? 'w-6 bg-[#F2ECE1] md:bg-[#111111]'
                      : 'w-6 bg-[#F2ECE1]'
                    : isLight
                    ? 'w-1.5 bg-white/30 hover:bg-white/60 md:bg-black/25 md:hover:bg-black/50'
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
        <div className="flex-1 p-4 sm:p-[24px] md:p-[28px] border-b border-[var(--s2)]">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-[18px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-[6px] h-[6px] rounded-full bg-[var(--ok)] animate-ping flex-shrink-0" />
              <span className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--gold)] truncate max-w-[190px] sm:max-w-none">
                {deliverTo ? `${deliverTo.toUpperCase()} IS BUYING` : 'BANDRA IS BUYING'}
              </span>
            </div>
            <span className="font-normal text-[9.5px] leading-none text-[var(--t3)] flex-shrink-0">
              last 30 min
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:gap-[13px]">
            {feed && feed.length > 0 ? (
              feed.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPid(item.pid);
                    go('product', { pid: item.pid });
                  }}
                  className="yc flex items-center gap-2.5 sm:gap-3 pb-3 sm:pb-[13px] border-b border-[var(--s2)] cursor-pointer group"
                >
                  <div className="w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center font-medium text-[10.5px] sm:text-[11px] text-[var(--tw)] flex-shrink-0 group-hover:scale-105 transition-transform">
                    {item.ini}
                  </div>
                  <div className="flex-1 font-normal text-[11px] sm:text-[11.5px] leading-[1.45] sm:leading-[1.5] text-[var(--t2)] group-hover:text-[var(--t1)] transition-colors line-clamp-2 min-w-0">
                    {item.text}
                  </div>
                  <div className="w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] rounded-[9px] overflow-hidden relative bg-white flex-shrink-0 border border-[var(--bd)] p-0.5 flex items-center justify-center">
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="font-normal text-[10.5px] text-[var(--t3)]">
                Live stock counted by hand across {deliverTo || 'Mumbai'}
              </span>
              <button
                onClick={() => go('products')}
                className="yc font-medium text-[10.5px] text-[var(--gold)] hover:underline flex-shrink-0"
              >
                Browse all products
              </button>
            </div>
          </div>
        </div>

        {/* 2 Local Stats Columns */}
        <div className="grid grid-cols-2 gap-[1px] bg-[var(--s2)]">
          <div className="p-4 sm:p-[22px] md:p-[24px] bg-[var(--bg)]">
            <div className="font-semibold text-[18px] sm:text-[22px] leading-none font-mono tracking-[-0.02em] text-[var(--t1)]">
              {showroomCount > 0 ? showroomCount : '30'}
            </div>
            <div className="font-normal text-[10px] sm:text-[10.5px] leading-[1.5] text-[var(--t3)] mt-1.5 sm:mt-2">
              showrooms live
              <br />
              in {deliverTo || 'Mumbai'}
            </div>
          </div>
          <div className="p-4 sm:p-[22px] md:p-[24px] bg-[var(--bg)]">
            <div className="font-semibold text-[18px] sm:text-[22px] leading-none font-mono tracking-[-0.02em] text-[var(--t1)]">
              45 min
            </div>
            <div className="font-normal text-[10px] sm:text-[10.5px] leading-[1.5] text-[var(--t3)] mt-1.5 sm:mt-2">
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
