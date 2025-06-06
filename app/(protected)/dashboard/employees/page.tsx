import Link from 'next/link'
import EmployeesList from './employeesList'
import type { Employee } from '@/types/employee'
import { adminDb } from '@/lib/firebase/adminConfig'
import { Timestamp } from 'firebase/firestore'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export default async function EmployeesPage() {
  // Get the current user's token from cookies
  const token = (await cookies()).get('__session')?.value;
  if (!token) {
    return <div>Unauthorized</div>;
  }

  // Decode JWT to get businessId
  let businessId: string | null = null;
  try {
    const decoded: any = jwt.decode(token);
    businessId = decoded?.businessId || null;
  } catch (err) {
    return <div>Invalid session</div>;
  }
  if (!businessId) {
    return <div>No businessId found for user.</div>;
  }

  // Query only users with the same businessId
  const snapshot = await adminDb.collection('users').where('businessId', '==', businessId).get();
  const employees: Employee[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Employee, 'id'>
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
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
