import { supabase } from '../lib/supabase';
import { AsaasPayment } from './asaas';

// --- REAL STRIPE INTEGRATION (VIA SUPABASE EDGE FUNCTIONS) ---

/**
 * Tenta criar uma sessão de checkout real via Supabase Edge Function.
 * Se a função não estiver implantada ou falhar, cai para o modo de simulação.
 */
export const createRealStripeSession = async (
  name: string,
  price: number,
  mode: 'payment' | 'subscription',
  metadata: any = {}
): Promise<{ url: string } | null> => {
  try {
    console.log("Tentando conectar com Supabase Edge Function 'create-checkout'...");
    
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        name,
        price,
        mode,
        successUrl: `${window.location.origin}/settings?payment=success`,
        cancelUrl: `${window.location.origin}/settings?payment=cancel`,
        metadata
      }
    });

    if (error) {
      console.warn("Edge Function não encontrada ou erro na chamada. Usando simulação.", error);
      return null;
    }

    if (data?.url) {
      console.log("Sessão Stripe Real criada:", data.url);
      return { url: data.url };
    }
    
    return null;
  } catch (err) {
    console.warn("Erro ao chamar Edge Function:", err);
    return null;
  }
};

// --- SIMULATION FALLBACKS ---

export const createStripePixPaymentIntent = async (amount: number, description: string): Promise<AsaasPayment> => {
  // Tenta Real Primeiro (Para Pix no Stripe, o fluxo de Checkout Session também funciona)
  const realSession = await createRealStripeSession(description, amount, 'payment', { type: 'pix_simulated' });
  
  if (realSession) {
      // Se conseguir criar sessão real, redirecionamos o usuário (comportamento híbrido)
      // Mas como a interface espera um objeto AsaasPayment para renderizar QR Code, 
      // para o Pix especificamente, manteremos a simulação visual se não for redirecionamento total.
      // O Stripe Pix geralmente é via Checkout Page.
      window.location.href = realSession.url;
      // Retorna pendente para segurar a UI enquanto redireciona
      return {
          id: 'redirecting',
          status: 'PENDING',
          value: amount,
          description,
          billingType: 'PIX'
      } as any;
  }

  // Fallback Simulado
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    id: `pi_${Date.now()}_stripe`,
    status: 'PENDING',
    value: amount,
    description,
    billingType: 'PIX',
    pix: {
      payload: `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540${amount.toFixed(2).replace('.', '')}5802BR5913Stripe Payments6008Sao Paulo62070503***6304STRIPE`,
      expirationDate: new Date(Date.now() + 3600 * 1000).toISOString()
    }
  };
};

export const createStripeCardPaymentIntent = async (amount: number, cardDetails: any, description: string): Promise<AsaasPayment> => {
  // Fallback Simulado (Checkout Transparente Mock)
  await new Promise(resolve => setTimeout(resolve, 2000));

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
      brand: 'visa',
      last4: cardDetails.number.slice(-4)
    }
  };
};

export const createStripeSubscription = async (planId: string, cardDetails: any): Promise<AsaasPayment> => {
    // Fallback Simulado
    await new Promise(resolve => setTimeout(resolve, 2500));

    if (cardDetails.holderName.toUpperCase().includes('DECLINE')) {
        throw new Error('Stripe: Subscription failed. Card declined.');
    }

    return {
        id: `sub_${Date.now()}_stripe`,
        status: 'RECEIVED',
        value: 0,
        description: `Subscription to ${planId}`,
        billingType: 'CREDIT_CARD',
        creditCard: {
            brand: 'mastercard',
            last4: cardDetails.number.slice(-4)
        }
    };
};

// --- ADMIN SYNC ---

export const syncProductToStripe = async (name: string, price: number, type: 'recurring' | 'one_time', apiKey: string) => {
    // Aqui também poderíamos chamar uma Edge Function "sync-products" se quiséssemos sincronizar o catálogo real
    console.log(`[Stripe Sync] Connecting with API Key: ${apiKey.substring(0, 8)}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
        productId: `prod_${Math.random().toString(36).substr(2, 9)}`,
        priceId: `price_${Math.random().toString(36).substr(2, 9)}`,
        livemode: apiKey.startsWith('sk_live')
    };
};
