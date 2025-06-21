import { SubmitOrderParams } from './order';
import { handleMercadoPagoPayment, handleSolanaPayPayment } from './payment-methods';

export type PaymentMethod = 'mercadopago' | 'solanapay';

export async function handlePayment(method: PaymentMethod, order: SubmitOrderParams) {
  if (method === 'mercadopago') {
    return await handleMercadoPagoPayment(order);
  }
  if (method === 'solanapay') {
    return await handleSolanaPayPayment(order);
  }
  throw new Error('Unsupported payment method');
}
