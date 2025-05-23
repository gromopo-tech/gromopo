"use client";

import { useState } from 'react'
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { getUserData } from '@/lib/getUserData'

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
      alert('Order submitted!')
      setForm({
        sandwich: '', sandwichPrice: '', extras: '', extrasPrice: '', instructions: '', instructionsPrice: '', bread: '', breadPrice: '', condiments: [], condimentsPrice: '', misc: '', miscPrice: '', name: '',
      })
    } catch (err) {
      alert('Failed to submit order: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

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
    </form>
  )
}
