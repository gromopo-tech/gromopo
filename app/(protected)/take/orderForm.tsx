"use client";

import { useState, useRef, useEffect } from 'react';
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUserData } from '@/lib/getUserData';
import { generateSolanaPayUrl, pollSolanaPayPayment, MERCHANT_WALLET } from './solanaPay';
import { Keypair } from '@solana/web3.js';

export default function OrderForm() {
  const [form, setForm] = useState({
    sandwich: '',
    sandwichPrice: '',
    extras: '',
    extrasPrice: '',
    instructions: '',
    instructionsPrice: '',
    bread: '',
    breadPrice: '',
    ingredients: [] as string[],
    ingredientsPrice: '',
    misc: '',
    miscPrice: '',
    name: '',
  });

  const { userData } = getUserData();
  const printRef = useRef<HTMLDivElement>(null);
  const [solanaPayUrl, setSolanaPayUrl] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'none'>('none');
  const [reference, setReference] = useState<string>('');

  const breads = [
    'MARBLE RYE', 'LIGHT RYE', 'DARK RYE', 'FRENCH', 'SOURDOUGH', 'ONION', 'KAISER', 'PITA', 'MULTIGRAIN', 'CIABATTA', 'CRANBERRY WALNUT',
  ];

  const ingredients = ['MAYONNAISE', 'MUSTARD', 'LETTUCE', 'TOMATO', 'CHEESE'];

  const total = [
    form.sandwichPrice,
    form.extrasPrice,
    form.instructionsPrice,
    form.breadPrice,
    form.ingredientsPrice,
    form.miscPrice,
  ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, bread: e.target.value.toUpperCase() }));
  };

  const toggleCheckbox = (key: 'ingredients', value: string) => {
    setForm(prev => {
      const updated = prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value];
      return { ...prev, [key]: updated };
    });
  };

  useEffect(() => {
    if (form.sandwich && form.bread && form.name && total > 0 && MERCHANT_WALLET) {
      // Use a valid random public key as reference (not a random string)
      const refKey = Keypair.generate().publicKey.toBase58();
      setReference(refKey);
      const url = generateSolanaPayUrl({
        recipient: MERCHANT_WALLET,
        amount: total,
        reference: refKey,
        label: `Sandra's Sandwiches`,
        message: `Order for ${form.name}`,
      });
      setSolanaPayUrl(url);
      setPaymentStatus('pending');
    } else {
      setSolanaPayUrl('');
      setReference('');
      setPaymentStatus('none');
    }
  }, [form, total]);

  // Poll for payment confirmation
  useEffect(() => {
    let stop = false;
    if (paymentStatus === 'pending' && reference && MERCHANT_WALLET && total > 0) {
      (async () => {
        try {
          const confirmed = await pollSolanaPayPayment({
            reference,
            amount: total,
            recipient: MERCHANT_WALLET,
            timeout: 120,
            interval: 2000,
          });
          if (!stop && confirmed) {
            setPaymentStatus('confirmed');
          } else if (!stop) {
            // Add debug message if not confirmed
            setPaymentStatus('none');
            alert('Payment not detected. Please ensure your wallet supports Solana Pay reference and try again.');
          }
        } catch (err) {
          if (!stop) {
            setPaymentStatus('none');
            alert('Error while checking payment: ' + (err instanceof Error ? err.message : String(err)));
          }
        }
      })();
    }
    return () => { stop = true; };
  }, [paymentStatus, reference, total]);

  // Redirect to confirmation screen on payment
  useEffect(() => {
    if (paymentStatus === 'confirmed') {
      window.location.href = '/take/confirmation';
    }
  }, [paymentStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sandwich) {
      alert('Please fill out Sandwich field.');
      return;
    }
    if (!form.sandwichPrice) {
      alert('Please fill out Sandwich Price field.');
      return;
    }
    if (!form.bread) {
      alert('Please fill out Bread field.');
      return;
    }
    if (!form.name) {
      alert('Please fill out Name field.');
      return;
    }
    try {
      if (!userData?.businessId) throw new Error('No businessId found for user');
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const dateStr = dd + mm + yyyy;
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      const q = query(
        collection(db, `businesses/${userData.businessId}/orders`),
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<=', endOfDay)
      );
      const snapshot = await getDocs(q);
      const orderNumber = String(snapshot.size + 1).padStart(4, '0');
      const orderId = `${orderNumber}${dateStr}`;
      const orderRef = doc(db, `businesses/${userData.businessId}/orders/${orderId}`);
      await setDoc(orderRef, {
        ...form,
        total,
        orderTaker: `${userData.lastName}, ${userData.firstName}`,
        orderMaker: '',
        status: 'Order Created',
        createdAt: now.toISOString(),
        preparingAt: '',
        preparedAt: '',
        paidAt: '',
      });
      alert('Order submitted!');
      setForm({
        sandwich: '', sandwichPrice: '', extras: '', extrasPrice: '', instructions: '', instructionsPrice: '', bread: '', breadPrice: '', ingredients: [], ingredientsPrice: '', misc: '', miscPrice: '', name: '',
      });
    } catch (err) {
      alert('Failed to submit order: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const orderSummary = (
    <div ref={printRef} className="p-4 bg-white text-black w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
      <div className="mb-2">
        {solanaPayUrl && (
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(solanaPayUrl)}`} alt="Solana Pay QR Code" />
        )}
      </div>
      <ul className="mb-2">
        {form.sandwich && <li><b>Sandwich:</b> {form.sandwich}</li>}
        {form.sandwichPrice && <li><b>Sandwich Price:</b> {form.sandwichPrice}</li>}
        {form.extras && <li><b>Extras:</b> {form.extras}</li>}
        {form.extrasPrice && <li><b>Extras Price:</b> {form.extrasPrice}</li>}
        {form.instructions && <li><b>Instructions:</b> {form.instructions}</li>}
        {form.instructionsPrice && <li><b>Instructions Price:</b> {form.instructionsPrice}</li>}
        {form.bread && <li><b>Bread:</b> {form.bread}</li>}
        {form.breadPrice && <li><b>Bread Price:</b> {form.breadPrice}</li>}
        {form.ingredients.length > 0 && <li><b>Ingredients:</b> {form.ingredients.join(', ')}</li>}
        {form.ingredientsPrice && <li><b>Ingredients Price:</b> {form.ingredientsPrice}</li>}
        {form.misc && <li><b>Misc:</b> {form.misc}</li>}
        {form.miscPrice && <li><b>Misc Price:</b> {form.miscPrice}</li>}
        {form.name && <li><b>Name:</b> {form.name}</li>}
        <li><b>Total:</b> {total.toFixed(2)} USDC</li>
      </ul>
      {paymentStatus === 'pending' && solanaPayUrl && (
        <div className="text-yellow-600 font-semibold">Waiting for payment confirmation...</div>
      )}
      {paymentStatus === 'confirmed' && (
        <div className="text-green-600 font-semibold">Payment confirmed!</div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">Sandra's Sandwiches</h1>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block font-semibold">Sandwich</label>
          <input type="text" name="sandwich" value={form.sandwich} onChange={handleChange} className="w-full border p-2" style={{ textTransform: 'uppercase' }} />
        </div>
        <div>
          <label className="block font-semibold">Price</label>
          <input type="text" name="sandwichPrice" value={form.sandwichPrice} onChange={handleChange} className="w-20 border p-2" />
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block font-semibold">Extras</label>
          <input type="text" name="extras" value={form.extras} onChange={handleChange} className="w-full border p-2" style={{ textTransform: 'uppercase' }} />
        </div>
        <div>
          <label className="block font-semibold">Price</label>
          <input type="text" name="extrasPrice" value={form.extrasPrice} onChange={handleChange} className="w-20 border p-2" />
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block font-semibold">Instructions</label>
          <input type="text" name="instructions" value={form.instructions} onChange={handleChange} className="w-full border p-2" style={{ textTransform: 'uppercase' }} />
        </div>
        <div>
          <label className="block font-semibold">Price</label>
          <input type="text" name="instructionsPrice" value={form.instructionsPrice} onChange={handleChange} className="w-20 border p-2" />
        </div>
      </div>

      <fieldset>
        <legend className="font-semibold">On</legend>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-wrap gap-2" style={{ minWidth: 0 }}>
            {breads.map(b => (
              <label key={b} className="flex items-center gap-1 whitespace-nowrap">
                <input
                  type="radio"
                  name="bread"
                  value={b}
                  checked={form.bread === b}
                  onChange={handleRadioChange}
                />
                {b}
              </label>
            ))}
          </div>
          <div>
            <label className="block font-semibold">Price</label>
            <input type="text" name="breadPrice" value={form.breadPrice} onChange={handleChange} className="w-20 border p-2" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-semibold">With</legend>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-wrap gap-2" style={{ minWidth: 0 }}>
            {ingredients.map(c => (
              <label key={c} className="flex items-center gap-1 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={form.ingredients.includes(c)}
                  onChange={() => toggleCheckbox('ingredients', c)}
                />
                {c}
              </label>
            ))}
          </div>
          <div>
            <label className="block font-semibold">Price</label>
            <input type="text" name="ingredientsPrice" value={form.ingredientsPrice} onChange={handleChange} className="w-20 border p-2" />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block font-semibold">Misc.</label>
          <input type="text" name="misc" value={form.misc} onChange={handleChange} className="w-full border p-2" style={{ textTransform: 'uppercase' }} />
        </div>
        <div>
          <label className="block font-semibold">Price</label>
          <input type="text" name="miscPrice" value={form.miscPrice} onChange={handleChange} className="w-20 border p-2" />
        </div>
      </div>

      <div>
        <label className="block font-semibold">Name</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border p-2" style={{ textTransform: 'uppercase' }} />
      </div>

      <div className="mt-4 font-bold text-lg">Total: ${total.toFixed(2)}</div>

      <button type="submit" className="bg-black text-white py-2 px-4 rounded">
        Submit Order
      </button>

      {orderSummary}
    </form>
  );
}
