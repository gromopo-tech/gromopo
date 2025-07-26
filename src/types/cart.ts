import { ItemSize } from '@/components/order/menu-types';

export interface CartItem {
  name: string;
  description: string;
  size: ItemSize;
  price: number;
}