import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CartItem } from '@/types/cart';

export interface SubmitOrderParams {
  cart: CartItem[];
  arsTotal: number;
  solTotal: number;
  customerName: string;
  businessId: string;
  businessName: string;
  txSignature?: string | null;
  orderType: 'retirar' | 'comer en el lugar';
}

export async function submitOrderToFirestore({
  cart,
  arsTotal,
  solTotal,
  customerName,
  businessId,
  businessName,
  txSignature,
  orderType,
}: SubmitOrderParams) {
  if (!businessId) throw new Error('No businessId found');
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = dd + mm + yyyy;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
  const q = query(
    collection(db, `businesses/${businessId}/orders`),
    where('createdAt', '>=', startOfDay),
    where('createdAt', '<=', endOfDay)
  );
  const snapshot = await getDocs(q);
  const nextOrderNumber = snapshot.size + 1;
  const orderData = {
    cart,
    createdAt: new Date().toISOString(),
    orderNumber: nextOrderNumber,
    status: 'Order Created',
    arsTotal,
    solTotal,
    customerName,
    businessName,
    txSignature,
    orderType,
  };
  await setDoc(doc(db, `businesses/${businessId}/orders`, `${dateStr}-${nextOrderNumber}`), orderData);
  return orderData;
}
