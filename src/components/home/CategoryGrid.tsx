import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useCategoriesQuery } from '../../api/categories.api';
import { getCategoryPhoto } from '../../utils/categoryImage';
import { CategoryItemSkeleton, ErrorState } from '../common/Skeleton';

export const CategoryGrid: React.FC = () => {
  const { go, setCat, setBrand, setQ } = useAppStore();
  const { data: categories, isLoading, isError, refetch } = useCategoriesQuery();

  const handleSelectCategory = (name: string) => {
    setCat(name);
    setBrand(null);
    setQ('');
    go('products');
  };

  const displayCategories = (categories || []).slice(0, 7);

  return (
    <section className="px-4 md:px-[34px] py-[34px] border-b border-[var(--s2)]">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-semibold text-[22px] md:text-[26px] leading-none tracking-[-0.025em] text-[var(--t1)]">
          Browse
        </h2>
        <span className="font-medium text-[9.5px] leading-none tracking-[0.14em] text-[var(--t3)] uppercase">
          {displayCategories.length} CATEGORIES LIVE
        </span>
      </div>

      {isError ? (
        <ErrorState
          title="Could not load categories"
          message="Failed to fetch categories from showroom inventory. Please retry."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 md:gap-[14px]">
          {[...Array(7)].map((_, i) => (
            <CategoryItemSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 md:gap-[14px]">
          {displayCategories.map((c) => (
            <div
              key={c.name}
              onClick={() => handleSelectCategory(c.name)}
              className="yc flex flex-col gap-[10px] cursor-pointer group"
            >
              <div className="relative aspect-square rounded-[14px] overflow-hidden bg-[var(--sw)] border border-[var(--bd)] group-hover:border-[var(--gold)] transition-colors">
                <img
                  src={c.img}
                  alt={c.name}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = getCategoryPhoto(c.name);
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/60 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="font-medium text-[11.5px] leading-none text-[var(--t2)] text-center group-hover:text-[var(--gold)] transition-colors">
                {c.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
