import Link from 'next/link'
import EmployeesList from './employeesList'
import type { Employee } from '@/types/employee'
import { adminDb } from '@/lib/firebase/adminConfig'
import { Timestamp } from 'firebase/firestore'


export default async function EmployeesPage() {
  const snapshot = await adminDb.collection('users').get()

  const employees: Employee[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Employee, 'id'>
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null, // Ensure createdAt is always a plain value
    }
  })
  

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Link
          href="/dashboard/employees/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Employee
        </Link>
      </div>
      <EmployeesList employees={employees} />
    </div>
  )
}
