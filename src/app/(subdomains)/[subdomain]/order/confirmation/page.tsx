"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem } from "@/types/cart";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAddReview } from "@/lib/solana/vouched-client";

interface OrderConfirmation {
  orderNumber: number;
  customerName: string;
  total: number;
  cart: CartItem[];
  txSignature?: string | null;
  merchantWallet?: string | null;
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const router = useRouter();

  const { connected } = useWallet();
  const { status, txSignature: reviewTx, errorMessage, checkAlreadyReviewed, submitReview, updateReview } = useAddReview();

  useEffect(() => {
    const data = sessionStorage.getItem("orderConfirmation");
    if (data) {
      setOrder(JSON.parse(data));
      // Do NOT remove from sessionStorage here, so the page can reload or stay visible
    } else {
      // If no order, redirect to subdomain order page
      router.replace(`/order`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if this wallet already reviewed when modal opens
  useEffect(() => {
    if (reviewOpen && order?.merchantWallet && connected) {
      checkAlreadyReviewed(order.merchantWallet).then(setAlreadyReviewed);
    }
  }, [reviewOpen, order?.merchantWallet, connected, checkAlreadyReviewed]);

  const handleSubmitReview = async () => {
    if (!order?.merchantWallet || !comment.trim()) return;
    if (alreadyReviewed) {
      await updateReview(order.merchantWallet, comment.trim(), rating);
    } else {
      await submitReview(order.merchantWallet, comment.trim(), rating);
    }
  };

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg">Loading order confirmation...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 mt-8 border-4 rounded">
      <h1 className="text-3xl font-bold mb-4">Order confirmed, we'll call your name when it's ready!</h1>
      <div className="mb-2">Order number: <b>{order.orderNumber}</b></div>
      {order.customerName && <div className="mb-2">Customer: <b>{order.customerName}</b></div>}
      <div className="mb-2">Total: <b>{order.total.toFixed(2)} USDC</b></div>
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
      <div className="mt-8 flex flex-col gap-3">
        {order.txSignature ? (
          <a
            href={`https://explorer.solana.com/tx/${order.txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn w-full border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer inline-block text-center"
          >
            View transaction
          </a>
        ) : (
          <button
            onClick={() => router.push(`/order`)}
            className="btn w-full border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            Place Another Order
          </button>
        )}

        {/* Leave a Review CTA — only shown when merchant wallet is known and wallet is connected */}
        {order.merchantWallet && connected && (
          <button
            onClick={() => setReviewOpen(true)}
            className="btn w-full border border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 bg-white dark:bg-neutral-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 cursor-pointer"
          >
            Leave a Review
          </button>
        )}
      </div>

      {/* Review modal */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {status === "success" ? (alreadyReviewed ? "Review Updated" : "Review Submitted") : alreadyReviewed || status === "already_reviewed" ? "Update Your Review" : "Leave a Review"}
            </h2>

            {status === "success" ? (
              <>
                <div className="space-y-2 mb-4">
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    {alreadyReviewed ? "Review updated on-chain!" : "Review submitted on-chain!"}
                  </p>
                  {reviewTx && (
                    <a
                      href={`https://explorer.solana.com/tx/${reviewTx}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 underline break-all"
                    >
                      View on Solana Explorer
                    </a>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="px-4 py-2 rounded border text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : alreadyReviewed || status === "already_reviewed" ? (
              <>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                  You&apos;ve already reviewed this restaurant. You can update it below.
                </p>
                {status === "error" && (
                  <p className="text-red-600 dark:text-red-400 text-sm mb-3">{errorMessage}</p>
                )}
                {/* Star rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl focus:outline-none ${star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                {/* Comment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={2500}
                    placeholder="Tell us about your experience..."
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:border-neutral-600"
                  />
                  <p className="text-xs text-gray-500 text-right mt-0.5">{comment.length}/2500</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="px-4 py-2 rounded border text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!comment.trim() || status === "submitting"}
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "submitting" ? "Updating..." : "Update Review"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {status === "error" && (
                  <p className="text-red-600 dark:text-red-400 text-sm mb-3">{errorMessage}</p>
                )}

                {/* Star rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl focus:outline-none ${star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={2500}
                    placeholder="Tell us about your experience..."
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-neutral-800 dark:border-neutral-600"
                  />
                  <p className="text-xs text-gray-500 text-right mt-0.5">{comment.length}/2500</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setReviewOpen(false)}
                    className="px-4 py-2 rounded border text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!comment.trim() || status === "checking" || status === "submitting"}
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "checking" ? "Checking..." : status === "submitting" ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
