'use client';

import Menu from '@/components/menu/menu';
import OrderDetails from '@/components/order/order-details';
import { PaymentActions } from './paymentActions';
import { useCart } from '@/components/order/hooks/use-cart';

export default function PublicOrderPage() {
  const {
    cart,
    total,
    customerName,
    setCustomerName,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();

  return (
    <div className="p-4 max-w-6xl mx-auto grid grid-cols-1 gap-8">
      <div>
        <Menu onAddToCart={addToCart} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <OrderDetails
          cart={cart}
          total={total}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          onRemoveFromCart={removeFromCart}
        />
        
        <PaymentActions
          total={total}
          cart={cart}
          customerName={customerName}
          clearCart={clearCart}
        />
      </div>
    </div>
  );
}