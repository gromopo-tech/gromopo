"use client";

import { useEffect, useState, useContext } from "react";
import MenuUploadGate from '@/components/business/dashboard/MenuUploadGate';
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { BusinessIdContext } from "@/components/business/business-id-provider";
import type { Order } from '@/types/order';
import Link from 'next/link';

export default function OrdersList() {
  const businessId = useContext(BusinessIdContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // yyyy-mm-dd
  });
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'dine-in' | 'takeout'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Order Created' | 'Preparing' | 'Prepared'>('all');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (businessId && selectedDate) {
      // Calculate start and end of selected day in local time (not UTC)
      const [year, month, day] = selectedDate.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
      const q = query(
        collection(db, `businesses/${businessId}/orders`),
        where("createdAt", ">=", startOfDay),
        where("createdAt", "<=", endOfDay),
        orderBy("createdAt", "desc")
      );
      unsub = onSnapshot(q, (snapshot) => {
        setOrders(
          snapshot.docs.map((doc) => ({ orderId: doc.id, ...doc.data() } as Order))
        );
      });
    } else {
      setOrders([]); // Clear orders if not authenticated or no businessId
    }
    return () => {
      if (unsub) unsub();
    };
  }, [businessId, selectedDate]);

  const getAsOf = (order: Order) => {
    switch (order.status) {
      case "Order Created":
        return order.createdAt;
      case "Preparing":
        return order.preparingAt;
      case "Prepared":
        return order.preparedAt;
      default:
        return order.createdAt;
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const typeMatch = orderTypeFilter === 'all' || order.orderType === orderTypeFilter;
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    return typeMatch && statusMatch;
  });

  return (
    <MenuUploadGate>
      <div>
        <div className="mb-2 flex justify-between items-center gap-2">
          <div>
            <label htmlFor="order-date" className="font-semibold">Date:</label>
            <input
              id="order-date"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border p-1 rounded"
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <Link
            href="/dashboard/orders/create"
            className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            + New Order
          </Link>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="mr-2 font-medium">Filter by Order Type:</label>
          {['all', 'dine-in', 'takeout'].map((type) => (
            <button
              key={type}
              className={`mr-2 px-3 py-1 rounded ${orderTypeFilter === type ? 'dark:bg-gray-700 bg-gray-300' : 'border'}`}
              onClick={() => setOrderTypeFilter(type as typeof orderTypeFilter)}
            >
              {type}
            </button>
          ))}
          <label className="mr-2 font-medium">Filter by Status:</label>
          {['all', 'Order Created', 'Preparing', 'Prepared'].map((status) => (
            <button
              key={status}
              className={`mr-2 px-3 py-1 rounded ${statusFilter === status ? 'dark:bg-gray-700 bg-gray-300' : 'border'}`}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
            >
              {status}
            </button>
          ))}
          <div className="flex-1" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border text-left border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-2">Order #</th>
                <th className="p-2">Order Type</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Status</th>
                <th className="p-2">As of</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.orderId}
                  className="border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="p-2">{order.orderNumber ? order.orderNumber.toString().padStart(4, '0') : order.orderId.slice(0, 4)}</td>
                  <td className="p-2">{order.orderType}</td>
                  <td className="p-2">{order.customerName}</td>
                  <td className="p-2">{order.status}</td>
                  <td className="p-2">{getAsOf(order)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-lg w-full relative border border-gray-200 dark:border-gray-700">
              <button
                className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                onClick={() => setSelectedOrder(null)}
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Order Details</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto mb-2 text-gray-800 dark:text-gray-100">
                {JSON.stringify(selectedOrder, null, 2)}
              </pre>
              <h4 className="font-semibold mt-4 mb-1 text-gray-900 dark:text-gray-100">Status History</h4>
              <ul className="text-sm text-gray-800 dark:text-gray-200">
                {selectedOrder.createdAt && (
                  <li>
                    <span className="font-medium">Order Created:</span> {selectedOrder.createdAt}
                  </li>
                )}
                {selectedOrder.preparingAt && (
                  <li>
                    <span className="font-medium">Preparing:</span> {selectedOrder.preparingAt}
                  </li>
                )}
                {selectedOrder.preparedAt && (
                  <li>
                    <span className="font-medium">Prepared:</span> {selectedOrder.preparedAt}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </MenuUploadGate>
  );
}
// ...existing code ends here, no stray bracket...
