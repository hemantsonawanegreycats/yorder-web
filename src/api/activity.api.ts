import { useQuery } from '@tanstack/react-query';
import { publicClient } from './client';
import { FeedItem } from '../types';

export interface RecentActivityItem {
  orderId: number;
  location: string;
  timeAgo: string;
  message: string;
  product: {
    id: number;
    name: string;
    image: string;
    price: number;
    sellPrice: number;
  };
  vendor?: {
    id: number;
    name: string;
    icon?: string | null;
  } | null;
}

export const fetchRecentActivity = async (): Promise<FeedItem[]> => {
  try {
    const resp = await publicClient.get('/open/orders/recent-activity', {
      params: { limit: 10 },
    });
    if (resp.data && Array.isArray(resp.data.data)) {
      return resp.data.data.map((item: RecentActivityItem) => {
        const words = item.message.split(' ');
        const nameGuess = words[0] === 'Someone' ? (item.location ? `${item.location} shopper` : 'Shopper') : words[0];
        const ini = nameGuess.slice(0, 2).toUpperCase() || 'SH';

        return {
          ini,
          text: item.message,
          img: item.product?.image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=70',
          pid: String(item.product.id),
        };
      });
    }
  } catch (err) {
    console.error('Failed to fetch real recent activity from backend:', err);
  }
  return [];
};

export const useRecentActivityQuery = () => {
  return useQuery({
    queryKey: ['recentActivity'],
    queryFn: fetchRecentActivity,
    staleTime: 30 * 1000,
    refetchInterval: 45 * 1000,
  });
};
