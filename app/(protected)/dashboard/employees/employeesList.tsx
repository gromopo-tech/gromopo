'use client'

import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { getUserData } from '@/lib/getUserData'
import { toast } from 'react-hot-toast'
import type { Employee } from '@/types/employee'

export default function EmployeesList({ employees }: { employees: Employee[] }) {
  const [filter, setFilter] = useState<'all' | 'admin' | 'taker' | 'maker'>('all')
  const [employeeList, setEmployeeList] = useState(employees)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { userData } = getUserData()

    const handleDelete = async (id: string) => {
      if (!userData || (userData?.role !== 'owner' && userData?.role !== 'admin')) {
        toast.error('Unauthorized.')
        return
      }
      const confirm = window.confirm('Are you sure you want to delete this employee?')
      if (!confirm) return
    
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast.error('User not authenticated')
          return
        }

        const idToken = await currentUser.getIdToken(true); // Force refresh the token to ensure validity

        const res = await fetch('/api/delete-employee', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ uid: id }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }

        setEmployeeList((prev) => prev.filter((emp) => emp.id !== id));
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message || 'Error deleting employee. Please try again.');
        } else {
          toast.error('Error deleting employee. Please try again.');
        }
      }
    }
    

  const handleRoleChange = async (id: string, newRole: Employee['role']) => {
    if (!userData || (userData?.role !== 'owner' && userData?.role !== 'admin')) {
      toast.error('Unauthorized.')
      return
    }
    await updateDoc(doc(db, 'users', id), { role: newRole })
    setEmployeeList((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, role: newRole } : emp))
    )
    setEditingId(null)
  }

  const filtered = filter === 'all' ? employeeList : employeeList.filter(e => e.role === filter)

  return (
    <div>
      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by role:</label>
        {['all', 'admin', 'taker', 'maker'].map((r) => (
          <button
            key={r}
            className={`mr-2 px-3 py-1 rounded ${filter === r ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter(r as typeof filter)}
          >
            {r}
          </button>
        ))}
      </div>

      <table className="w-full border text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Last Name</th>
            <th className="p-2">First Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => {
            return (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.lastName || '-'}</td>
                <td className="p-2">{e.firstName || '-'}</td>
                <td className="p-2">{e.email}</td>
                <td className="p-2 capitalize">
                  {editingId === e.id ? (
                    <select
                      value={e.role}
                      onChange={(ev) => handleRoleChange(e.id, ev.target.value as Employee['role'])}
                      className="border rounded px-2 py-1"
                    >
                      {userData?.role === 'owner' && <option value="admin">admin</option>}
                      {['taker', 'maker'].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    e.role
                  )}
                </td>
                <td className="p-2 flex gap-2">
                  {e.role === 'owner' as Employee['role'] || (userData?.role === 'admin' && (e.role === 'owner' as Employee['role'] || e.role === 'admin' as Employee['role'])) ? (
                    <span className="text-gray-500">disabled</span>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingId(e.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit role"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete employee"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
