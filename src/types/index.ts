export interface Store {
  id: string | number;
  name: string;
  ini: string;
  cat: string;
  addr: string;
  rating: string | number;
  ratingCount?: number;
  eta: string;
  dist: string;
  count: string | number;
  hours: string;
  browsing?: string | number;
  img: string;
  repName: string;
  repIni: string;
  repLine: string;
  meta: string;
  isOnline?: boolean;
  lat?: number;
  lng?: number;
}

export interface Product {
  id: string | number;
  name: string;
  brand: string;
  cat: string;
  sid: string | number;
  price: number;
  mrp: number;
  off: string;
  img: string;
  gal: string[];
  sizes: string[];
  stock: string;
  tagOk: boolean;
  note: string;
  vendorName?: string;
  rating?: number;
  variableProducts?: any[];
}

export interface Category {
  name: string;
  img: string;
  count?: number;
  id?: number;
}

export interface FeedItem {
  ini: string;
  text: string;
  img: string;
  pid: string | number;
}

export interface ChatMessage {
  me: boolean;
  text: string;
  img?: string;
  time?: string;
}

export interface ChatThread {
  id: string;
  sid: string;
  ini: string;
  name: string;
  sub: string;
  time: string;
  preview: string;
  online: boolean;
  held: string;
  msgs: ChatMessage[];
}

export interface BagItem {
  pid: string | number;
  size: string;
  quantity?: number;
  cartItemId?: number;
  variantId?: number;
  product?: Product;
}

export interface ShowroomChapter {
  num: string;
  name: string;
  count: string;
  cat: string;
  stat: string;
  eta: string;
  img: string;
  note: string;
  sids: string[];
}

export type ThemeMode = 'dark' | 'light';
export type AppRoute = 'home' | 'products' | 'showrooms' | 'store' | 'product' | 'chat' | 'bag' | 'order' | 'profile';
