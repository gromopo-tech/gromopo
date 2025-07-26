import type { MenuItem } from '@/components/order/menu-types';

export const signatureSandwiches: MenuItem[] = [
  {
    name: 'The Duckling',
    description: 'Smoked duck breast,roasted turkey breast, cream cheese, cranberry relish & spring mix on cranberry walnut country bread',
    price: { FULL: 13.99, MINI: 7.99 },
    category: 'signature'
  },
  {
    name: 'The BTC',
    description: 'Dried cured smoked ham, tomato, Swiss cheese, lettuce, mayo and spicybrown mustard',
    price: { FULL: 14.99, MINI: 8.59 },
    category: 'signature'
  },
  {
    name: 'Vermont Treat',
    description: 'Honey glazed ham, pine nuts, spinach, sliced apples, Duck and Decanter\'s famous cheddar cheese spread on multigrain bread',
    price: { FULL: 12.99, MINI: 6.99 },
    category: 'signature'
  },
  {
    name: 'The Genoa',
    description: 'Genoa salami, garlic and herb cheese spread, fresh spinach, marinated tomatoes on French bread',
    price: { FULL: 9.59, MINI: 5.99 },
    category: 'signature'
  },
  {
    name: 'The Pocket',
    description: 'Coleslaw, pine nuts, shredded cheese and your choice of meat tucked in a pita - add $2 to the price of the meat version on the menu',
    price: { FULL: 9.99, MINI: 5.99 },
    category: 'signature'
  },
  {
    name: 'Fiery Italian',
    description: 'Roasted turkey breast, Genoa salami, provolone, red onions, spinach, tomatoes, Sicilian pepper relish, mayo, and spicy brown mustard on French bread',
    price: { FULL: 9.99, MINI: 5.99 },
    category: 'signature'
  },
  {
    name: 'Briesciutto',
    description: 'Prosciutto, brie, sautéed sun-dried tomatoes and champagne mustard on French bread',
    price: { FULL: 12.99, MINI: 7.99 },
    category: 'signature'
  },
  {
    name: 'Pennsylvania Dutch Treat',
    description: 'Traditional Pennsylvania Dutch bologna, Swiss cheese, sauerkraut relish and champagne mustard on dark rye',
    price: { FULL: 8.59, MINI: 5.99 },
    category: 'signature'
  }
];
