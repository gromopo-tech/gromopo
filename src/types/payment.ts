import { CartItem } from './cart';

export interface PaymentProps {
  solTotal: number;
  arsTotal?: number;
  cart?: CartItem[];
  customerName?: string;
  businessId?: string;
  businessName?: string;
  orderType?: 'retirar' | 'comer en el lugar';
  onSuccess?: (txSignature: string | null) => void;
  onError?: () => void;
  clearCart: () => void;
}