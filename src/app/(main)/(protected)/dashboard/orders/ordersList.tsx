"use client";

import { useEffect, useState, useContext } from "react";
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { BusinessIdContext } from "@/components/protected/business-id-provider";
import type { Order } from '@/types/order';
import Link from 'next/link';

export default function OrdersList() {
  const businessId = useContext(BusinessIdContext);
  const [menuIntegrated, setMenuIntegrated] = useState<boolean | null>(null);
  const [menuUploaded, setMenuUploaded] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // yyyy-mm-dd
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'Order Created' | 'Preparing' | 'Prepared'>('all');

  // Subscribe to orders only when we know a menu is integrated (menu data exists in Firestore)
  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (businessId && selectedDate && menuIntegrated) {
      // Calculate start and end of selected day in local time (not UTC)
      const [year, month, day] = selectedDate.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
      const q = query(
        collection(db, 'businesses', businessId, 'orders'),
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
      setOrders([]); // Clear orders if not authenticated or no businessId or no menus
    }
    return () => {
      if (unsub) unsub();
    };
  }, [businessId, selectedDate, menuIntegrated]);

  // Client-side check: read business doc's menu flags
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!businessId) {
        if (mounted) {
          setMenuIntegrated(null);
          setMenuUploaded(null);
        }
        return;
      }

      try {
        const businessRef = doc(db, 'businesses', businessId);
        const snap = await getDoc(businessRef);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          setMenuIntegrated(Boolean(data.menuIntegrated));
          setMenuUploaded(Boolean(data.menuUploaded));
        } else {
          setMenuIntegrated(false);
          setMenuUploaded(false);
        }
      } catch (err) {
        console.error('Error checking menus (client, business doc):', err instanceof Error ? err.message : String(err));
        if (!mounted) return;
        setMenuIntegrated(false);
        setMenuUploaded(false);
      }
    };
    check();
    return () => { mounted = false };
  }, [businessId]);

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
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    return statusMatch;
  });
  // While either check is still pending show loading
  if (menuIntegrated === null || menuUploaded === null) {
    return <div className="p-6">Loading…</div>;
  }

  // If storage has a menu file but Firestore doesn't (uploaded but not integrated), show waiting message
  if (menuUploaded && !menuIntegrated) {
    return (
      <div className="rounded p-6 border bg-amber-50 dark:bg-amber-950">
        <h2 className="text-lg font-semibold mb-2">We'll let you know as soon as your ordering page is ready</h2>
        <p className="mb-4">We found a menu file in storage but your menu data isn't available yet. 
          We'll notify you as soon as the ordering page is ready.</p>
      </div>
    );
  }

  // If neither uploaded nor integrated, prompt upload
  if (!menuUploaded && !menuIntegrated) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-2">Upload a menu to get started</h2>
        <p className="mb-4">We couldn't find any menu files for your business. Upload a menu first to get started.</p>
        <Link
          href="/dashboard/menus"
          className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded"
        >
          Go to Menus
        </Link>
      </div>
    );
  }

  return (
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
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
                className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
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
  );
}
// ...existing code ends here, no stray bracket...
