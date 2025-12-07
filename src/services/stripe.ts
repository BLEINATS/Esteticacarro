import { AsaasPayment } from './asaas';

// Serviço simulado do Stripe adaptado para a interface visual do sistema
export const createStripePixPaymentIntent = async (amount: number, description: string): Promise<AsaasPayment> => {
  // Simula delay de rede do Stripe
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    id: `pi_${Date.now()}_stripe`,
    status: 'PENDING',
    value: amount,
    description,
    billingType: 'PIX',
    pix: {
      // Payload Pix do Stripe (Simulado)
      payload: `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540${amount.toFixed(2).replace('.', '')}5802BR5913Stripe Payments6008Sao Paulo62070503***6304STRIPE`,
      expirationDate: new Date(Date.now() + 3600 * 1000).toISOString()
    }
  };
};

export const createStripeCardPaymentIntent = async (amount: number, cardDetails: any, description: string): Promise<AsaasPayment> => {
  // Simula delay de processamento do Stripe
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulação de erro específica do Stripe
  if (cardDetails.holderName.toUpperCase().includes('DECLINE')) {
    throw new Error('Stripe: Your card was declined.');
  }

  return {
    id: `pi_cc_${Date.now()}_stripe`,
    status: 'RECEIVED',
    value: amount,
    description,
    billingType: 'CREDIT_CARD',
    creditCard: {
      brand: 'visa', // Stripe default mock
      last4: cardDetails.number.slice(-4)
    }
  };
};
