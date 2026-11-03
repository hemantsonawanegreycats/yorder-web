import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useProductsQuery } from '../../api/products.api';
import { useVendorsQuery } from '../../api/vendors.api';
import { ProductCard } from '../common/ProductCard';
import { ProductCardSkeleton, ErrorState } from '../common/Skeleton';

export const NewArrivals: React.FC = () => {
  const { go } = useAppStore();
  const { data: products, isLoading, isError, refetch } = useProductsQuery({ limit: 10 });
  const { data: stores } = useVendorsQuery();

  const displayList = (products || []).slice(0, 5);

  return (
    <section className="px-4 md:px-[34px] py-[34px] border-b border-[var(--s2)]">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[22px] md:text-[26px] leading-none tracking-[-0.025em] text-[var(--t1)]">
            New in near you
          </h2>
          <div className="font-normal text-[12px] leading-[1.5] text-[var(--t3)] mt-2">
            Landed at 6 showrooms this week
          </div>
        </div>
        <button
          onClick={() => go('products')}
          className="yc font-medium text-[11px] leading-none text-[var(--gold)] hover:underline"
        >
          See all products
        </button>
      </div>

      {isError ? (
        <ErrorState
          title="Could not load new arrivals"
          message="Failed to connect to showroom inventory. Please retry."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-[18px]">
          {[...Array(5)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-[18px]">
          {displayList.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              store={stores ? stores[product.sid] : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
};
