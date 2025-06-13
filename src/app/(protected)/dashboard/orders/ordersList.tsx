"use client";

import { useEffect, useState, useContext } from "react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { BusinessIdContext } from "@/components/protected/business-id-provider";
import type { Order } from '@/../types/order';

export default function OrdersList() {
  const businessId = useContext(BusinessIdContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // yyyy-mm-dd
  });

  useEffect(() => {
    if (!businessId || !selectedDate) return;
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
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(
        snapshot.docs.map((doc) => ({ orderId: doc.id, ...doc.data() } as Order))
      );
    });
    return () => unsub();
  }, [businessId, selectedDate]);

  const getAsOf = (order: Order) => {
    switch (order.status) {
      case "Order Created":
        return order.createdAt;
      case "Preparing":
        return order.preparingAt;
      case "Prepared":
        return order.preparedAt;
      case "Paid":
        return order.paidAt;
      default:
        return order.createdAt;
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Orders</h2>
      <div className="mb-4 flex items-center gap-2">
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
      <div className="overflow-x-auto">
        <table className="w-full border text-left">
          <thead>
            <tr>
              <th className="p-2">Order #</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Order Taker</th>
              <th className="p-2">Order Maker</th>
              <th className="p-2">Status</th>
              <th className="p-2">As of</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.orderId}
                className="border-t cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedOrder(order)}
              >
                <td className="p-2">{order.orderNumber ? order.orderNumber.toString().padStart(4, '0') : order.orderId.slice(0, 4)}</td>
                <td className="p-2">{order.name}</td>
                <td className="p-2">{order.orderTaker}</td>
                <td className="p-2">{order.orderMaker}</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">{getAsOf(order)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setSelectedOrder(null)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-2">Order Details</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto mb-2">
              {JSON.stringify(selectedOrder, null, 2)}
            </pre>
            <h4 className="font-semibold mt-4 mb-1">Status History</h4>
            <ul className="text-sm">
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
              {selectedOrder.paidAt && (
                <li>
                  <span className="font-medium">Paid:</span> {selectedOrder.paidAt}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
