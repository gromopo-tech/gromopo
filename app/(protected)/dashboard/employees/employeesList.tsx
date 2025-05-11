'use client'

import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

type Employee = {
  id: string
  email: string
  username?: string
  role: 'admin' | 'taker' | 'maker'
}

export default function EmployeesList({ employees }: { employees: Employee[] }) {
  const [filter, setFilter] = useState<'all' | 'admin' | 'taker' | 'maker'>('all')
  const [employeeList, setEmployeeList] = useState(employees)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUserId(user.uid);
        } else {
          setCurrentUserId(null);
        }
      });
  
      return () => unsubscribe();
    }, []);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this employee?')
    if (!confirm) return

    await deleteDoc(doc(db, 'users', id))
    setEmployeeList((prev) => prev.filter((emp) => emp.id !== id))
  }

  const handleRoleChange = async (id: string, newRole: Employee['role']) => {
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
            <th className="p-2">Username</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => {
            const isSelf = e.id === currentUserId
            return (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.username || '-'}</td>
                <td className="p-2">{e.email}</td>
                <td className="p-2 capitalize">
                  {editingId === e.id && !isSelf ? (
                    <select
                      value={e.role}
                      onChange={(ev) => handleRoleChange(e.id, ev.target.value as Employee['role'])}
                      className="border rounded px-2 py-1"
                    >
                      {['admin', 'taker', 'maker'].map((r) => (
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
                  {!isSelf && (
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
                  {isSelf && (
                      <span className="text-gray-400 italic text-sm">You</span>
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
