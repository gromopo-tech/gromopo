export type MenuCategory = 'signature nooners' | 'hot nooners' | 'sides' | 'drinks';
export type PriceType = number | Record<string, number>;
export type ItemSize = 'FULL' | 'MINI' | string;

export interface MenuItem {
  name: string;
  description: string;
  price: PriceType;
  category?: string;
  availableSizes?: string[];
}

export interface MenuFile {
  name: string;
  fullPath: string;
  url: string;
}

export interface MenuError extends Error {
  code?: string;
}

