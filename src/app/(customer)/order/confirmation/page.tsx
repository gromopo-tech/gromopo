"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem } from "@/types/cart";

interface OrderConfirmation {
  orderNumber: number;
  customerName?: string;
  total: number;
  cart: CartItem[];
  txSignature?: string | null;
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("orderConfirmation");
    if (data) {
      setOrder(JSON.parse(data));
      // Do NOT remove from sessionStorage here, so the page can reload or stay visible
    } else {
      // If no order, redirect to home or order page
      router.replace("/customer/order");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg">Loading order confirmation...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 mt-8 border rounded bg-green-50 text-green-900">
      <h1 className="text-3xl font-bold mb-4 text-green-800">Order confirmed!</h1>
      <div className="mb-2">Order number: <b>{order.orderNumber}</b></div>
      {order.customerName && <div className="mb-2">Customer: <b>{order.customerName}</b></div>}
      <div className="mb-2">Total: <b>{order.total.toFixed(2)} USDC</b></div>
      {order.txSignature && (
        <div className="mb-2">
          <a
            href={`https://explorer.solana.com/tx/${order.txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            See transaction on Solana Explorer
          </a>
        </div>
      )}
      <div className="mt-4">
        <b>Order details:</b>
        <ul className="list-disc ml-6 mt-2">
          {order.cart.map((item, i) => (
            <li key={i}>
              {item.name} ({item.size}) - ${item.price}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 text-center">
        <a
          href="/customer/order"
          className="inline-block px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Make another order
        </a>
      </div>
    </div>
  );
}
