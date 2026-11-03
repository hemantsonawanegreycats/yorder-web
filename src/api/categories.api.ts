import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { Category } from '../types';
import { getCategoryPhoto } from '../utils/categoryImage';

export interface HomeTabItem {
  id: number;
  name: string;
  label: string;
  icon?: string;
  activeIcon?: string;
  filterType: string;
  filterValue: string;
  order: number;
  isActive: boolean;
}

export const fetchCategories = async (): Promise<Category[]> => {
  const resultCategories: Category[] = [];
  const seenNames = new Set<string>();

  try {
    // 1. Fetch live active customer home-tabs and resolve their photographic imagery
    const tabsResp = await apiClient.get('/user/home-tabs');
    if (tabsResp.data?.status && Array.isArray(tabsResp.data?.data)) {
      tabsResp.data.data
        .filter((t: HomeTabItem) => t.isActive && t.name !== 'home')
        .forEach((t: HomeTabItem) => {
          if (!seenNames.has(t.label.toLowerCase())) {
            seenNames.add(t.label.toLowerCase());
            resultCategories.push({
              id: t.id,
              name: t.label,
              img: getCategoryPhoto(t.label, t.icon),
            });
          }
        });
    }

    // 2. Fetch all real categories from /user/product/category/all to fill remaining slots with real icons
    if (resultCategories.length < 7) {
      const resp = await apiClient.get('/user/product/category/all');
      if (resp.data && Array.isArray(resp.data.data)) {
        resp.data.data
          .filter((c: any) => c.name && c.icon && !seenNames.has(c.name.toLowerCase()))
          .slice(0, 7 - resultCategories.length)
          .forEach((c: any) => {
            seenNames.add(c.name.toLowerCase());
            resultCategories.push({
              id: c.id,
              name: c.name,
              img: getCategoryPhoto(c.name, c.icon),
            });
          });
      }
    }
  } catch (err) {
    console.error('Failed to fetch real categories from backend:', err);
  }

  return resultCategories;
};

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};
