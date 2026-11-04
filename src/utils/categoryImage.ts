/**
 * Category photo resolver matching Yorder-Cutsomer-1/utils/categoryImage.ts
 * Replaces tab-bar monochrome vector icons with official high-resolution category photography.
 */

const CATEGORY_ASSET_MAP: Record<string, string> = {
  'daily & wellness': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  wellness: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
  fashion: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
  apparel: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
  clothing: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
  electronics: '/assets/images/Products/headphones.jpg',
  phones: '/assets/images/Products/iphone.jpg',
  mobile: '/assets/images/Products/iphone.jpg',
  sports: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  decor: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
  'personal care': '/assets/images/categories/Personal%20%20Care.png',
  personal: '/assets/images/categories/Personal%20%20Care.png',
  care: '/assets/images/categories/Personal%20%20Care.png',
  'skin care': '/assets/images/store/skincare.jpg',
  skincare: '/assets/images/store/skincare.jpg',
  toys: '/assets/images/Products/gamepad.jpg',
  games: '/assets/images/Products/gamepad.jpg',
  gaming: '/assets/images/Products/gamepad.jpg',
  watches: '/assets/images/Products/apple-watch.jpg',
  footwear: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
  sneakers: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
  streetwear: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
  stationery: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
  pets: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
  paan: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
  liquor: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
};

// Known IDs of outline line vector icons uploaded to /user/home-tabs
const VECTOR_TAB_ICONS = [
  '1778672770712',
  '1778672788719',
  '1778670975623',
  '1778670852862',
  '1778584341470',
  '1778580008245',
  '1778672810436',
  '1778672823716',
  '1778584387496',
  '1778580090761',
  '1778580524618',
];

export function getCategoryPhoto(categoryName: string, remoteIcon?: string | null): string {
  const lower = (categoryName || '').toLowerCase().trim();

  // 1. Check if we have an official high-resolution photographic image for this category
  for (const [key, assetPath] of Object.entries(CATEGORY_ASSET_MAP)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) {
      return assetPath;
    }
  }

  // 2. Otherwise fallback to remoteIcon if it's a valid remote URL and not a known outline icon
  const isVector =
    remoteIcon && VECTOR_TAB_ICONS.some((vId) => remoteIcon.includes(vId));

  if (
    remoteIcon &&
    !isVector &&
    (remoteIcon.startsWith('http://') || remoteIcon.startsWith('https://'))
  ) {
    return remoteIcon;
  }

  return '/assets/images/categories/Personal  Care.png';
}
