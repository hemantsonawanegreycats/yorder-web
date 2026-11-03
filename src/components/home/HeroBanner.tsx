import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useRecentActivityQuery } from '../../api/activity.api';
import { useHomeBannerQuery } from '../../api/metadata.api';
import { formatClock } from '../../utils/formatters';

export const HeroBanner: React.FC = () => {
  const { go, setPid, showToast, deliverTo } = useAppStore();
  const { data: feed } = useRecentActivityQuery();
  const { data: banner } = useHomeBannerQuery();

  // 8009s countdown ticking clock
  const [secondsLeft, setSecondsLeft] = useState(8009);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 8009));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShopDrop = () => {
    if (feed && feed.length > 0 && feed[0].pid) {
      setPid(feed[0].pid);
      go('product', { pid: feed[0].pid });
    } else {
      go('products');
    }
  };

  const handleRemindMe = () => {
    showToast('Reminder set for 6 PM');
  };

  const heroImage = banner?.image_url || '/assets/hero-drop.jpg';
  const heroName = banner?.name || 'The Suede Faded Archive';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[1px] bg-[var(--s2)] border-b border-[var(--s2)]">
      {/* Left: Hero Live Drop Banner */}
      <div className="relative min-h-[460px] md:h-[500px] overflow-hidden bg-[#0E0C09] flex flex-col justify-between p-6 md:p-10">
        <img
          src={heroImage}
          alt={heroName}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/75 to-transparent pointer-events-none" />

        {/* Live Drop Pill Badge */}
        <div className="relative z-10 self-start flex items-center gap-2 px-[13px] py-[7px] rounded-[20px] bg-[#0B0B0C]/70 backdrop-blur-[8px] border border-[#C8A06A]/40 shadow-sm">
          <span className="w-[6px] h-[6px] rounded-full bg-[#C8A06A] animate-pulse" />
          <span className="font-medium text-[9px] leading-none tracking-[0.16em] text-[#E7D9C1]">
            LIVE DROP · {formatClock(secondsLeft)}
          </span>
        </div>

        {/* Hero Copy & CTA */}
        <div className="relative z-10 max-w-[560px] mt-12 md:mt-0">
          <div className="font-medium text-[9.5px] leading-none tracking-[0.18em] text-[#C8A06A] mb-4">
            SUPERKICKS · LINKING ROAD · 1.2 KM AWAY
          </div>
          <h1 className="font-light text-[40px] md:text-[58px] leading-[1] tracking-[-0.04em] text-[#F7F3EC] mb-[22px]">
            {banner?.name ? (
              <span className="font-semibold">{banner.name}</span>
            ) : (
              <>
                The Suede
                <br />
                <span className="font-semibold">Faded Archive</span>
              </>
            )}
          </h1>

          <div className="flex flex-wrap items-center gap-3 md:gap-[18px]">
            <button
              onClick={handleShopDrop}
              className="yc h-[46px] px-[26px] rounded-[23px] bg-[#F2ECE1] flex items-center font-semibold text-[13px] leading-none text-[#0B0B0C] hover:opacity-90 active:scale-95 shadow-md"
            >
              Shop the drop
            </button>
            <button
              onClick={handleRemindMe}
              className="yc h-[46px] px-[24px] rounded-[23px] border border-white/25 flex items-center font-semibold text-[13px] leading-none text-[#F2EEE6] hover:bg-white/10 active:scale-95"
            >
              Remind me at 6 PM
            </button>
            <div className="w-full sm:w-auto font-normal text-[11.5px] leading-[1.4] text-[#9A968E] mt-2 sm:mt-0">
              40 pairs left
              <br />
              Followers get 30 min head start
            </div>
          </div>
        </div>
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
            {(feed && feed.length > 0) ? (
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
                  <div className="w-[34px] h-[34px] rounded-[9px] overflow-hidden relative bg-[var(--s1)] flex-shrink-0 border border-[var(--bd)]">
                    <img
                      src={item.img}
                      alt=""
                      className="w-full h-full object-cover"
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
                2,840 orders in {deliverTo || 'Bandra'} this week
              </span>
              <button
                onClick={() => go('products')}
                className="yc font-medium text-[10.5px] text-[var(--gold)] hover:underline"
              >
                See the feed
              </button>
            </div>
          </div>
        </div>

        {/* 2 Local Stats Columns */}
        <div className="grid grid-cols-2 gap-[1px] bg-[var(--s2)]">
          <div className="p-[22px] md:p-[24px] bg-[var(--bg)]">
            <div className="font-semibold text-[22px] leading-none font-mono tracking-[-0.02em] text-[var(--t1)]">
              34
            </div>
            <div className="font-normal text-[10.5px] leading-[1.5] text-[var(--t3)] mt-2">
              showrooms open
              <br />
              within 4 km
            </div>
          </div>
          <div className="p-[22px] md:p-[24px] bg-[var(--bg)]">
            <div className="font-semibold text-[22px] leading-none font-mono tracking-[-0.02em] text-[var(--t1)]">
              98 min
            </div>
            <div className="font-normal text-[10.5px] leading-[1.5] text-[var(--t3)] mt-2">
              median door time
              <br />
              in your pin code
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
