import type { MenuItem } from '@/components/order/menu-types';

export const hotSandwiches: MenuItem[] = [
  {
    name: 'The Hot One',
    description: 'Swedish style beef brisket with shredded cheese and horseradish. We recommend French bread, ciabatta, kaiser or onion roll',
    price: { FULL: 13.99, MINI: 7.99 },
    category: 'hot'
  },
  {
    name: 'Classic Reuben',
    description: 'Pastrami, Swiss cheese, sauerkraut relish and Thousand Island dressing on toasted light rye',
    price: { FULL: 14.99, MINI: 8.99 },
    category: 'hot'
  },
  {
    name: 'The D.A.M. Sandwich',
    description: 'Pulled pork roast rubbed with Southwestern spice and marinated in jalapeno and onion barbecue sauce and topped with the Duck’s famous coleslaw and served on an onion roll',
    price: { FULL: 9.99, MINI: 5.99 },
    category: 'hot'
  },
  {
    name: 'The Smokey',
    description: 'Melted smoked mozzarella on top of imported ham with mayo (or butter), tomatoes, spinach and black pepper on toasted ciabatta',
    price: { FULL: 9.59, MINI: 5.99 },
    category: 'hot'
  }
];
