import { Timestamp } from "firebase/firestore"

export type Role = 'admin' | 'taker' | 'maker'

export interface Employee {
  id: string
  businessId: string
  createdAt: Timestamp | string | null
  lastName: string
  firstName: string
  email: string
  role: Role
}