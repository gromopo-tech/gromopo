"use client";

import { useState, useRef } from 'react'
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase/config'
import { ref as storageRef, uploadBytes } from 'firebase/storage'
import { getUserData } from '@/lib/getUserData'
import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
  })

  const { userData } = getUserData();
  const printRef = useRef<HTMLDivElement>(null);

  const breads = [
    'MARBLE RYE', 'LIGHT RYE', 'DARK RYE', 'FRENCH', 'SOURDOUGH', 'ONION', 'KAISER', 'PITA', 'MULTIGRAIN', 'CIABATTA', 'CRANBERRY WALNUT',
  ]

  const condiments = ['MAYONNAISE', 'MUSTARD', 'LETTUCE', 'TOMATO', 'CHEESE']

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value.toUpperCase() }))
  }

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, bread: e.target.value.toUpperCase() }))
  }

  const toggleCheckbox = (key: 'condiments', value: string) => {
    setForm(prev => {
      const updated = prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
      return { ...prev, [key]: updated }
    })
  }

  const generateBarcode = (orderId: string) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, orderId, { format: 'CODE128', width: 2, height: 40 });
    return canvas.toDataURL('image/png');
  };

  const handlePrintOrDownload = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 20, 20, 555, 0);
    pdf.save('order.pdf');
  };

  const uploadPdfToStorage = async (pdf: jsPDF, orderId: string, businessId: string) => {
    const pdfBlob = pdf.output('blob');
    const fileRef = storageRef(storage, `businesses/${businessId}/orders/${orderId}.pdf`);
    await uploadBytes(fileRef, pdfBlob);
  };

  // Calculate total price
  const total = [
    form.sandwichPrice,
    form.extrasPrice,
    form.instructionsPrice,
    form.breadPrice,
    form.condimentsPrice,
    form.miscPrice,
  ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validation for required fields
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
      if (!userData?.businessId) throw new Error('No businessId found for user')
      // Generate orderId in format XXXXDDMMYYYY
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const dateStr = dd + mm + yyyy;
      // Query for today's orders to get the next order number
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
      const orderRef = doc(db, `businesses/${userData.businessId}/orders/${orderId}`)
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
      })
      // Generate PDF and upload to storage
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      if (printRef.current) {
        const canvas = await html2canvas(printRef.current);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 20, 20, 555, 0);
        await uploadPdfToStorage(pdf, orderId, userData.businessId);
      }
      alert('Order submitted!')
      setForm({
        sandwich: '', sandwichPrice: '', extras: '', extrasPrice: '', instructions: '', instructionsPrice: '', bread: '', breadPrice: '', condiments: [], condimentsPrice: '', misc: '', miscPrice: '', name: '',
      })
    } catch (err) {
      alert('Failed to submit order: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // Printer-friendly order summary JSX
  const orderSummary = (
    <div ref={printRef} className="p-4 bg-white text-black w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
      <div className="mb-2">
        {form.sandwich && (
          <img src={generateBarcode(form.sandwich)} alt="Barcode" />
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
      <button type="button" onClick={handlePrintOrDownload} className="bg-gray-600 text-white py-2 px-4 rounded ml-2">
        Print/Download
      </button>

      {orderSummary}
    </form>
  )
}
