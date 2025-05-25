"use client";

import { useState, useRef, useEffect } from 'react';
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/config';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { getUserData } from '@/lib/getUserData';
import QRCode from 'qrcode';
import { Document, Page, Text, View, StyleSheet, Image as PDFImage, pdf } from '@react-pdf/renderer';

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
    condiments: [] as string[],
    condimentsPrice: '',
    misc: '',
    miscPrice: '',
    name: '',
  });

  const { userData } = getUserData();
  const printRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const breads = [
    'MARBLE RYE', 'LIGHT RYE', 'DARK RYE', 'FRENCH', 'SOURDOUGH', 'ONION', 'KAISER', 'PITA', 'MULTIGRAIN', 'CIABATTA', 'CRANBERRY WALNUT',
  ];

  const condiments = ['MAYONNAISE', 'MUSTARD', 'LETTUCE', 'TOMATO', 'CHEESE'];

  // Move total calculation above QR code functions so it is available
  const total = [
    form.sandwichPrice,
    form.extrasPrice,
    form.instructionsPrice,
    form.breadPrice,
    form.condimentsPrice,
    form.miscPrice,
  ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, bread: e.target.value.toUpperCase() }));
  };

  const toggleCheckbox = (key: 'condiments', value: string) => {
    setForm(prev => {
      const updated = prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value];
      return { ...prev, [key]: updated };
    });
  };

  // Generate QR code as PNG for display in the order summary (not SVG)
  const generateOrderQRPNG = async (order: any) => {
    const qrData = JSON.stringify({
      sandwich: order.sandwich,
      sandwichPrice: order.sandwichPrice,
      extras: order.extras,
      extrasPrice: order.extrasPrice,
      instructions: order.instructions,
      instructionsPrice: order.instructionsPrice,
      bread: order.bread,
      breadPrice: order.breadPrice,
      condiments: order.condiments,
      condimentsPrice: order.condimentsPrice,
      misc: order.misc,
      miscPrice: order.miscPrice,
      name: order.name,
      total: total.toFixed(2),
    });
    try {
      return await QRCode.toDataURL(qrData, { width: 180 });
    } catch (err) {
      return '';
    }
  };

  const generateOrderQRSVG = async (order: any) => {
    const qrData = JSON.stringify({
      sandwich: order.sandwich,
      sandwichPrice: order.sandwichPrice,
      extras: order.extras,
      extrasPrice: order.extrasPrice,
      instructions: order.instructions,
      instructionsPrice: order.instructionsPrice,
      bread: order.bread,
      breadPrice: order.breadPrice,
      condiments: order.condiments,
      condimentsPrice: order.condimentsPrice,
      misc: order.misc,
      miscPrice: order.miscPrice,
      name: order.name,
      total: total.toFixed(2),
    });
    try {
      return await QRCode.toString(qrData, { type: 'svg' });
    } catch (err) {
      return '';
    }
  };

  const pdfStyles = StyleSheet.create({
    page: { padding: 24, fontSize: 14, fontFamily: 'Helvetica' },
    section: { marginBottom: 12 },
    heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    qr: { marginBottom: 12, alignItems: 'center', display: 'flex', justifyContent: 'center' },
    list: { margin: 0, padding: 0 },
    item: { marginBottom: 2 },
  });

  const OrderSummaryPDF = ({ form, total, qrPngUrl }: any) => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.heading}>Order Summary</Text>
        </View>
        <View style={pdfStyles.qr}>
          {qrPngUrl && (
            <PDFImage src={qrPngUrl} style={{ width: 120, height: 120 }} />
          )}
        </View>
        <View style={pdfStyles.section}>
          <Text>Sandwich: {form.sandwich}</Text>
          <Text>Sandwich Price: {form.sandwichPrice}</Text>
          {form.extras && <Text>Extras: {form.extras}</Text>}
          {form.extrasPrice && <Text>Extras Price: {form.extrasPrice}</Text>}
          {form.instructions && <Text>Instructions: {form.instructions}</Text>}
          {form.instructionsPrice && <Text>Instructions Price: {form.instructionsPrice}</Text>}
          <Text>Bread: {form.bread}</Text>
          <Text>Bread Price: {form.breadPrice}</Text>
          {form.condiments.length > 0 && <Text>Condiments: {form.condiments.join(', ')}</Text>}
          {form.condimentsPrice && <Text>Condiments Price: {form.condimentsPrice}</Text>}
          {form.misc && <Text>Misc: {form.misc}</Text>}
          {form.miscPrice && <Text>Misc Price: {form.miscPrice}</Text>}
          <Text>Name: {form.name}</Text>
          <Text>Total: ${total.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  );

  const uploadPdfToStorage = async (form: any, total: number, orderId: string, businessId: string) => {
    const blob = await pdf(<OrderSummaryPDF form={form} total={total} qrPngUrl={qrCodeUrl} />).toBlob();
    const fileRef = storageRef(storage, `businesses/${businessId}/orders/${orderId}.pdf`);
    await uploadBytes(fileRef, blob);
  };

  useEffect(() => {
    (async () => {
      if (form.sandwich && form.bread && form.name) {
        const url = await generateOrderQRPNG(form);
        setQrCodeUrl(url);
      } else {
        setQrCodeUrl('');
      }
    })();
  }, [form]);

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
      await uploadPdfToStorage(form, total, orderId, userData.businessId);
      alert('Order submitted!');
      setForm({
        sandwich: '', sandwichPrice: '', extras: '', extrasPrice: '', instructions: '', instructionsPrice: '', bread: '', breadPrice: '', condiments: [], condimentsPrice: '', misc: '', miscPrice: '', name: '',
      });
    } catch (err) {
      alert('Failed to submit order: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const orderSummary = (
    <div ref={printRef} className="p-4 bg-white text-black w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
      <div className="mb-2">
        {qrCodeUrl && (
          <img src={qrCodeUrl} alt="Order QR Code" />
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
        {form.condiments.length > 0 && <li><b>Condiments:</b> {form.condiments.join(', ')}</li>}
        {form.condimentsPrice && <li><b>Condiments Price:</b> {form.condimentsPrice}</li>}
        {form.misc && <li><b>Misc:</b> {form.misc}</li>}
        {form.miscPrice && <li><b>Misc Price:</b> {form.miscPrice}</li>}
        {form.name && <li><b>Name:</b> {form.name}</li>}
        <li><b>Total:</b> {total.toFixed(2)}</li>
      </ul>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">A NOONER</h1>

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
            {condiments.map(c => (
              <label key={c} className="flex items-center gap-1 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={form.condiments.includes(c)}
                  onChange={() => toggleCheckbox('condiments', c)}
                />
                {c}
              </label>
            ))}
          </div>
          <div>
            <label className="block font-semibold">Price</label>
            <input type="text" name="condimentsPrice" value={form.condimentsPrice} onChange={handleChange} className="w-20 border p-2" />
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
