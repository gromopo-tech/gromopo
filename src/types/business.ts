export interface BusinessData {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
  };
}

export interface MenuCategory {
  id: string;
  category: string;
  order?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: Record<string, number> | number;
  availableSizes?: string[];
}

export interface MenuData {
  categories: (MenuCategory & { items: MenuItem[] })[];
}
