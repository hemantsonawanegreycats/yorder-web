import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useInfiniteProductsQuery } from '../api/products.api';
import { useVendorsQuery } from '../api/vendors.api';
import { useCategoriesQuery } from '../api/categories.api';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton, ErrorState } from '../components/common/Skeleton';
import { SEO } from '../components/common/SEO';
import { SlidersHorizontal, X } from 'lucide-react';

const SORT_OPTIONS = ['Nearest first', 'Price: low to high', 'Biggest discount'];

export const ProductsPage: React.FC = () => {
  const {
    q,
    cat,
    setCat,
    brand,
    setBrand,
    sort,
    cycleSort,
    clearFilters,
  } = useAppStore();

  // Debounce search query so typing searches seamlessly on the backend
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  // Infinite server-side products query over the entire backend database
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteProductsQuery({
    search: debouncedQ || undefined,
    categorys: cat && cat !== 'All' ? cat : undefined,
    limit: 24,
  });

  const { data: stores } = useVendorsQuery();
  const { data: fetchedCategories } = useCategoriesQuery();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sentinel ref for infinite scroll down
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    const target = loadMoreRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // All flattened products accumulated from all loaded pages
  const products = data?.pages.flatMap((page) => page.items) || [];

  const categoryNames = Array.from(
    new Set([
      'All',
      ...(fetchedCategories || []).map((c) => c.name),
      ...products.map((p) => p.cat),
    ])
  ).filter(Boolean);

  // Client-side brand filter and sort applied on the loaded inventory
  const filtered = products
    .filter((p) => {
      const matchBrand = !brand || p.brand.toLowerCase() === brand.toLowerCase();
      return matchBrand;
    })
    .sort((a, b) => {
      if (sort === 1) return a.price - b.price; // Price low to high
      if (sort === 2) {
        // Biggest discount
        const discA = a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
        const discB = b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
        return discB - discA;
      }
      return 0; // Nearest first
    });

  // Extract unique brand names
  const brandNames = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

  const productsTitle = q ? `“${q}”` : cat === 'All' ? 'Products' : cat;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: productsTitle,
    numberOfItems: filtered.length,
    itemListElement: filtered.slice(0, 10).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: p.name,
      url: `https://yorder.com/product/${p.id}`,
    })),
  };

  return (
    <div className="flex flex-col w-full">
      <SEO
        title={`${productsTitle} — On Shelves Near You | Yorder`}
        description={`Explore products in stock on real store shelves near you. Instant door trial in Bandra, Mumbai.`}
        canonical="https://yorder.com/products"
        jsonLd={jsonLd}
      />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 px-4 md:px-[34px] py-6 md:py-[30px] border-b border-[var(--s2)]">
        <div>
          <div className="font-medium text-[9px] leading-none tracking-[0.18em] text-[var(--gold)] uppercase">
            {filtered.length} ON SHELVES NEAR YOU
          </div>
          <h1 className="font-semibold text-[30px] md:text-[38px] leading-none tracking-[-0.035em] text-[var(--t1)] mt-[14px]">
            {productsTitle}
          </h1>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-[10px] w-full sm:w-auto">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="yc md:hidden flex-1 sm:flex-initial h-[36px] px-[15px] rounded-[18px] border border-[var(--bd)] flex items-center justify-center gap-2 text-[11.5px] font-medium text-[var(--t2)]"
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>

          <button
            onClick={cycleSort}
            className="yc flex-1 sm:flex-initial h-[36px] px-[15px] rounded-[18px] border border-[var(--bd)] flex items-center justify-center gap-2 text-[11.5px] font-medium text-[var(--t2)] hover:border-[var(--gold)] transition-colors"
          >
            <span>Sort · {SORT_OPTIONS[sort]}</span>
            <span className="text-[9px] text-[var(--t3)]">▾</span>
          </button>

          <button
            onClick={clearFilters}
            className="yc h-[36px] px-[15px] rounded-[18px] border border-[var(--bdw)] flex items-center justify-center text-[11.5px] font-medium text-[var(--tw)] hover:bg-[var(--sw)] transition-colors"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[264px_1fr]">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-[26px] p-[26px] border-r border-[var(--s2)]">
          {/* Categories */}
          <div>
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)] mb-[14px]">
              CATEGORY
            </div>
            <div className="flex flex-col gap-[2px]">
              {categoryNames.map((cName) => {
                const isSelected = cat === cName;
                const count =
                  cName === 'All'
                    ? products.length
                    : products.filter((p) => p.cat.toLowerCase() === cName.toLowerCase()).length;

                return (
                  <button
                    key={cName}
                    onClick={() => setCat(cName)}
                    className="yc flex items-center justify-between px-[11px] py-[9px] rounded-[9px] text-[12px] transition-all"
                    style={{
                      background: isSelected ? 'var(--s1)' : 'transparent',
                      border: isSelected ? '1px solid var(--bd)' : '1px solid transparent',
                      color: isSelected ? 'var(--t1)' : 'var(--t2)',
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  >
                    <span>{cName === 'All' ? 'All products' : cName}</span>
                    <span className="font-mono text-[10px] text-[var(--t3)]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Chips */}
          <div>
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)] mb-[14px]">
              BRAND
            </div>
            <div className="flex flex-wrap gap-2">
              {brandNames.slice(0, 9).map((bName: string) => {
                const isSelected = brand === bName;
                return (
                  <button
                    key={bName}
                    onClick={() => setBrand(isSelected ? '' : bName)}
                    className="yc h-[30px] px-[13px] rounded-[8px] flex items-center text-[11px] font-medium leading-none transition-colors"
                    style={{
                      background: isSelected ? 'var(--sw)' : 'var(--s1)',
                      border: isSelected ? '1px solid var(--bdw)' : '1px solid var(--bd)',
                      color: isSelected ? 'var(--tw)' : 'var(--t2)',
                    }}
                  >
                    {bName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assurance Box */}
          <div className="p-[18px] rounded-[16px] bg-[var(--s1)] border border-[var(--bd)]">
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--gold)]">
              EVERY LISTING IS A SHELF
            </div>
            <div className="font-normal text-[11px] leading-[1.7] text-[var(--t3)] mt-[10px]">
              Counts come from the store, not a warehouse. If it shows, someone can put a hand on it.
            </div>
          </div>
        </aside>

        {/* Right Products Content */}
        <main className="flex flex-col min-w-0">
          <div className="px-4 md:px-[34px] py-[26px] pb-[14px] flex items-baseline justify-between">
            <h2 className="font-semibold text-[20px] leading-none tracking-[-0.02em] text-[var(--t1)]">
              {brand ? brand : 'On the shelf now'}
            </h2>
            <span className="font-mono text-[11px] text-[var(--t3)]">
              {filtered.length} loaded {hasNextPage ? '· Scroll down for more' : '· End of catalog'}
            </span>
          </div>

          {/* Product Grid / Skeleton / Error / Empty State */}
          {isError ? (
            <div className="px-4 md:px-[34px] pb-[40px]">
              <ErrorState
                title="Could not load showroom products"
                message="Failed to connect to the showroom product catalog. Please check your internet connection or retry."
                onRetry={() => refetch()}
              />
            </div>
          ) : isLoading ? (
            <div className="px-4 md:px-[34px] pb-[40px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-3.5">
              {[...Array(12)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="px-4 md:px-[34px] pb-[40px] flex flex-col">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-3.5">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    store={stores ? stores[product.sid] : undefined}
                  />
                ))}

                {/* Skeletons while loading next page on scroll */}
                {isFetchingNextPage &&
                  [...Array(6)].map((_, i) => <ProductCardSkeleton key={`next-${i}`} />)}
              </div>

              {/* Sentinel trigger for infinite scroll */}
              <div ref={loadMoreRef} className="h-10 w-full mt-4 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="text-xs font-mono text-[var(--gold)] animate-pulse">
                    Loading more showroom products...
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Negative Case: No Results Empty State */
            <div className="px-4 md:px-[34px] pb-[60px] pt-8">
              <div className="p-10 rounded-[20px] border border-[var(--bd)] bg-[var(--s1)] text-center max-w-lg mx-auto">
                <div className="font-semibold text-[18px] text-[var(--t1)]">
                  Nothing on a nearby shelf matches that
                </div>
                <div className="font-normal text-[12px] leading-[1.7] text-[var(--t3)] mt-3">
                  {debouncedQ
                    ? `No products found across the database for "${debouncedQ}". Check spelling or explore categories.`
                    : 'Widen the filters, check spelling, or ask a floor rep to look in the back.'}
                </div>
                <button
                  onClick={clearFilters}
                  className="yc inline-flex h-[40px] px-[22px] rounded-[20px] bg-[var(--acc)] items-center font-semibold text-[12px] text-[var(--on-acc)] mt-5 hover:opacity-90 active:scale-95 transition-all"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end md:hidden">
          <div className="w-[85%] max-w-[320px] bg-[var(--bg)] h-full overflow-y-auto p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--s2)]">
              <span className="font-semibold text-sm text-[var(--t1)]">Filters</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-[var(--t3)] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Categories */}
            <div>
              <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] mb-3 uppercase">
                Category
              </div>
              <div className="flex flex-col gap-1">
                {categoryNames.map((cName) => (
                  <button
                    key={cName}
                    onClick={() => {
                      setCat(cName);
                      setMobileFilterOpen(false);
                    }}
                    className={`py-2 px-3 text-left text-xs rounded-lg ${
                      cat === cName ? 'bg-[var(--s2)] text-white font-semibold' : 'text-[var(--t2)]'
                    }`}
                  >
                    {cName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
