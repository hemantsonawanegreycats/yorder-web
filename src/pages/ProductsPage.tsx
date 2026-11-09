import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useInfiniteProductsQuery } from '../api/products.api';
import { useVendorsQuery } from '../api/vendors.api';
import { useCategoriesQuery } from '../api/categories.api';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton, ErrorState } from '../components/common/Skeleton';
import { SEO } from '../components/common/SEO';
import {
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  Store,
  Sparkles,
  Clock,
  CheckCircle2,
  RotateCcw,
  Tag,
} from 'lucide-react';
import {
  isProductOutOfStock,
  isProductStoreClosed,
  getProductDiscountPercent,
} from '../utils/productUtils';

const SORT_OPTIONS = [
  { id: 0, label: 'Nearest showroom first', short: 'Nearest' },
  { id: 1, label: 'Price: Low to high', short: 'Price: Low' },
  { id: 2, label: 'Price: High to low', short: 'Price: High' },
  { id: 3, label: 'Biggest discount', short: 'Discount' },
  { id: 4, label: 'Customer rating', short: 'Top Rated' },
];

const DISCOUNT_OPTIONS = [
  { label: 'Any discount', value: null },
  { label: '20%+ Off', value: 20 },
  { label: '30%+ Off', value: 30 },
  { label: '50%+ Off', value: 50 },
  { label: '70%+ Off', value: 70 },
];

