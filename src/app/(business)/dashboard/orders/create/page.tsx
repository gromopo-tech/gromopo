import Menu from '@/components/order/menu';
import { PaymentActions } from './paymentActions';

export default function CreateOrderPage() {
  return (
      <Menu
        PaymentActions={PaymentActions}
      />
    );
  }