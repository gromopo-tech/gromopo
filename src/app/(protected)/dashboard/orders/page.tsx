import OrdersList from './ordersList';

export default function OrdersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>
      <OrdersList />
    </div>
  );
}