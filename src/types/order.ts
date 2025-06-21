export interface Order {
  orderId: string;
  orderNumber?: number;
  orderType: string;
  customerName?: string;
  status?: string;
  createdAt?: string;
  preparingAt?: string;
  preparedAt?: string;
  paidAt?: string;
  // add other fields as needed
}
