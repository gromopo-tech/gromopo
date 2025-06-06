"use client";

import { useState, useRef, useEffect, useContext } from 'react';
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateSolanaPayUrl, pollSolanaPayPayment, MERCHANT_WALLET } from './solanaPay';
import { Keypair } from '@solana/web3.js';
import { getAuth } from 'firebase/auth';
import { BusinessIdContext } from '../context';

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

  const businessId = useContext(BusinessIdContext);
  const printRef = useRef<HTMLDivElement>(null);
  const [solanaPayUrl, setSolanaPayUrl] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'none'>('none');
  const [reference, setReference] = useState<string>('');

  const [arsTotal, setArsTotal] = useState<number>(0);
  const [usdcTotal, setUsdcTotal] = useState<number>(0);
  const [conversionLoading, setConversionLoading] = useState<boolean>(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [usdToArs, setUsdToArs] = useState<number | null>(null);

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
    const sum = [
      form.sandwichPrice,
      form.extrasPrice,
      form.instructionsPrice,
      form.breadPrice,
      form.ingredientsPrice,
      form.miscPrice,
    ].reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    setArsTotal(sum);
  }, [form]);

  useEffect(() => {
    if (arsTotal > 0) {
      setConversionLoading(true);
      setConversionError(null);
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,argentine-peso&vs_currencies=usd,ars')
        .then(res => res.json())
        .then(data => {
          const arsPerUsdc = data['usd-coin']?.ars;
          const usdToArsRate = data['usd-coin']?.ars;
          if (!arsPerUsdc || arsPerUsdc === 0) throw new Error('Invalid ARS/USDC rate');
          setUsdToArs(usdToArsRate || null);
          // Use toFixed(6) and parseFloat to ensure 6 decimals, no rounding error
          const usdc = parseFloat((arsTotal / arsPerUsdc).toFixed(6));
          setUsdcTotal(usdc);
          setConversionLoading(false);
        })
        .catch(err => {
          setConversionError('Failed to fetch ARS/USDC rate');
          setConversionLoading(false);
          setUsdToArs(null);
        });
    } else {
      setUsdcTotal(0);
      setUsdToArs(null);
    }
  }, [arsTotal]);

  useEffect(() => {
    if (form.sandwich && form.bread && form.name && usdcTotal > 0 && MERCHANT_WALLET) {
      const refKey = Keypair.generate().publicKey.toBase58();
      setReference(refKey);
      const url = generateSolanaPayUrl({
        recipient: MERCHANT_WALLET,
        amount: usdcTotal,
        reference: refKey,
        label: 'Unknown Business',
        message: `Order for ${form.name}`,
      });
      setSolanaPayUrl(url);
      setPaymentStatus('pending');
    } else {
      setSolanaPayUrl('');
      setReference('');
      setPaymentStatus('none');
    }
  }, [form, usdcTotal]);

  // Poll for payment confirmation
  useEffect(() => {
    let stop = false;
    if (paymentStatus === 'pending' && reference && MERCHANT_WALLET && usdcTotal > 0) {
      (async () => {
        try {
          const confirmed = await pollSolanaPayPayment({
            reference,
            amount: usdcTotal, // Use USDC amount, not ARS
            recipient: MERCHANT_WALLET,
            timeout: 180, // 3 minutes
            interval: 1000 // 1 second
          });
          if (!stop && confirmed) {
            setPaymentStatus('confirmed');
          } else if (!stop) {
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
  }, [paymentStatus, reference, usdcTotal]);

  // Submit order to Firestore when payment is confirmed
  useEffect(() => {
    const submitOrder = async () => {
      if (!form.sandwich || !form.sandwichPrice || !form.bread || !form.name) {
        // Required fields missing, do not submit
        return;
      }
      try {
        if (!businessId) throw new Error('No businessId found for user');
        const auth = getAuth();
        const user = auth.currentUser;
        const orderTaker = user?.displayName || user?.email || 'Unknown';
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
        const orderNumber = snapshot.size + 1;
        const orderData = {
          ...form,
          createdAt: new Date().toISOString(),
          orderNumber,
          orderTaker,
          status: 'Order Created',
          arsTotal,
          usdcTotal,
          reference,
        };
        await setDoc(doc(db, `businesses/${businessId}/orders`, `${dateStr}-${orderNumber}`), orderData);
        // Reset form after submission
        setForm({
          sandwich: '', sandwichPrice: '', extras: '', extrasPrice: '', instructions: '', instructionsPrice: '', bread: '', breadPrice: '', ingredients: [], ingredientsPrice: '', misc: '', miscPrice: '', name: '',
        });
      } catch (err) {
        alert('Failed to submit order: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };

    if (paymentStatus === 'confirmed') {
      submitOrder().then(() => {
        window.location.href = '/take/confirmation';
      });
    }
  }, [paymentStatus]);

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
        <li><b>Total:</b> {arsTotal.toFixed(2)} ARS</li>
        <li><b>Total (USDC):</b> {conversionLoading ? 'Loading...' : conversionError ? conversionError : usdcTotal.toFixed(4) + ' USDC'}</li>
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
    <form className="max-w-xl mx-auto p-4 space-y-4">
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

      <div className="mt-4 font-bold text-lg">
        Total: {arsTotal.toFixed(2)} ARS / {conversionLoading ? 'Loading...' : conversionError ? conversionError : usdcTotal.toFixed(4)} USDC
        {usdToArs && (
          <span className="text-xs text-gray-500"> (1 USDC ≈ {usdToArs.toLocaleString('en-US', { maximumFractionDigits: 2 })} ARS)</span>
        )}
      </div>

      {orderSummary}
    </form>
  );
}
