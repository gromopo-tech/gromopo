import Menu from '@/components/order/menu';
import { PrivatePaymentActions } from '@/components/order/paymentActions';

export default function CreateOrderPage() {
  return (
      <Menu
        PaymentActions={PrivatePaymentActions}
      />
    );
  }