import { WhatsappSessionInfo } from '../types';

interface WhatsAppConfig {
  baseUrl: string;
  apiKey: string;
  instanceId?: string;
  sessionName?: string;
  phoneNumber?: string;
}

// ===============================
// CORE CALL (HYBRID: DEV/PROD)
// ===============================
const callApi = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: any,
  config?: WhatsAppConfig
) => {
  try {
    // 1. Validate Configuration
    if (!config?.apiKey || !config?.instanceId) {
        throw new Error('Configuração incompleta: ID da Instância ou Token ausente.');
    }

    // SANITIZATION: Trim whitespace to prevent 500 errors
    // This fixes issues where copy-pasting adds invisible spaces
    const cleanInstanceId = config.instanceId.trim();
    const cleanApiKey = config.apiKey.trim();

    const isDev = import.meta.env.DEV;
    let response: Response;

    // Clean endpoint to avoid double slashes
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');

    if (isDev) {
        // --- DEVELOPMENT MODE (Vite Proxy) ---
        // Routes through vite.config.ts proxies to bypass CORS locally
        const isIo = config.baseUrl.includes('.io');
        const proxyPrefix = isIo ? '/w-api-proxy-io' : '/w-api-proxy-app';
        
        // Construct URL: /proxy/endpoint/INSTANCE_ID
        // Example: /w-api-proxy-io/instance/status/INSTANCE_ID
        const url = `${proxyPrefix}/${cleanEndpoint}/${cleanInstanceId}`;

        console.log(`[Dev Proxy] Calling: ${url}`);

        response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${cleanApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });

    } else {
        // --- PRODUCTION MODE (Internal API) ---
        // Routes through /api/whatsapp-proxy (Vercel Edge Function)
        const proxyPayload = {
            endpoint: `/${cleanEndpoint}`,
            method,
            body,
            instanceId: cleanInstanceId,
            token: cleanApiKey,
            baseUrl: config.baseUrl || 'https://api.w-api.io'
        };

        response = await fetch('/api/whatsapp-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(proxyPayload)
        });
    }

    // 4. Handle Response
    const text = await response.text();
    
    if (!response.ok) {
      let errorMsg = `Erro API (${response.status})`;
      try {
        const json = JSON.parse(text);
        errorMsg = json.error || json.message || errorMsg;
      } catch {
        errorMsg = text.substring(0, 100) || errorMsg;
      }
      console.error('[WhatsApp API Error]', { status: response.status, url: endpoint, error: errorMsg });
      throw new Error(errorMsg);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { success: true, raw: text };
    }

  } catch (error: any) {
    console.error('[WhatsApp Service]', error);
    throw error;
  }
};

// ===============================
// WHATSAPP SERVICE EXPORTS
// ===============================
export const whatsappService = {

  // 🔌 Testar conexão
  testConnection: async (config: WhatsAppConfig): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await callApi('/instance/status', 'GET', undefined, config);

      if (data) {
        const isConnected = data.connected === true || data.status === 'open' || data.status === 'connected';
        const statusMsg = data.status || (data.connected ? 'Conectado' : 'Desconectado');
        
        return {
          success: true,
          message: isConnected
            ? `Sucesso! Status: ${statusMsg}`
            : `Instância encontrada, mas desconectada (Status: ${statusMsg})`
        };
      }

      return {
        success: false,
        message: 'Resposta vazia da API'
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro ao conectar'
      };
    }
  },

  // 📷 Obter QR Code
  getQrCode: async (config: WhatsAppConfig): Promise<string> => {
    try {
      const data = await callApi('/instance/qr', 'GET', undefined, config);
      return data.qr || data.base64 || '';
    } catch (e) {
      console.warn('Erro ao obter QR:', e);
      return '';
    }
  },

  // 🔢 Obter Pairing Code
  getPairingCode: async (config: WhatsAppConfig): Promise<string> => {
    if (!config.phoneNumber) return '';
    try {
       const data = await callApi('/instance/pairing-code', 'POST', { phoneNumber: config.phoneNumber }, config);
       return data.code || data.pairingCode || '';
    } catch (e) {
       console.warn('Erro ao obter Pairing Code:', e);
       return '';
    }
  },

  // 📡 Verificar status
  checkStatus: async (config: WhatsAppConfig): Promise<WhatsappSessionInfo> => {
    try {
      const data = await callApi('/instance/status', 'GET', undefined, config);

      let status: 'connected' | 'disconnected' | 'scanning' = 'disconnected';

      if (data.connected === true || data.status === 'open' || data.status === 'connected') {
        status = 'connected';
      } else if (data.status === 'qr' || data.status === 'scanning') {
        status = 'scanning';
      }

      return {
        status,
        device: {
          name: data.pushName || 'WhatsApp',
          number: data.phone || '',
          battery: data.battery || 0,
          platform: data.platform || 'api',
          avatarUrl: data.profilePictureUrl || ''
        }
      };
    } catch {
      return { status: 'disconnected' };
    }
  },

  // ✉️ Enviar mensagem
  sendMessage: async (
    phone: string,
    message: string,
    config: WhatsAppConfig
  ): Promise<{ messageId: string; status: 'sent' | 'failed' }> => {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const number = cleanPhone.startsWith('55') && cleanPhone.length <= 11
        ? `55${cleanPhone}`
        : cleanPhone;

      const data = await callApi('/message/send-text', 'POST', {
        number,
        message
      }, config);

      return {
        messageId: data?.id || data?.key?.id || Date.now().toString(),
        status: 'sent'
      };
    } catch (e) {
      console.error('Erro ao enviar msg:', e);
      return {
        messageId: '',
        status: 'failed'
      };
    }
  },

  // 🚪 Logout
  logout: async (config: WhatsAppConfig): Promise<boolean> => {
    try {
      await callApi('/instance/logout', 'DELETE', undefined, config);
      return true;
    } catch {
      return false;
    }
  },
  
  // 🚀 Start Session
  startSession: async (config: WhatsAppConfig) => {
      const qrCode = await whatsappService.getQrCode(config);
      let pairingCode = '';
      if (config.phoneNumber) {
          pairingCode = await whatsappService.getPairingCode(config);
      }
      return { qrCode, pairingCode };
  }
};
