"use client";

import { useEffect, useState, useContext } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { BusinessIdContext } from "../context";

export default function OrdersList() {
  const businessId = useContext(BusinessIdContext);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!businessId) return;
    const q = query(
      collection(db, `businesses/${businessId}/orders`),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(
        snapshot.docs.map((doc) => ({ orderId: doc.id, ...doc.data() }))
      );
    });
    return () => unsub();
  }, [businessId]);

  const getAsOf = (order: any) => {
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
      <div className="overflow-x-auto">
        <table className="w-full border text-left">
          <thead className="bg-gray-100">
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
                <td className="p-2">{order.orderId.slice(0, 4)}</td>
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
