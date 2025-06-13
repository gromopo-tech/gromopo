"use client";

import { useState, useRef, useEffect, useContext } from 'react';
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { generateSolanaPayUrl, pollSolanaPayPayment } from '@/lib/solanaPay/config';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { BusinessNameContext } from '@/components/protected/business-name-provider';
import Image from 'next/image';

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
  const businessName = useContext(BusinessNameContext);
  const printRef = useRef<HTMLDivElement>(null);
  const [solanaPayUrl, setSolanaPayUrl] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'none'>('none');
  const [reference, setReference] = useState<string>('');

  const [arsTotal, setArsTotal] = useState<number>(0);
  const [usdcTotal, setUsdcTotal] = useState<number>(0);
  const [conversionLoading, setConversionLoading] = useState<boolean>(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [usdToArs, setUsdToArs] = useState<number | null>(null);
  const [merchantWallet, setMerchantWallet] = useState<string | null>(null);

  const breads = [
    'MARBLE RYE', 'LIGHT RYE', 'DARK RYE', 'FRENCH', 'SOURDOUGH', 'ONION', 'KAISER', 'PITA', 'MULTIGRAIN', 'CIABATTA', 'CRANBERRY WALNUT',
  ];

  const ingredients = ['MAYONNAISE', 'MUSTARD', 'LETTUCE', 'TOMATO', 'CHEESE'];

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
        .catch(() => {
          setConversionError('Failed to fetch ARS/USDC rate');
          setConversionLoading(false);
          setUsdToArs(null);
        });
    } else {
      setUsdcTotal(0);
      setUsdToArs(null);
    }
  }, [arsTotal]);

  // Fetch and cache merchantWallet
  useEffect(() => {
    if (!businessId) {
      setMerchantWallet(null);
      return;
    }
    const cacheKey = `merchantWallet-${businessId}`;
    // Always check Firestore for the latest value after login or businessId change
    (async () => {
      try {
        const snap = await import('firebase/firestore').then(({ doc, getDoc }) => getDoc(doc(db, 'businesses', businessId)));
        if (snap.exists()) {
          const wallet = snap.data().merchantWallet || '';
          setMerchantWallet(wallet);
          sessionStorage.setItem(cacheKey, wallet);
        } else {
          setMerchantWallet('');
          sessionStorage.removeItem(cacheKey);
        }
      } catch {
        setMerchantWallet('');
        sessionStorage.removeItem(cacheKey);
      }
    })();
  }, [businessId]);

  useEffect(() => {
    if (
      form.sandwich &&
      form.bread &&
      form.name &&
      usdcTotal > 0 &&
      merchantWallet &&
      merchantWallet.length > 0
    ) {
      try {
        // Validate merchantWallet as a public key
        // Try to create a PublicKey, will throw if invalid
        import('@solana/web3.js').then(({ PublicKey, Keypair }) => {
          new PublicKey(merchantWallet);
          const refKey = Keypair.generate().publicKey.toBase58();
          setReference(refKey);
          const url = generateSolanaPayUrl({
            recipient: merchantWallet,
            amount: usdcTotal,
            reference: refKey,
            label: businessName || 'Unknown Business',
            message: `Order for ${form.name}`,
          });
          setSolanaPayUrl(url);
          setPaymentStatus('pending');
        }).catch(() => {
          setSolanaPayUrl("");
          setReference("");
          setPaymentStatus("none");
        });
      } catch {
        setSolanaPayUrl("");
        setReference("");
        setPaymentStatus("none");
        return;
      }
    } else {
      setSolanaPayUrl('');
      setReference('');
      setPaymentStatus('none');
    }
  }, [form, usdcTotal, businessName, merchantWallet]);

  useEffect(() => {
    let stop = false;
    if (
      paymentStatus === 'pending' &&
      reference &&
      merchantWallet &&
      merchantWallet.length > 0 &&
      usdcTotal > 0
    ) {
      import('@solana/web3.js').then(({ PublicKey }) => {
        try {
          new PublicKey(merchantWallet);
        } catch {
          setPaymentStatus('none');
          return;
        }
      });
      (async () => {
        let retries = 0;
        let delay = 1000; // start with 1 second
        const maxRetries = 10; // after 10 tries, give up
        while (!stop && retries < maxRetries) {
          try {
            const confirmed = await pollSolanaPayPayment({
              reference,
              amount: usdcTotal,
              recipient: merchantWallet,
              timeout: 10, // short timeout for each try
              interval: 500 // short interval for each try
            });
            if (confirmed) {
              setPaymentStatus('confirmed');
              return;
            }
          } catch {
            delay = 1000; // reset delay for other errors
          }
          retries++;
          await new Promise(res => setTimeout(res, delay));
        }
        if (!stop) {
          setPaymentStatus('none');
          alert('Payment not detected. Please ensure your wallet supports Solana Pay reference and try again.');
        }
      })();
    }
    return () => { stop = true; };
  }, [paymentStatus, reference, usdcTotal, merchantWallet]);

  // Submit order to Firestore when payment is confirmed
  useEffect(() => {
    const submitOrder = async () => {
      if (!form.sandwich || !form.sandwichPrice || !form.bread || !form.name) {
        // Required fields missing, do not submit
        return;
      }
      try {
        if (!businessId) throw new Error('No businessId found for user');
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
  }, [paymentStatus, reference, usdcTotal, merchantWallet, arsTotal, businessId, form]);

  const orderSummary = (
    <div ref={printRef} className="p-4 bg-white text-black w-full max-w-lg">
      {paymentStatus === 'pending' && solanaPayUrl && (
        <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(solanaPayUrl)}`} alt="Solana Pay QR Code" width={180} height={180} />
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
