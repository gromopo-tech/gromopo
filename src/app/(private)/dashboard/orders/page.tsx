import OrdersList from './ordersList'
import Link from 'next/link'

export default function OrdersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link
          href="/dashboard/orders/take"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Order
        </Link>
      </div>
      <OrdersList />
    </div>
  )
}