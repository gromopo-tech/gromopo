'use client'

import { useState, useContext } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { toast } from 'sonner'
import type { Employee } from '@/types/employee'
import { RoleContext } from '@/components/private/role-provider'

export default function EmployeesList({ employees }: { employees: Employee[] }) {
  const [filter, setFilter] = useState<'all' | 'admin' | 'taker' | 'maker'>('all')
  const [employeeList, setEmployeeList] = useState(employees)
  const [editingId, setEditingId] = useState<string | null>(null)
  const role = useContext(RoleContext)

  const handleDelete = async (id: string) => {
    if (!role || (role !== 'owner' && role !== 'admin')) {
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
    if (!role || (role !== 'owner' && role !== 'admin')) {
      toast.error('Unauthorized.')
      return
    }
    try {
      // Update Firestore for display
      await updateDoc(doc(db, 'users', id), { role: newRole })
      // Update custom claims via API
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const idToken = await currentUser.getIdToken(true);
      // Get businessId from context or employeeList
      const employee = employeeList.find(emp => emp.id === id);
      const businessId = employee?.businessId;
      if (!businessId) throw new Error('Missing businessId for user');
      const res = await fetch('/api/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ uid: id, role: newRole, businessId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      setEmployeeList((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, role: newRole } : emp))
      )
      setEditingId(null)
      toast.success('Role updated!');
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message || 'Error updating role. Please try again.');
      } else {
        toast.error('Error updating role. Please try again.');
      }
    }
  }

  const filtered = filter === 'all' ? employeeList : employeeList.filter(e => e.role === filter)

  return (
    <div>
      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by role:</label>
        {['all', 'admin', 'taker', 'maker'].map((r) => (
          <button
            key={r}
            className={`mr-2 px-3 py-1 rounded ${filter === r ? 'bg-blue-600 text-white' : 'border p1 rounded'}`}
            onClick={() => setFilter(r as typeof filter)}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border text-left">
          <thead>
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
                        {role === 'owner' && <option value="admin">admin</option>}
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
                    {e.role === 'owner' as Employee['role'] || (role === 'admin' && (e.role === 'owner' as Employee['role'] || e.role === 'admin' as Employee['role'])) ? (
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
    </div>
  )
}
