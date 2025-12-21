import { WhatsappSessionInfo } from '../types';

// Simulação da API w-api.app
// Em produção, isso faria chamadas fetch para a API real

export const whatsappService = {
  // 1. Iniciar Sessão (Obter QR Code)
  startSession: async (): Promise<{ qrCode: string; pairingCode: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Delay de rede
    
    return {
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SimulacaoWhatsAppConexaoCristalCare',
      pairingCode: 'ABCD-1234'
    };
  },

  // 2. Verificar Status da Sessão
  checkStatus: async (): Promise<WhatsappSessionInfo> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simula estado conectado (em um app real, isso viria do backend)
    // Para fins de protótipo, vamos assumir que se chamou isso, está tentando conectar ou já conectou
    // A lógica de "sucesso" será controlada pelo AppContext simulando o webhook
    return {
      status: 'scanning',
      device: undefined
    };
  },

  // 3. Enviar Mensagem
  sendMessage: async (phone: string, message: string): Promise<{ messageId: string; status: 'sent' }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Rápido
    
    console.log(`[WhatsApp API] Sending to ${phone}: ${message}`);
    
    return {
      messageId: `wamid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'sent'
    };
  },

  // 4. Simular Webhook de Recebimento/Leitura (Para atualizar logs)
  // Retorna um status aleatório para simular a vida real
  simulateDeliveryUpdate: async (): Promise<'delivered' | 'read'> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return Math.random() > 0.3 ? 'read' : 'delivered';
  },

  // 5. Desconectar
  logout: async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }
};
