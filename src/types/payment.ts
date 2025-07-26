import { CartItem } from './cart';

export interface PaymentProps {
  total: number;
  cart?: CartItem[];
  customerName?: string;
  businessId?: string;
  businessName?: string;
  orderType?: 'retirar' | 'comer en el lugar';
  onSuccess?: (txSignature: string | null) => void;
  onError?: () => void;
  clearCart: () => void;
}