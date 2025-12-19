import { CampaignTemplate, Client, MarketingCampaign } from '../types';

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'flash',
    label: '⚡ Flash Schedule (Horários Vazios)',
    category: 'sales',
    defaultMessage: 'Olá {cliente}! Liberou um horário exclusivo para AMANHÃ às {horario} com {desconto}% de desconto em qualquer serviço. Responda "QUERO" para garantir! 🚗✨',
    suggestedSegment: 'recurring',
    variables: ['{cliente}', '{horario}', '{desconto}']
  },
  {
    id: 'reactivation',
    label: '💙 Reativação (Saudade)',
    category: 'retention',
    defaultMessage: 'Oi {cliente}, faz tempo que não cuidamos do seu {veiculo}! Sentimos sua falta. Que tal agendar uma visita e ganhar uma hidratação de plásticos de cortesia? 🎁',
    suggestedSegment: 'inactive',
    variables: ['{cliente}', '{veiculo}']
  },
  {
    id: 'vip',
    label: '⭐ VIP Exclusivo',
    category: 'relationship',
    defaultMessage: 'Olá {cliente}! Como nosso cliente VIP, você tem acesso antecipado à nossa nova agenda. Garanta seu horário para o {veiculo} antes de todo mundo! 🚀',
    suggestedSegment: 'vip',
    variables: ['{cliente}', '{veiculo}']
  },
  {
    id: 'birthday',
    label: '🎂 Aniversário',
    category: 'relationship',
    defaultMessage: 'Parabéns {cliente}! 🎉 No mês do seu aniversário, a Cristal Care tem um presente: {desconto}% OFF no Polimento Técnico. Venha deixar seu {veiculo} novo de novo!',
    suggestedSegment: 'all',
    variables: ['{cliente}', '{desconto}', '{veiculo}']
  },
  {
    id: 'promo',
    label: '🎯 Promoção de Serviço',
    category: 'sales',
    defaultMessage: 'Oportunidade, {cliente}! 🌧️ Com a previsão de chuva, proteja seu {veiculo} com nossa Vitrificação. Preço especial de R$ {valor} apenas esta semana.',
    suggestedSegment: 'all',
    variables: ['{cliente}', '{veiculo}', '{valor}']
  },
  {
    id: 'combo',
    label: '📦 Combo/Pacote',
    category: 'sales',
    defaultMessage: 'Combo Especial {nome_combo}: {lista_servicos} por apenas R$ {valor}! Ideal para seu {veiculo}. Agende agora!',
    suggestedSegment: 'all',
    variables: ['{nome_combo}', '{lista_servicos}', '{valor}', '{veiculo}']
  }
];

export const replaceVariables = (message: string, client: Client, campaignData: Partial<MarketingCampaign> & { customVariables?: Record<string, string> }): string => {
  let processed = message;
  
  // Standard Variables
  processed = processed.replace(/{cliente}/g, client.name.split(' ')[0]);
  processed = processed.replace(/{veiculo}/g, client.vehicles[0]?.model || 'veículo');
  
  // Campaign Specific Variables
  if (campaignData.discount?.value) {
    processed = processed.replace(/{desconto}/g, campaignData.discount.value.toString());
  }
  
  // Custom Variables (passed from modal state)
  if (campaignData.customVariables) {
    Object.entries(campaignData.customVariables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{${key}}`, 'g'), value);
    });
  }

  return processed;
};

export const validateMessageVariables = (message: string, requiredVars: string[]): string[] => {
  const missing: string[] = [];
  requiredVars.forEach(v => {
    if (message.includes(v)) {
       // Check if we have data for this? 
       // For now, we just assume client data exists. 
       // This function is more about checking if the user removed a variable that is critical, 
       // or if they added one we don't support.
    }
  });
  return missing;
};

export const getTemplateById = (id: string) => CAMPAIGN_TEMPLATES.find(t => t.id === id);
