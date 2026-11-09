import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useVendorsQuery } from '../../api/vendors.api';
import { StoreCardSkeleton, ErrorState } from '../common/Skeleton';

export const ShowroomsPreview: React.FC = () => {
  const { go, setSid } = useAppStore();
  const { data: stores, isLoading, isError, refetch } = useVendorsQuery();

  const displayStores = Object.values(stores || {}).slice(0, 3);

  const handleOpenStore = (storeId: string | number) => {
    setSid(storeId);
    go('store', { sid: storeId });
  };

  return (
    <section className="px-4 md:px-[34px] py-[34px]">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[22px] md:text-[26px] leading-none tracking-[-0.025em] text-[var(--t1)]">
            Showrooms near you
          </h2>
          <div className="font-normal text-[12px] leading-[1.5] text-[var(--t3)] mt-2">
            Real stores, real stock, counted by hand
          </div>
        </div>
        <button
          onClick={() => go('showrooms')}
          className="yc font-medium text-[11px] leading-none text-[var(--gold)] hover:underline"
        >
          Open the index
        </button>
      </div>

      {isError ? (
        <ErrorState
          title="Could not load showrooms"
          message="Failed to connect to local showroom registry. Please retry."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
          {[...Array(3)].map((_, i) => (
            <StoreCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
          {displayStores.map((s) => s && (
            <div
              key={s.id}
              onClick={() => handleOpenStore(s.id)}
              className="yc flex items-center gap-[14px] p-[14px] rounded-[16px] bg-[var(--s1)] border border-[var(--bd)] hover:border-[var(--bd2)] transition-colors cursor-pointer group"
            >
              <div className="w-[64px] h-[64px] rounded-[12px] overflow-hidden relative bg-[var(--s2)] flex-shrink-0 border border-[var(--bd)]">
                <img
                  src={s.img}
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-[13.5px] leading-[1.1] text-[var(--t1)] group-hover:text-[var(--gold)] transition-colors truncate">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.isOpen !== false ? 'bg-[var(--ok)] animate-pulse' : 'bg-neutral-500'}`} />
                  <span className="truncate">{s.name}</span>
                </div>
                <div className="font-normal text-[10.5px] leading-[1.5] text-[var(--t3)] mt-[6px] truncate">
                  <span className={s.isOpen !== false ? 'text-[var(--ok)] font-medium' : 'text-neutral-400 font-medium'}>{s.hours}</span> · {s.meta}
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <div className="font-mono font-medium text-[12px] leading-none text-[var(--gold)]">
                  ★ {s.rating}
                </div>
                <div className="font-normal text-[9.5px] leading-none text-[var(--t3)] mt-[7px]">
                  {s.isOpen !== false ? s.eta : 'Closed'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
