export interface CartItem {
  name: string;
  description: string;
  size: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  category: string;
}