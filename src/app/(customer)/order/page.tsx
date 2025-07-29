import Menu from '@/components/order/menu';
import { PaymentActions } from './paymentActions';

export default function PublicOrderPage() {

  return (
    <Menu
      PaymentActions={PaymentActions}
    />
  );
}
