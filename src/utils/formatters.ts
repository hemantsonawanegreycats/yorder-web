import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const rupee = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return '₹0';
  const num = typeof n === 'string' ? parseFloat(n) || 0 : (typeof n === 'number' && !isNaN(n) ? n : 0);
  return '₹' + num.toLocaleString('en-IN');
};

export const formatClock = (seconds: number): string => {
  const pad = (n: number) => (n < 10 ? '0' : '') + n;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};
