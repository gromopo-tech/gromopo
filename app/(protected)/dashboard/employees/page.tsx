import Link from 'next/link'
import EmployeesList from './employeesList'
import { adminDb } from '@/lib/firebase/adminConfig'

type Employee = {
  id: string
  email: string
  username?: string
  role: 'admin' | 'taker' | 'maker'
}

export default async function EmployeesPage() {
  const snapshot = await adminDb.collection('users').get()

  const employees: Employee[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Employee, 'id'>
    return { id: doc.id, ...data }
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
