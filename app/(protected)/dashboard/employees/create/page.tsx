'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth' // custom hook to get Firebase user
import { toast } from 'react-hot-toast'

export default function CreateEmployeePage() {
  const router = useRouter()
  const { user, userData } = useAuth() // Must include role info from Firestore
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    role: 'taker',
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData || userData.role !== 'admin') {
      toast.error('Access denied.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        businessId: userData.businessId,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.success) {
      toast.success('Employee created!')
      router.push('/dashboard/employees')
    } else {
      toast.error(data.error || 'Something went wrong')
    }
  }

  if (userData?.role !== 'admin') {
    return <p className="text-red-600">Access denied. Admins only.</p>
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Create New Employee</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Employee Email"
          className="w-full border p-2 rounded"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Employee Username"
          className="w-full border p-2 rounded"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Temporary Password"
          className="w-full border p-2 rounded"
          value={form.password}
          onChange={handleChange}
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="taker">Order Taker</option>
          <option value="maker">Order Preparer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </button>
      </form>
    </div>
  )
}
