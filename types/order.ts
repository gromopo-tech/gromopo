export interface Order {
  orderId: string;
  orderNumber?: number;
  name?: string;
  orderTaker?: string;
  orderMaker?: string;
  status?: string;
  createdAt?: string;
  preparingAt?: string;
  preparedAt?: string;
  paidAt?: string;
  // add other fields as needed
}
