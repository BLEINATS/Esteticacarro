import { formatCurrency } from '../lib/utils';

// Tipos para resposta do Asaas (Simulação)
export interface AsaasPayment {
  id: string;
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE';
  value: number;
  description: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  pix?: {
    payload: string; // Código Copia e Cola
    expirationDate: string;
  };
  boleto?: {
    barCode: string;
    url: string;
  };
  creditCard?: {
    brand: string;
    last4: string;
  };
}

// Simula a criação de uma cobrança Pix
export const createPixCharge = async (amount: number, description: string): Promise<AsaasPayment> => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    id: `pay_${Date.now()}`,
    status: 'PENDING',
    value: amount,
    description,
    billingType: 'PIX',
    pix: {
      // Payload Pix Estático para simulação (em produção viria da API)
      payload: `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540${amount.toFixed(2).replace('.', '')}5802BR5913Cristal Care6008Sao Paulo62070503***6304ABCD`,
      expirationDate: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hora
    }
  };
};

// Simula a criação de uma cobrança por Cartão de Crédito
export const createCreditCardCharge = async (amount: number, cardDetails: any, description: string): Promise<AsaasPayment> => {
  // Simula delay de processamento da adquirente
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Simulação simples: se o nome for "ERRO", rejeita
  if (cardDetails.holderName.toUpperCase().includes('ERRO')) {
    throw new Error('Transação não autorizada pela operadora.');
  }

  return {
    id: `pay_cc_${Date.now()}`,
    status: 'RECEIVED', // Aprovado
    value: amount,
    description,
    billingType: 'CREDIT_CARD',
    creditCard: {
      brand: 'mastercard', // Simulado
      last4: cardDetails.number.slice(-4)
    }
  };
};

// Simula a verificação de status (Polling)
export const checkPaymentStatus = async (paymentId: string): Promise<'PENDING' | 'RECEIVED'> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  // Em simulação, sempre retornamos pendente até o usuário clicar em "Simular Pagamento" no modal
  return 'PENDING';
};
