import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bot, X, Send, Sparkles, MessageSquare, 
  TrendingUp, Users, AlertCircle, DollarSign, 
  ChevronRight, Loader2, HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: { label: string; action: () => void }[];
  data?: any;
}

export default function AIAssistant() {
  const { 
    workOrders, clients, financialTransactions, 
    systemAlerts, services, subscription 
  } = useApp();
  const { saasSettings } = useSuperAdmin();
  const platformName = saasSettings?.platformName || 'Cristal Care ERP';

  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Base de Conhecimento Dinâmica
  const knowledgeBase = useMemo(() => [
    {
        keywords: ['dashboard', 'visão', 'geral', 'imediato', 'abrir', 'sistema', 'ver', 'começar'],
        answer: `No **Command Center** do ${platformName}, você tem uma visão 360º imediata: Lucro Líquido Real, Pátio Ativo, NPS (Qualidade) e Risco de Churn. Acompanhe também a saúde financeira, perfil dos clientes e alertas críticos como estoque baixo.`,
        action: { label: 'Ir para Dashboard', link: '/' }
    },
    {
        keywords: ['fluxo', 'operacional', 'organiza', 'kanban', 'etapas', 'fila', 'andamento'],
        answer: 'Utilizamos um **Kanban** visual para organizar o fluxo: Aprovação -> Fila de Espera -> Em Execução -> Qualidade (QA) -> Pronto. A agenda colorida ajuda a identificar rapidamente o status de cada veículo.',
        action: { label: 'Ver Operações', link: '/operations' }
    },
    {
        keywords: ['vistoria', 'entrada', 'recepção', 'avaria', 'checklist', 'técnico', 'fazer vistoria'],
        answer: 'A recepção é feita no **Portal do Técnico**. Lá registramos avarias no mapa visual (com fotos), fazemos o inventário de pertences e coletamos a assinatura digital do cliente para segurança total.',
        action: { label: 'Nova Vistoria', link: '/tech-portal' }
    },
    {
        keywords: ['crm', 'retorno', 'cliente', 'ltv', 'churn', 'relacionamento', 'fidelizar', 'perfil'],
        answer: 'Nosso CRM monitora o **LTV** (quanto o cliente gasta) e avisa sobre **Risco de Churn** (inativos há +60 dias). Temos automações de WhatsApp para lembretes, pós-venda e Recall de Manutenção.',
        action: { label: 'Acessar CRM', link: '/clients' }
    },
    {
        keywords: ['marketing', 'ia', 'inteligência', 'social', 'post', 'campanha', 'divulgar', 'criar campanha'],
        answer: 'A IA do **Social Studio** cria posts de "Antes e Depois" automáticos com legendas e hashtags. Além disso, você pode disparar campanhas segmentadas (ex: Recuperação de Inativos) e medir o ROI exato.',
        action: { label: 'Ir para Marketing', link: '/marketing' }
    },
    {
        keywords: ['qualidade', 'qa', 'garantia', 'transparência', 'confiança', 'acompanhamento'],
        answer: `Garantimos qualidade com o **Checklist Padrão ${platformName}** obrigatório antes da entrega. Para transparência, o cliente recebe um link de acompanhamento em tempo real com fotos do processo (Diário de Bordo).`,
        action: { label: 'Ver Operações', link: '/operations' }
    },
    {
        keywords: ['financeiro', 'estoque', 'rh', 'custo', 'equipe', 'comissão', 'preço', 'faturamento'],
        answer: 'O sistema integra tudo: **Financeiro** (DRE, fluxo de caixa), **Estoque Inteligente** (alertas de consumo), **Matriz de Preços** (ajuste por porte) e **RH** (cálculo automático de comissões e eficiência técnica).',
        action: { label: 'Ver Financeiro', link: '/finance' }
    },
    {
        keywords: ['agenda', 'agendamento', 'horário', 'vazio', 'ociosidade', 'marcar'],
        answer: 'Para criar um agendamento, vá em **Agenda** e clique em "Agendar" ou selecione um horário livre. Para ver a ociosidade, observe os espaços em branco na visão semanal ou verifique os alertas de "Oportunidade" no Dashboard.',
        action: { label: 'Abrir Agenda', link: '/schedule' }
    },
    {
        keywords: ['fidelidade', 'pontos', 'recompensa', 'ativo a fidelidade'],
        answer: 'Para ativar a fidelidade, vá em **Gamificação & Fidelidade** e ative o módulo. Você pode configurar quantos pontos o cliente ganha por real gasto e definir recompensas (como lavagem grátis ou descontos).',
        action: { label: 'Configurar Fidelidade', link: '/gamification' }
    },
    {
        keywords: ['despesa', 'lançar', 'gasto', 'pagar', 'conta'],
        answer: 'Para lançar uma despesa, vá em **Financeiro** e clique em "Nova Transação". Selecione "Despesa", escolha a categoria (ex: Aluguel, Produtos) e o valor. Isso atualizará seu fluxo de caixa automaticamente.',
        action: { label: 'Ir para Financeiro', link: '/finance' }
    },
    {
        keywords: ['robô', 'robo', 'bot', 'automação', 'ativar', 'whatsapp'],
        answer: 'O Robô envia mensagens automáticas via WhatsApp. Para ativá-lo, vá em **Configurações > Integrações** e escaneie o QR Code. Depois, configure as regras (Aniversário, NPS, Lembretes) na aba **Marketing > Automação**.',
        action: { label: 'Configurar Robô', link: '/settings' }
    }
  ], [platformName]);

  // Helper function for quick queries
  const handleQuickQuery = (type: string) => {
    let queryText = '';
    switch(type) {
        case 'financeiro': queryText = 'Como está o faturamento?'; break;
        case 'alertas': queryText = 'Quais os alertas críticos?'; break;
        case 'churn': queryText = 'Quem está em risco de sair?'; break;
        case 'help': queryText = 'O que o sistema faz?'; break;
        default: return;
    }
    handleSend(queryText);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI Processing
    setTimeout(() => {
      const response = processQuery(text);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const processQuery = (query: string): Message => {
    const lowerQuery = query.toLowerCase();
    const id = Date.now().toString();

    // 1. DYNAMIC DATA QUERIES (Real-time data)
    
    // Financeiro
    if (lowerQuery.includes('faturamento') || lowerQuery.includes('ganhei') || lowerQuery.includes('receita')) {
        const currentMonth = new Date().getMonth();
        const revenue = financialTransactions
            .filter(t => t.type === 'income' && t.status === 'paid' && new Date(t.date).getMonth() === currentMonth)
            .reduce((acc, t) => acc + t.amount, 0);
        
        return {
            id,
            role: 'assistant',
            text: `Seu faturamento este mês é de **${formatCurrency(revenue)}**.`,
            actions: [
                { label: 'Ver Detalhes', action: () => { navigate('/finance'); setIsOpen(false); } }
            ]
        };
    }

    // Alertas
    if (lowerQuery.includes('alerta') || lowerQuery.includes('problema') || lowerQuery.includes('atenção')) {
        const critical = systemAlerts.filter(a => a.level === 'critico');
        if (critical.length > 0) {
            return {
                id,
                role: 'assistant',
                text: `Encontrei **${critical.length} alertas críticos**. O mais importante é: "${critical[0].message}"`,
                actions: [
                    { label: 'Resolver Agora', action: () => { navigate('/'); setIsOpen(false); } }
                ]
            };
        }
        return { id, role: 'assistant', text: 'Tudo tranquilo! Nenhum alerta crítico no momento.' };
    }

    // Churn / Clientes
    if (lowerQuery.includes('sair') || lowerQuery.includes('risco')) {
        const atRisk = clients.filter(c => c.status === 'churn_risk');
        const potentialLoss = atRisk.reduce((acc, c) => acc + (c.ltv / (c.visitCount || 1)), 0);
        
        return {
            id,
            role: 'assistant',
            text: `Identifiquei **${atRisk.length} clientes** com risco de churn. Isso representa um impacto estimado de **${formatCurrency(potentialLoss)}** em receita recorrente.`,
            actions: [
                { label: 'Criar Campanha de Resgate', action: () => { navigate('/marketing'); setIsOpen(false); } }
            ]
        };
    }

    // 2. KNOWLEDGE BASE MATCHING (Static Training)
    const knowledgeMatch = knowledgeBase.find(item => 
        item.keywords.some(keyword => lowerQuery.includes(keyword))
    );

    if (knowledgeMatch) {
        return {
            id,
            role: 'assistant',
            text: knowledgeMatch.answer,
            actions: knowledgeMatch.action ? [
                { label: knowledgeMatch.action.label, action: () => { navigate(knowledgeMatch.action.link); setIsOpen(false); } }
            ] : undefined
        };
    }

    // 3. FALLBACK / HELP
    if (lowerQuery.includes('ajuda') || lowerQuery.includes('faz')) {
        return {
            id,
            role: 'assistant',
            text: `Sou o **Consultor Inteligente** do ${platformName}! 🤖\n\nPosso te ajudar com:\n1. **Dados em Tempo Real**: Pergunte sobre faturamento, alertas ou clientes.\n2. **Processos**: Pergunte "como funciona a vistoria" ou "o que é o CRM".\n3. **Gestão**: Pergunte sobre estoque, financeiro ou equipe.`,
            actions: [
                { label: 'Ver Dashboard', action: () => { navigate('/'); setIsOpen(false); } }
            ]
        };
    }

    // Default
    return {
        id,
        role: 'assistant',
        text: 'Não entendi exatamente. Tente perguntar sobre "faturamento", "como funciona a vistoria", "clientes em risco" ou "como criar um agendamento".'
    };
  };

  // Context-Aware Initialization
  useEffect(() => {
      const getContextMessage = (): Message => {
          const path = location.pathname;
          const timestamp = Date.now(); // Ensure unique ID for each navigation event
          
          if (path === '/' || path === '/dashboard') {
              return {
                  id: `welcome-dash-${timestamp}`,
                  role: 'assistant',
                  text: 'Olá! Sou seu consultor de gestão. Posso ajudar com dados do seu negócio ou explicar como o sistema funciona. O que deseja saber?',
                  actions: [
                      { label: '📊 Resumo Financeiro', action: () => handleQuickQuery('financeiro') },
                      { label: '⚠️ Alertas Críticos', action: () => handleQuickQuery('alertas') },
                      { label: '❓ Como funciona?', action: () => handleQuickQuery('help') }
                  ]
              };
          } else if (path.includes('/clients')) {
              return {
                  id: `welcome-clients-${timestamp}`,
                  role: 'assistant',
                  text: 'Estou aqui para ajudar com seus **Clientes e CRM**. O que você precisa?',
                  actions: [
                      { label: '💎 Como funciona o CRM?', action: () => handleSend('Como funciona o CRM?') },
                      { label: '📉 Clientes em Risco', action: () => handleQuickQuery('churn') },
                      { label: '🏆 Ativar Fidelidade', action: () => handleSend('Como ativo a fidelidade?') }
                  ]
              };
          } else if (path.includes('/schedule')) {
              return {
                  id: `welcome-schedule-${timestamp}`,
                  role: 'assistant',
                  text: 'Precisa de ajuda com a **Agenda**? Posso explicar como agendar ou verificar ociosidade.',
                  actions: [
                      { label: '📅 Novo Agendamento', action: () => handleSend('Como crio um agendamento?') },
                      { label: '🔍 Ver Ociosidade', action: () => handleSend('Como vejo horários vazios?') }
                  ]
              };
          } else if (path.includes('/finance')) {
              return {
                  id: `welcome-finance-${timestamp}`,
                  role: 'assistant',
                  text: 'Vamos analisar seus números? Posso mostrar o faturamento ou explicar como lançar despesas.',
                  actions: [
                      { label: '💰 Faturamento Hoje', action: () => handleQuickQuery('financeiro') },
                      { label: '📉 Lançar Despesa', action: () => handleSend('Como lanço uma despesa?') }
                  ]
              };
          } else if (path.includes('/marketing')) {
              return {
                  id: `welcome-marketing-${timestamp}`,
                  role: 'assistant',
                  text: 'Quer vender mais? Posso ajudar com campanhas e automação.',
                  actions: [
                      { label: '🚀 Criar Campanha', action: () => handleSend('Como crio uma campanha?') },
                      { label: '🤖 Ativar Robô', action: () => handleSend('Como ativo o robô?') },
                      { label: '📸 Social Studio', action: () => handleSend('O que é o Social Studio?') }
                  ]
              };
          } else if (path.includes('/operations') || path.includes('/tech-portal')) {
              return {
                  id: `welcome-ops-${timestamp}`,
                  role: 'assistant',
                  text: 'Dúvidas na operação? Posso explicar o fluxo de trabalho ou a vistoria.',
                  actions: [
                      { label: '🚗 Nova Vistoria', action: () => handleSend('Como faço uma vistoria?') },
                      { label: '✅ Checklist de Qualidade', action: () => handleSend('O que é o QA?') }
                  ]
              };
          } else {
              return {
                  id: `welcome-generic-${timestamp}`,
                  role: 'assistant',
                  text: 'Olá! Como posso ajudar você hoje?',
                  actions: [
                      { label: '❓ Como funciona?', action: () => handleQuickQuery('help') }
                  ]
              };
          }
      };

      // Reset or Append context message when location changes
      const contextMsg = getContextMessage();
      
      setMessages(prev => {
          if (prev.length === 0) return [contextMsg];
          
          // Avoid duplicate welcome messages if navigating quickly (check text content)
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.text === contextMsg.text) return prev;

          return [...prev, contextMsg];
      });

  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
            isOpen ? "bg-slate-800 rotate-90" : "bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse"
        )}
      >
        {isOpen ? <X className="text-white" /> : <Bot className="text-white" size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-48px)] h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Consultor Inteligente</h3>
                    <p className="text-xs text-indigo-100">Especialista {platformName}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={cn(
                            "flex flex-col max-w-[85%]",
                            msg.role === 'user' ? "self-end items-end" : "self-start items-start"
                        )}
                    >
                        <div className={cn(
                            "p-3 rounded-2xl text-sm",
                            msg.role === 'user' 
                                ? "bg-indigo-600 text-white rounded-tr-none" 
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm"
                        )}>
                            {msg.text.split('**').map((part, i) => 
                                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                        </div>
                        
                        {msg.actions && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {msg.actions.map((action, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={action.action}
                                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                                    >
                                        {action.label} <ChevronRight size={12} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="self-start bg-slate-200 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none w-12 flex items-center justify-center">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte sobre gestão ou dados..."
                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
      )}
    </>
  );
}
