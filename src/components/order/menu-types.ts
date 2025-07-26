'use client';

export type Sandwichesize = 'FULL' | 'MINI';
export type MenuCategory = 'signature' | 'hot' | 'sides' | 'drinks';
export type PriceType = { [key in Sandwichesize]?: number } | { REGULAR: number };
export type ItemSize = Sandwichesize | 'REGULAR';

export interface SandwichItem {
  name: string;
  description: string;
  price: { [key in Sandwichesize]?: number };
}

export interface MenuItem {
  name: string;
  description: string;
  price: PriceType;
  category: MenuCategory;
}
