'use client';

import Menu from '@/components/menu/menu';
import OrderDetails from '@/components/order/order-details';
import { Payments } from './payments';
import { useCart } from '@/components/order/hooks/use-cart';
import { BusinessData, MenuData, MenuItem } from '@/types/business';
import { MobileWalletSelector } from '@/components/mobile/mobile-wallet-selector';
import { useState } from 'react';

interface OrderProps {
  business: BusinessData;
  menuData: MenuData;
  orderUrl: string;
}

export default function Order({ business, menuData, orderUrl }: OrderProps) {
  const [showMobileWalletSelector, setShowMobileWalletSelector] = useState(true);
  
  const {
    cart,
    total,
    customerName,
    setCustomerName,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleAddToCart = (item: MenuItem & { category: string }, size: string, quantity: number, specialInstructions: string) => {
    // Get the price for the selected size
    let price: number;
    if (typeof item.price === 'object' && item.price !== null) {
      price = (item.price as Record<string, number>)[size] || 0;
    } else {
      price = item.price as number;
    }

    // Convert the dynamic menu item to the format expected by useCart
    const cartItem = {
      name: item.name,
      description: item.description,
      size,
      price,
      quantity,
      specialInstructions,
      category: item.category,
    };
    
    addToCart(cartItem);
  };

  return (
    <>
      {/* Mobile Wallet Selector - shows on mobile devices initially */}
      {showMobileWalletSelector && (
        <MobileWalletSelector
          orderUrl={orderUrl}
          onWalletSelected={() => setShowMobileWalletSelector(false)}
        />
      )}
      
      <div className="p-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
        <div>
          {menuData.categories.length > 0 ? (
            <Menu 
              categories={menuData.categories} 
              onAddToCart={handleAddToCart} 
            />
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">No Menu Items Found</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    The menu for {business.name} hasn't been set up yet.
                  </p>
                </div>
              </div>
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
          
          <Payments
            total={total}
            cart={cart}
            customerName={customerName}
            businessId={business.id}
            businessName={business.name}
            subdomain={business.subdomain}
            clearCart={clearCart}
          />
        </div>
      </div>
    </div>
    </>
  );
}
