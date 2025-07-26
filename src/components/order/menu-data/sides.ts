import type { MenuItem } from '@/components/order/menu-types';

export const sides: MenuItem[] = [
  {
    name: 'House Potato Salad',
    description: 'Red potatoes with celery, onions, and herbs in a creamy dressing',
    price: { REGULAR: 4.99 },
    category: 'sides'
  },
  {
    name: 'Mediterranean Pasta Salad',
    description: 'Rotini pasta with feta, olives, cherry tomatoes, and herbs in a lemon vinaigrette',
    price: { REGULAR: 5.99 },
    category: 'sides'
  },
  {
    name: 'Kettle Chips',
    description: 'Crispy, thick-cut potato chips, lightly salted',
    price: { REGULAR: 2.99 },
    category: 'sides'
  },
  {
    name: 'Fresh Fruit Cup',
    description: 'Seasonal fresh fruit selection',
    price: { REGULAR: 4.49 },
    category: 'sides'
  }
];
