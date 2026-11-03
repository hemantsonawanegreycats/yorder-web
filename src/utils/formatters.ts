import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const rupee = (n: number | string): string => {
  const num = typeof n === 'string' ? parseFloat(n) || 0 : n;
  return '₹' + num.toLocaleString('en-IN');
};

export const formatClock = (seconds: number): string => {
  const pad = (n: number) => (n < 10 ? '0' : '') + n;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};
