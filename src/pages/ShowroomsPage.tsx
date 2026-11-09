import React, { useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useVendorsQuery } from '../api/vendors.api';
import { StoreCardSkeleton, ErrorState } from '../components/common/Skeleton';
import { SEO } from '../components/common/SEO';
import { Store } from '../types';
import { MumbaiShowroomMap } from '../components/showroom/MumbaiShowroomMap';

export const ShowroomsPage: React.FC = () => {
  const { go, setSid, idx, setIdx } = useAppStore();
  const { data: stores, isLoading, isError, refetch } = useVendorsQuery();

  const storeList: Store[] = useMemo(() => Object.values(stores || {}), [stores]);

  const chapters = useMemo(() => {
    if (storeList.length === 0) return [];
    const catMap = new Map<string, Store[]>();
    storeList.forEach((s) => {
      const list = catMap.get(s.cat) || [];
      list.push(s);
      catMap.set(s.cat, list);
    });

    return Array.from(catMap.entries()).map(([catName, vList], i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        num,
        name: catName,
        count: String(vList.length),
        cat: catName,
        stat: `${vList.length} SHOWROOMS · LIVE STOCK`,
        eta: vList[0]?.eta || '45 min',
        img: vList[0]?.img || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=75',
        note: `Verified on the shop floor at ${vList[0]?.name || 'local showroom'}. Stock counted by hand.`,
        sids: vList.map((s) => s.id),
      };
    });
  }, [storeList]);

  const chapter = chapters[idx] || chapters[0] || {
    num: '01',
    name: 'Showrooms',
    count: String(storeList.length),
    cat: 'Showrooms',
    stat: `${storeList.length} STORES LIVE`,
    eta: '45 min',
    img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=75',
    note: 'Real local showrooms counted by hand.',
    sids: storeList.map((s) => s.id),
  };

  const handleOpenStore = (storeId: string | number) => {
    setSid(storeId);
    go('store', { sid: storeId });
  };

  return (
    <div className="flex flex-col w-full">
      <SEO
        title="Showrooms & Shelves Near You in Bandra, Mumbai | Yorder"
        description="Local fashion, tech, watch, and beauty showrooms within Bandra. Real stores, real stock, counted by hand."
        canonical="https://yorder.com/showrooms"
        ogImage="/assets/logo-dark.png"
      />

      {/* Top Split Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-[var(--s2)] border-b border-[var(--s2)]">
        {/* Left Editorial Info */}
        <div className="bg-[var(--bg)] p-6 md:p-[44px_34px] flex flex-col justify-center">
          <div className="font-medium text-[9px] leading-none tracking-[0.18em] text-[var(--gold)]">
            {storeList.length} SHOWROOMS · 4 KM RADIUS
          </div>
          <h1 className="font-light text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.04em] text-[var(--t1)] mt-[18px]">
            An index of
            <br />
            <span className="font-semibold">every shelf near you</span>
          </h1>
          <p className="font-normal text-[13px] leading-[1.7] text-[var(--t3)] mt-5 max-w-[52ch]">
            Counted by the people who work there, not a warehouse feed. Real local showrooms in Mumbai with live inventory.
          </p>
          <div className="flex items-center gap-3 mt-[26px]">
            <button
              onClick={() => go('products')}
              className="yc h-[46px] px-[26px] rounded-[23px] bg-[var(--acc)] flex items-center font-semibold text-[13px] text-[var(--on-acc)] hover:opacity-90 active:scale-95 shadow-md"
            >
              Browse the shelves
            </button>
          </div>
        </div>

        {/* Right Interactive Mumbai Showroom Map */}
        <div className="relative min-h-[360px] md:min-h-[400px] overflow-hidden">
          <MumbaiShowroomMap stores={storeList} onSelectStore={handleOpenStore} />
        </div>
      </div>

      {/* Two-Column Index Section */}
      <div className="grid grid-cols-1 md:grid-cols-[232px_1fr]">
        {/* Left: The Index List */}
        <aside className="p-6 md:p-[28px_24px] border-r border-[var(--s2)] flex flex-col gap-4">
          <div className="font-medium text-[9px] leading-none tracking-[0.16em] text-[var(--t3)]">
            THE INDEX
          </div>
          <div className="flex flex-col gap-[2px]">
            {chapters.map((r, i) => {
              const isSelected = idx === i;
              return (
                <button
                  key={r.num}
                  onClick={() => setIdx(i)}
                  className="yc flex items-center gap-[11px] p-[10px_11px] rounded-[9px] text-[12px] text-left transition-all"
                  style={{
                    background: isSelected ? 'var(--s1)' : 'transparent',
                    border: isSelected ? '1px solid var(--bd)' : '1px solid transparent',
                    color: isSelected ? 'var(--t1)' : 'var(--t2)',
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  <span className="font-mono font-medium text-[10px] text-[var(--gold)] flex-shrink-0">
                    {r.num}
                  </span>
                  <span className="flex-1 leading-snug">{r.name}</span>
                  <span className="text-[9.5px] text-[var(--t3)] flex-shrink-0">
                    {r.count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: Chapter Detail */}
        <main className="p-6 md:p-[28px_34px_44px] flex flex-col">
          {isError ? (
            <ErrorState
              title="Could not load showrooms"
              message="Failed to connect to the showroom network. Please verify your connection or retry."
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <div className="flex flex-col gap-4">
              <StoreCardSkeleton />
              <StoreCardSkeleton />
            </div>
          ) : (
            <>
              {/* Top Divider with Stats */}
              <div className="flex items-center gap-[14px] mb-4">
            <span className="font-mono font-medium text-[11px] text-[var(--gold)]">
              {chapter.num}
            </span>
            <span className="flex-1 h-[1px] bg-[var(--s2)]" />
            <span className="font-medium text-[9px] tracking-[0.16em] text-[var(--t3)] uppercase">
              {chapter.stat}
            </span>
          </div>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-[18px]">
            <h2 className="font-semibold text-[24px] md:text-[28px] leading-none tracking-[-0.03em] text-[var(--t1)]">
              {chapter.name}
            </h2>
            <div className="font-normal text-[11px] text-[var(--t3)]">
              median {chapter.eta} to your door
            </div>
          </div>

          {/* Chapter Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 md:gap-[22px]">
            {/* Left Atmospheric Image Quote Card */}
            <div className="relative rounded-[18px] overflow-hidden bg-[var(--s1)] min-h-[260px] flex flex-col justify-end p-5 border border-[var(--bd)]">
              <img
                src={chapter.img}
                alt={chapter.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/95 via-[#0B0B0C]/40 to-transparent pointer-events-none" />
              <div className="relative z-10 font-normal text-[11.5px] leading-[1.5] text-[#CFCBC3] max-w-[34ch]">
                {chapter.note}
              </div>
            </div>

            {/* Right Showrooms List */}
            <div className="flex flex-col">
              {chapter.sids.map((sidKey) => {
                const s = stores ? stores[sidKey] : null;
                if (!s) return null;

                const isOpen = s.isOpen !== false;

                return (
                  <div
                    key={sidKey}
                    onClick={() => handleOpenStore(sidKey)}
                    className="yc flex items-center gap-[14px] py-[15px] border-t border-[var(--s2)] cursor-pointer group"
                  >
                    <span
                      className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
                        isOpen ? 'bg-[var(--ok)] animate-pulse' : 'bg-neutral-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[13.5px] leading-none text-[var(--t1)] group-hover:text-[var(--gold)] transition-colors truncate">
                        {s.name}
                      </div>
                      <div className="font-normal text-[10.5px] leading-none text-[var(--t3)] mt-[7px] truncate">
                        <span className={isOpen ? 'text-[var(--ok)] font-medium' : 'text-neutral-400'}>
                          {s.hours}
                        </span>
                        {s.count ? ` · ${s.count} items` : ''} · {s.eta} to your door
                      </div>
                    </div>
                    <span className="font-mono font-medium text-[11.5px] text-[var(--gold)] flex-shrink-0">
                      ★ {s.rating}
                    </span>
                    <span className="text-[14px] text-[var(--bd2)] group-hover:text-[var(--t1)] transition-colors">
                      ›
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
      </div>
    </div>
  );
};
