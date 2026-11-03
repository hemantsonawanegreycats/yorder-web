import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-xl',
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-[var(--s2)]/70 ${rounded} ${className}`}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
      }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-[20px] bg-[var(--s0)] border border-[var(--bd)]">
      <Skeleton className="w-full aspect-[0.95] rounded-[16px]" />
      <div className="flex flex-col gap-2 p-1">
        <Skeleton className="w-24 h-3 rounded-md" />
        <Skeleton className="w-full h-4 rounded-md" />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--s2)]">
          <Skeleton className="w-16 h-4 rounded-md" />
          <Skeleton className="w-14 h-7 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const StoreCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-[22px] bg-[var(--s0)] border border-[var(--bd)]">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="w-32 h-4 rounded-md" />
          <Skeleton className="w-48 h-3 rounded-md" />
        </div>
      </div>
      <Skeleton className="w-full h-32 rounded-[16px] mt-2" />
      <div className="flex justify-between mt-2">
        <Skeleton className="w-20 h-4 rounded-md" />
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
    </div>
  );
};

export const BagItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 rounded-[18px] bg-[var(--s1)] border border-[var(--bd)]">
      <Skeleton className="w-20 h-20 rounded-[14px] flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="w-3/4 h-4 rounded-md" />
        <Skeleton className="w-1/3 h-3 rounded-md" />
        <Skeleton className="w-20 h-4 rounded-md mt-1" />
      </div>
      <Skeleton className="w-24 h-8 rounded-full flex-shrink-0" />
    </div>
  );
};

export const OrderTrackerSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-6 rounded-[22px] bg-[var(--s0)] border border-[var(--bd)]">
      <div className="flex justify-between items-center">
        <Skeleton className="w-32 h-4 rounded-md" />
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-8 rounded-lg" />
      <Skeleton className="w-full h-3 rounded-md" />
      <div className="flex justify-between mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-12 h-3 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const StoreHeaderSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col border-b border-[var(--s2)] pb-6 mb-6">
      <Skeleton className="w-full h-[220px] md:h-[280px] rounded-b-[28px]" />
      <div className="px-4 md:px-[34px] -mt-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <Skeleton className="w-24 h-24 rounded-[20px] border-4 border-[var(--bg)]" />
          <div className="flex flex-col gap-2 pb-1">
            <Skeleton className="w-48 h-6 rounded-md" />
            <Skeleton className="w-64 h-3.5 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-28 h-9 rounded-full" />
          <Skeleton className="w-28 h-9 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 w-full">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="w-16 h-4 rounded-md" />
        <span className="text-[var(--t3)]">/</span>
        <Skeleton className="w-24 h-4 rounded-md" />
        <span className="text-[var(--t3)]">/</span>
        <Skeleton className="w-32 h-4 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left: Gallery */}
        <div className="flex flex-col gap-4">
          <Skeleton className="w-full aspect-square rounded-[24px]" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-[12px]" />
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <Skeleton className="w-28 h-5 rounded-full" />
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>

          <Skeleton className="w-4/5 h-8 rounded-lg" />
          <Skeleton className="w-32 h-7 rounded-md" />

          <div className="flex flex-col gap-2 pt-2">
            <Skeleton className="w-20 h-3 rounded-md" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-14 h-9 rounded-[10px]" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Skeleton className="w-full h-12 rounded-full" />
            <Skeleton className="w-full h-12 rounded-full" />
          </div>

          <Skeleton className="w-full h-24 rounded-[16px] mt-2" />
        </div>
      </div>
    </div>
  );
};

export const CategoryItemSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-[10px] items-center">
      <Skeleton className="w-full aspect-square rounded-[14px]" />
      <Skeleton className="w-16 h-3 rounded-md" />
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not fetch data from the showroom database. Please check your connection or try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-[24px] bg-[var(--s0)] border border-red-500/20 text-center gap-3.5 my-6 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-base text-[var(--t1)]">{title}</h3>
      <p className="text-xs text-[var(--t3)] max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-5 py-2.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
