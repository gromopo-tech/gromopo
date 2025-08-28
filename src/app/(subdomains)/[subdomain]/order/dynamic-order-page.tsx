'use client';

import DynamicMenu from '@/components/menu/dynamic-menu';
import OrderDetails from '@/components/order/order-details';
import { DynamicPaymentActions } from './dynamic-payment-actions';
import { useCart } from '@/components/order/hooks/use-cart';
import { BusinessData, MenuData, MenuItem } from '@/types/business';

interface DynamicOrderPageProps {
  business: BusinessData;
  menuData: MenuData;
  subdomain: string;
}

export default function DynamicOrderPage({ business, menuData, subdomain }: DynamicOrderPageProps) {
  const {
    cart,
    total,
    customerName,
    setCustomerName,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleAddToCart = (item: MenuItem & { category: string }, size: string) => {
    // Convert the dynamic menu item to the format expected by useCart
    const cartItem = {
      name: item.name,
      description: item.description,
      price: item.price,
      availableSizes: item.availableSizes,
      category: item.category,
    };
    
    addToCart(cartItem, size);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Debug information */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800">🚀 Dynamic System Active</h3>
        <p className="text-blue-600 text-sm">
          Business: {business.name} | Categories: {menuData.categories.length}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          {menuData.categories.length > 0 ? (
            <DynamicMenu 
              categories={menuData.categories} 
              onAddToCart={handleAddToCart} 
            />
          ) : (
            <div className="p-8 text-center bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Menu Items Found</h3>
              <p className="text-yellow-600">
                The menu for {business.name} hasn't been set up in Firestore yet.
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OrderDetails
            cart={cart}
            total={total}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            onRemoveFromCart={removeFromCart}
          />
          
          <DynamicPaymentActions
            total={total}
            cart={cart}
            customerName={customerName}
            businessId={business.id}
            businessName={business.name}
            subdomain={subdomain}
            clearCart={clearCart}
          />
        </div>
      </div>
    </div>
  );
}
