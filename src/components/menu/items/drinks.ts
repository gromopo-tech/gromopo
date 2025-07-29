import type { MenuItem } from '@/types/menu';

export const drinks: MenuItem[] = [
  {
    name: 'Craft Soda',
    description: 'Locally made artisan sodas in various flavors',
    price: { REGULAR: 3.49 },
    category: 'drinks'
  },
  {
    name: 'Iced Tea',
    description: 'Freshly brewed and lightly sweetened black tea with lemon',
    price: { REGULAR: 2.99 },
    category: 'drinks'
  },
  {
    name: 'Bottled Water',
    description: 'Spring water, still or sparkling',
    price: { REGULAR: 1.99 },
    category: 'drinks'
  },
  {
    name: 'Fresh Lemonade',
    description: 'House-made with fresh-squeezed lemons and a touch of honey',
    price: { REGULAR: 3.99 },
    category: 'drinks'
  }
];