export const ProductsPage: React.FC = () => {
  const {
    q,
    cat,
    setCat,
    brand,
    setBrand,
    sort,
    setSort,
    inStockOnly,
    setInStockOnly,
    openStoresOnly,
    setOpenStoresOnly,
    selectedVendorId,
    setSelectedVendorId,
    minDiscount,
    setMinDiscount,
    clearFilters,
  } = useAppStore();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    if (sortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortOpen]);

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
    vendor_id: selectedVendorId || undefined,
    sortBy: sort === 1 || sort === 2 ? 'sellPrice' : undefined,
    sortOrder: sort === 1 ? 'asc' : sort === 2 ? 'desc' : undefined,
    limit: 24,
  });

  const { data: stores } = useVendorsQuery();
  const { data: fetchedCategories } = useCategoriesQuery();

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

  // Extract unique brand names
  const brandNames = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

  // Extract vendor showroom list
  const vendorList = Object.values(stores || {}).sort((a, b) => {
    // Show open stores first
    if (a.isOpen && !b.isOpen) return -1;
    if (!a.isOpen && b.isOpen) return 1;
    return a.name.localeCompare(b.name);
  });

  // Client-side filtering & sorting applied on the loaded inventory
  const filtered = products
    .filter((p) => {
      // Brand filter
      if (brand && p.brand.toLowerCase() !== brand.toLowerCase()) {
        return false;
      }
      // Showroom/vendor filter
      if (selectedVendorId && String(p.sid) !== String(selectedVendorId)) {
        return false;
      }
      // In stock only filter
      if (inStockOnly && isProductOutOfStock(p)) {
        return false;
      }
      // Open stores only filter
      if (openStoresOnly && isProductStoreClosed(p, stores)) {
        return false;
      }
      // Minimum discount filter
      if (minDiscount !== null && getProductDiscountPercent(p) < minDiscount) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 1) return a.price - b.price; // Price low to high
      if (sort === 2) return b.price - a.price; // Price high to low
      if (sort === 3) {
        // Biggest discount
        return getProductDiscountPercent(b) - getProductDiscountPercent(a);
      }
      if (sort === 4) {
        // Customer rating
        const ratingA = typeof a.rating === 'number' ? a.rating : 0;
        const ratingB = typeof b.rating === 'number' ? b.rating : 0;
        return ratingB - ratingA;
      }
      return 0; // Nearest / default server order
    });

  // Active filters count
  const activeFiltersCount =
    (cat !== 'All' ? 1 : 0) +
    (brand ? 1 : 0) +
    (selectedVendorId ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (openStoresOnly ? 1 : 0) +
    (minDiscount !== null ? 1 : 0) +
    (sort !== 0 ? 1 : 0);

  const selectedStore = selectedVendorId && stores ? stores[selectedVendorId] : null;

  const productsTitle = q
    ? `“${q}”`
    : selectedStore
      ? selectedStore.name
      : cat === 'All'
        ? 'Products'
        : cat;

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
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 px-4 md:px-[34px] py-5 md:py-6 border-b border-[var(--s2)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[9px] leading-none tracking-[0.18em] text-[var(--gold)] uppercase">
              {filtered.length} ON SHELVES NEAR YOU
            </span>
            {selectedStore && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-[var(--s2)] text-[var(--t2)] border border-[var(--bd)]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedStore.isOpen !== false ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                />
                {selectedStore.isOpen !== false ? 'Open now' : 'Closed'}
              </span>
            )}
          </div>
          <h1 className="font-semibold text-[28px] md:text-[36px] leading-none tracking-[-0.035em] text-[var(--t1)] mt-[10px]">
            {productsTitle}
          </h1>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-[10px] w-full sm:w-auto">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="yc md:hidden flex-1 sm:flex-initial h-[36px] px-[15px] rounded-[18px] border border-[var(--bd)] flex items-center justify-center gap-2 text-[11.5px] font-medium text-[var(--t2)] active:scale-95 transition-all"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--gold)] text-[#0B0B0C] text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown Popup */}
          <div className="relative flex-1 sm:flex-initial" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className={`yc w-full sm:w-auto h-[36px] px-[15px] rounded-[18px] border flex items-center justify-center gap-2 text-[11.5px] font-medium transition-all ${
                sort !== 0
                  ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(200,160,106,0.08)]'
                  : 'border-[var(--bd)] text-[var(--t2)] hover:border-[var(--gold)] hover:text-[var(--t1)]'
              }`}
            >
              <span>Sort · {SORT_OPTIONS[sort]?.short || 'Sort'}</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  sortOpen ? 'rotate-180 text-[var(--gold)]' : 'text-[var(--t3)]'
                }`}
              />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-[220px] rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] shadow-2xl p-1.5 z-40 backdrop-blur-md">
                <div className="px-3 py-1.5 text-[9px] font-medium tracking-[0.14em] text-[var(--t3)] uppercase">
                  Sort products by
                </div>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sort === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSort(opt.id);
                        setSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[12px] transition-colors ${
                        isSelected
                          ? 'bg-[var(--s2)] text-[var(--gold)] font-medium'
                          : 'text-[var(--t2)] hover:bg-[var(--s2)] hover:text-[var(--t1)]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={14} className="text-[var(--gold)]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="yc h-[36px] px-[14px] rounded-[18px] border border-[var(--bdw)] flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-[var(--tw)] hover:bg-[var(--sw)] transition-colors"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Clear all</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Pills Row (Desktop & Mobile) */}
      <div className="flex items-center gap-2 px-4 md:px-[34px] py-3 border-b border-[var(--s2)] overflow-x-auto no-scrollbar bg-[var(--bg)]">
        {/* In Stock Only Pill */}
        <button
          onClick={() => setInStockOnly((v) => !v)}
          className={`yc shrink-0 h-[30px] px-3 rounded-full flex items-center gap-1.5 text-[11px] font-medium transition-all ${
            inStockOnly
              ? 'bg-[rgba(155,216,160,0.12)] border border-[rgba(155,216,160,0.4)] text-[#9BD8A0]'
              : 'bg-[var(--s1)] border border-[var(--bd)] text-[var(--t2)] hover:border-[var(--bd2)]'
          }`}
        >
          <CheckCircle2 size={13} className={inStockOnly ? 'text-[#9BD8A0]' : 'text-[var(--t3)]'} />
          <span>In stock only</span>
        </button>

        {/* Open Showrooms Now Pill */}
        <button
          onClick={() => setOpenStoresOnly((v) => !v)}
          className={`yc shrink-0 h-[30px] px-3 rounded-full flex items-center gap-1.5 text-[11px] font-medium transition-all ${
            openStoresOnly
              ? 'bg-[rgba(200,160,106,0.14)] border border-[rgba(200,160,106,0.45)] text-[var(--gold)]'
              : 'bg-[var(--s1)] border border-[var(--bd)] text-[var(--t2)] hover:border-[var(--bd2)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              openStoresOnly ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
            }`}
          />
          <Clock size={12} className={openStoresOnly ? 'text-[var(--gold)]' : 'text-[var(--t3)]'} />
          <span>Open showrooms now</span>
        </button>

        {/* 50%+ Off Pill */}
        <button
          onClick={() => setMinDiscount(minDiscount === 50 ? null : 50)}
          className={`yc shrink-0 h-[30px] px-3 rounded-full flex items-center gap-1.5 text-[11px] font-medium transition-all ${
            minDiscount === 50
              ? 'bg-[var(--sw)] border border-[var(--bdw)] text-[var(--tw)] font-semibold'
              : 'bg-[var(--s1)] border border-[var(--bd)] text-[var(--t2)] hover:border-[var(--bd2)]'
          }`}
        >
          <Sparkles size={12} className={minDiscount === 50 ? 'text-[var(--gold)]' : 'text-[var(--t3)]'} />
          <span>50%+ Off</span>
        </button>

        {/* Active Removable Chips */}
        {selectedStore && (
          <div className="shrink-0 h-[30px] pl-3 pr-1.5 rounded-full bg-[var(--s2)] border border-[var(--gold)] flex items-center gap-1.5 text-[11px] text-[var(--gold)] font-medium">
            <Store size={12} />
            <span className="max-w-[120px] truncate">{selectedStore.name}</span>
            <button
              onClick={() => setSelectedVendorId(null)}
              className="p-1 hover:text-white rounded-full"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {cat !== 'All' && (
          <div className="shrink-0 h-[30px] pl-3 pr-1.5 rounded-full bg-[var(--s2)] border border-[var(--bd)] flex items-center gap-1.5 text-[11px] text-[var(--t1)] font-medium">
            <Tag size={12} className="text-[var(--t3)]" />
            <span>{cat}</span>
            <button
              onClick={() => setCat('All')}
              className="p-1 hover:text-white rounded-full text-[var(--t3)]"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {brand && (
          <div className="shrink-0 h-[30px] pl-3 pr-1.5 rounded-full bg-[var(--s2)] border border-[var(--bd)] flex items-center gap-1.5 text-[11px] text-[var(--t1)] font-medium">
            <span>{brand}</span>
            <button
              onClick={() => setBrand(null)}
              className="p-1 hover:text-white rounded-full text-[var(--t3)]"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {minDiscount !== null && minDiscount !== 50 && (
          <div className="shrink-0 h-[30px] pl-3 pr-1.5 rounded-full bg-[var(--s2)] border border-[var(--bd)] flex items-center gap-1.5 text-[11px] text-[var(--t1)] font-medium">
            <span>{minDiscount}%+ Off</span>
            <button
              onClick={() => setMinDiscount(null)}
              className="p-1 hover:text-white rounded-full text-[var(--t3)]"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="shrink-0 text-[11px] text-[var(--t3)] hover:text-[var(--gold)] font-medium ml-1 transition-colors underline underline-offset-2"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[270px_1fr]">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-6 p-6 border-r border-[var(--s2)] overflow-y-auto">
          {/* Availability Switches */}
          <div>
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)] mb-3">
              AVAILABILITY
            </div>
            <div className="flex flex-col gap-2.5 bg-[var(--s1)] border border-[var(--bd)] rounded-[12px] p-3">
              {/* In Stock Switch */}
              <div
                onClick={() => setInStockOnly((v) => !v)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div>
                  <div className="text-[12px] font-medium text-[var(--t1)]">In stock only</div>
                  <div className="text-[10px] text-[var(--t3)]">Hide out of stock items</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inStockOnly}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                    inStockOnly
                      ? 'bg-[#9BD8A0]'
                      : 'bg-[var(--s2)] border border-[var(--bd)]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
                      inStockOnly ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="h-[1px] bg-[var(--bd)]" />

              {/* Open Showrooms Switch */}
              <div
                onClick={() => setOpenStoresOnly((v) => !v)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div>
                  <div className="text-[12px] font-medium text-[var(--t1)]">Open showrooms now</div>
                  <div className="text-[10px] text-[var(--t3)]">Only open for delivery today</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={openStoresOnly}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                    openStoresOnly
                      ? 'bg-[var(--gold)]'
                      : 'bg-[var(--s2)] border border-[var(--bd)]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
                      openStoresOnly ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Showrooms Filter */}
          {vendorList.length > 0 && (
            <div>
              <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)] mb-3">
                SHOWROOMS
              </div>
              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto no-scrollbar">
                <button
                  onClick={() => setSelectedVendorId(null)}
                  className={`yc flex items-center justify-between px-3 py-2 rounded-[9px] text-[12px] transition-all ${
                    !selectedVendorId
                      ? 'bg-[var(--s1)] border border-[var(--bd)] text-[var(--t1)] font-medium'
                      : 'text-[var(--t2)] hover:bg-[var(--s1)]'
                  }`}
                >
                  <span>All showrooms</span>
                  <span className="font-mono text-[10px] text-[var(--t3)]">
                    {vendorList.length}
                  </span>
                </button>

                {vendorList.map((store) => {
                  const isSelected = selectedVendorId === store.id;
                  const count = products.filter((p) => String(p.sid) === String(store.id)).length;
                  const isOpen = store.isOpen !== false;

                  return (
                    <button
                      key={store.id}
                      onClick={() => setSelectedVendorId(store.id as string)}
                      className={`yc flex items-center justify-between px-3 py-2 rounded-[9px] text-[12px] transition-all text-left ${
                        isSelected
                          ? 'bg-[var(--s1)] border border-[var(--gold)] text-[var(--gold)] font-medium'
                          : 'text-[var(--t2)] hover:bg-[var(--s1)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`w-2 h-2 shrink-0 rounded-full ${
                            isOpen
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                              : 'bg-zinc-600'
                          }`}
                          title={isOpen ? 'Open now' : 'Closed'}
                        />
                        <span className="truncate">{store.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--t3)] shrink-0">
                        {count > 0 ? count : store.count || ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          <div>
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)] mb-3">
              CATEGORY
            </div>
            <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto no-scrollbar">
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
                    className="yc flex items-center justify-between px-3 py-2 rounded-[9px] text-[12px] transition-all"
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

          {/* Discount Filter */}
          <div>
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)] mb-3">
              DISCOUNT
            </div>
            <div className="flex flex-col gap-1">
              {DISCOUNT_OPTIONS.map((opt) => {
                const isSelected = minDiscount === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setMinDiscount(opt.value)}
                    className={`yc flex items-center justify-between px-3 py-1.5 rounded-[8px] text-[12px] transition-all ${
                      isSelected
                        ? 'bg-[var(--s1)] border border-[var(--bd)] text-[var(--t1)] font-medium'
                        : 'text-[var(--t2)] hover:bg-[var(--s1)]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={13} className="text-[var(--gold)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Chips */}
          {brandNames.length > 0 && (
            <div>
              <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)] mb-3">
                BRAND
              </div>
              <div className="flex flex-wrap gap-1.5">
                {brandNames.slice(0, 12).map((bName: string) => {
                  const isSelected = brand === bName;
                  return (
                    <button
                      key={bName}
                      onClick={() => setBrand(isSelected ? null : bName)}
                      className="yc h-[28px] px-3 rounded-[8px] flex items-center text-[11px] font-medium leading-none transition-colors"
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
          )}

          {/* Assurance Box */}
          <div className="p-4 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] mt-2">
            <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--gold)]">
              EVERY LISTING IS A SHELF
            </div>
            <div className="font-normal text-[11px] leading-[1.6] text-[var(--t3)] mt-2">
              Counts come from real showrooms, not warehouses. If it shows in stock, it is ready for immediate trial.
            </div>
          </div>
        </aside>

        {/* Right Products Content */}
        <main className="flex flex-col min-w-0">
          <div className="px-4 md:px-[34px] py-4 flex items-baseline justify-between border-b border-[var(--s2)]">
            <h2 className="font-semibold text-[18px] leading-none tracking-[-0.02em] text-[var(--t1)]">
              {brand ? brand : selectedStore ? selectedStore.name : 'On the shelf now'}
            </h2>
            <span className="font-mono text-[11px] text-[var(--t3)]">
              {filtered.length} matching {hasNextPage ? '· Scroll down for more' : '· End of catalog'}
            </span>
          </div>

          {/* Product Grid / Skeleton / Error / Empty State */}
          {isError ? (
            <div className="px-4 md:px-[34px] py-10">
              <ErrorState
                title="Could not load showroom products"
                message="Failed to connect to the showroom product catalog. Please check your internet connection or retry."
                onRetry={() => refetch()}
              />
            </div>
          ) : isLoading ? (
            <div className="px-4 md:px-[34px] py-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-3.5">
              {[...Array(12)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="px-4 md:px-[34px] py-6 flex flex-col">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-3.5">
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
              <div ref={loadMoreRef} className="h-12 w-full mt-4 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="text-xs font-mono text-[var(--gold)] animate-pulse">
                    Loading more showroom products...
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Negative Case: No Results Empty State */
            <div className="px-4 md:px-[34px] py-16">
              <div className="p-8 md:p-12 rounded-[20px] border border-[var(--bd)] bg-[var(--s1)] text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-[var(--s2)] border border-[var(--bd)] flex items-center justify-center mx-auto mb-4 text-[var(--gold)]">
                  <SlidersHorizontal size={20} />
                </div>
                <div className="font-semibold text-[18px] text-[var(--t1)]">
                  No products match current filters
                </div>
                <div className="font-normal text-[12px] leading-[1.7] text-[var(--t3)] mt-2">
                  {inStockOnly || openStoresOnly
                    ? 'Some nearby showrooms might be closed right now or certain items are out of stock. Try toggling off "In stock only" or "Open showrooms now" to view upcoming inventory.'
                    : debouncedQ
                      ? `No products found across the database for "${debouncedQ}". Check spelling or explore categories.`
                      : 'Widen the filters, check spelling, or reset to explore all nearby items.'}
                </div>
                <button
                  onClick={clearFilters}
                  className="yc inline-flex h-[38px] px-6 rounded-full bg-[var(--acc)] items-center font-semibold text-[12px] text-[var(--on-acc)] mt-5 hover:opacity-90 active:scale-95 transition-all gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Clear all filters</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end md:hidden">
          <div className="w-[88%] max-w-[340px] bg-[var(--bg)] h-full overflow-y-auto flex flex-col border-l border-[var(--s2)]">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur-md px-5 py-4 border-b border-[var(--s2)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[var(--gold)]" />
                <span className="font-semibold text-[15px] text-[var(--t1)]">Filters & Sort</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[var(--gold)] text-[#0B0B0C] text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-full text-[var(--t3)] hover:text-white hover:bg-[var(--s2)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 flex flex-col gap-6 flex-1">
              {/* Availability */}
              <div>
                <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] mb-3 uppercase">
                  Availability
                </div>
                <div className="flex flex-col gap-2 bg-[var(--s1)] border border-[var(--bd)] rounded-[12px] p-3">
                  <div
                    onClick={() => setInStockOnly((v) => !v)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-[12px] font-medium text-[var(--t1)]">In stock only</div>
                      <div className="text-[10px] text-[var(--t3)]">Hide out of stock items</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inStockOnly}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                        inStockOnly ? 'bg-[#9BD8A0]' : 'bg-[var(--s2)] border border-[var(--bd)]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
                          inStockOnly ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="h-[1px] bg-[var(--bd)]" />

                  <div
                    onClick={() => setOpenStoresOnly((v) => !v)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-[12px] font-medium text-[var(--t1)]">Open showrooms now</div>
                      <div className="text-[10px] text-[var(--t3)]">Open for delivery today</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={openStoresOnly}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                        openStoresOnly ? 'bg-[var(--gold)]' : 'bg-[var(--s2)] border border-[var(--bd)]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
                          openStoresOnly ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] mb-3 uppercase">
                  Sort By
                </div>
                <div className="flex flex-col gap-1 bg-[var(--s1)] border border-[var(--bd)] rounded-[12px] p-1.5">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = sort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSort(opt.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[12px] transition-colors ${
                          isSelected
                            ? 'bg-[var(--s2)] text-[var(--gold)] font-medium'
                            : 'text-[var(--t2)]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={14} className="text-[var(--gold)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Showrooms */}
              {vendorList.length > 0 && (
                <div>
                  <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] mb-3 uppercase">
                    Showrooms
                  </div>
                  <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto no-scrollbar">
                    <button
                      onClick={() => setSelectedVendorId(null)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                        !selectedVendorId
                          ? 'bg-[var(--s2)] text-white font-medium'
                          : 'text-[var(--t2)]'
                      }`}
                    >
                      <span>All showrooms</span>
                    </button>
                    {vendorList.map((store) => {
                      const isSelected = selectedVendorId === store.id;
                      const isOpen = store.isOpen !== false;
                      return (
                        <button
                          key={store.id}
                          onClick={() => setSelectedVendorId(store.id as string)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                            isSelected
                              ? 'bg-[var(--s2)] text-[var(--gold)] font-medium'
                              : 'text-[var(--t2)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                                isOpen ? 'bg-emerald-400' : 'bg-zinc-600'
                              }`}
                            />
                            <span className="truncate">{store.name}</span>
                          </div>
                          {isSelected && <Check size={13} className="text-[var(--gold)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categories */}
              <div>
                <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] mb-3 uppercase">
                  Category
                </div>
                <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto no-scrollbar">
                  {categoryNames.map((cName) => (
                    <button
                      key={cName}
                      onClick={() => setCat(cName)}
                      className={`py-2 px-3 text-left text-xs rounded-lg flex items-center justify-between ${
                        cat === cName
                          ? 'bg-[var(--s2)] text-white font-semibold'
                          : 'text-[var(--t2)]'
                      }`}
                    >
                      <span>{cName === 'All' ? 'All products' : cName}</span>
                      {cat === cName && <Check size={13} className="text-[var(--gold)]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discounts */}
              <div>
                <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] mb-3 uppercase">
                  Discount
                </div>
                <div className="flex flex-col gap-1">
                  {DISCOUNT_OPTIONS.map((opt) => {
                    const isSelected = minDiscount === opt.value;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setMinDiscount(opt.value)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                          isSelected
                            ? 'bg-[var(--s2)] text-white font-medium'
                            : 'text-[var(--t2)]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={13} className="text-[var(--gold)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brands */}
              {brandNames.length > 0 && (
                <div>
                  <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] mb-3 uppercase">
                    Brand
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {brandNames.slice(0, 10).map((bName: string) => {
                      const isSelected = brand === bName;
                      return (
                        <button
                          key={bName}
                          onClick={() => setBrand(isSelected ? null : bName)}
                          className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-[var(--sw)] border border-[var(--bdw)] text-[var(--tw)]'
                              : 'bg-[var(--s1)] border border-[var(--bd)] text-[var(--t2)]'
                          }`}
                        >
                          {bName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div className="sticky bottom-0 bg-[var(--bg)]/95 backdrop-blur-md px-5 py-4 border-t border-[var(--s2)] flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="yc h-[40px] px-4 rounded-xl border border-[var(--bd)] text-[12px] font-medium text-[var(--t2)] hover:text-white"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="yc flex-1 h-[40px] rounded-xl bg-[var(--acc)] text-[var(--on-acc)] text-[12px] font-semibold flex items-center justify-center hover:opacity-90 active:scale-98 transition-all"
              >
                Show {filtered.length} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
