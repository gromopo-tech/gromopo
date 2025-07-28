import Menu from '@/components/order/menu';
import { PublicPaymentActions } from '@/components/order/paymentActions';

export default function PublicOrderPage() {

  return (
    <Menu
      PaymentActions={PublicPaymentActions}
    />
  );
}
