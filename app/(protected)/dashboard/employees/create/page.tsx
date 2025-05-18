'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'react-hot-toast'

export default function CreateEmployeePage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState('null')
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    email: '',
    role: 'maker',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData || (userData?.role !== 'owner' && userData?.role !== 'admin')) {
      toast.error('Unauthorized.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await user?.getIdToken() // Retrieve the user's token

      const res = await fetch('/api/create-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include the Authorization header
        },
        body: JSON.stringify({
          ...form,
          businessId: userData.businessId,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || 'Something went wrong')
      }

      const data = await res.json()

      if (data.success) {
        setSuccess(`Employee created. Share this password setup link with them:`)
        setResetLink(data.resetLink)
      } else {
        toast.error(data.error || 'Something went wrong')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Create New Employee</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="lastName"
          placeholder="Employee's Last Name"
          className="w-full border p-2 rounded"
          value={form.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="firstName"
          placeholder="Employee's First Name"
          className="w-full border p-2 rounded"
          value={form.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Employee's Email"
          className="w-full border p-2 rounded"
          value={form.email}
          onChange={handleChange}
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="" disabled>Select role</option>
          <option value="taker">Taker</option>
          <option value="maker">Maker</option>
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
      {success && (
        <div className="mt-6 p-4 border border-green-400 rounded bg-green-50 text-green-800">
          <p className="mb-2 font-medium">{success}</p>
            
          <div className="bg-white p-2 rounded border text-sm text-gray-800 break-all">
            {resetLink}
          </div>
            
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(resetLink);
              toast.success('Link copied to clipboard!')
            }}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Copy Link
          </button>
        </div>
      )}

    </div>
  )
}
