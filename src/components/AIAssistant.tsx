import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, X, Send, Sparkles, MessageSquare, 
  TrendingUp, Users, AlertCircle, DollarSign, 
  ChevronRight, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Olá! Sou seu assistente de gestão. Como posso ajudar hoje?',
      actions: [
        { label: '📊 Resumo Financeiro', action: () => handleQuickQuery('financeiro') },
        { label: '⚠️ Alertas Críticos', action: () => handleQuickQuery('alertas') },
        { label: '👥 Risco de Churn', action: () => handleQuickQuery('churn') }
      ]
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleQuickQuery = (type: string) => {
    let queryText = '';
    switch(type) {
        case 'financeiro': queryText = 'Como está o faturamento?'; break;
        case 'alertas': queryText = 'Quais os alertas críticos?'; break;
        case 'churn': queryText = 'Quem está em risco de sair?'; break;
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

    // 1. Financeiro
    if (lowerQuery.includes('faturamento') || lowerQuery.includes('financeiro') || lowerQuery.includes('ganhei')) {
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

    // 2. Alertas
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

    // 3. Churn / Clientes
    if (lowerQuery.includes('churn') || lowerQuery.includes('risco') || lowerQuery.includes('sair')) {
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

    // 4. Serviços
    if (lowerQuery.includes('serviço') || lowerQuery.includes('lucro')) {
        return {
            id,
            role: 'assistant',
            text: 'Analisei seus serviços. O "Polimento Técnico" é o que traz maior margem de lucro por hora. Sugiro focar vendas nele.',
            actions: [
                { label: 'Ver Rentabilidade', action: () => { navigate('/pricing'); setIsOpen(false); } }
            ]
        };
    }

    // Default
    return {
        id,
        role: 'assistant',
        text: 'Desculpe, ainda estou aprendendo. Tente perguntar sobre "faturamento", "alertas" ou "clientes em risco".'
    };
  };

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
                    <h3 className="font-bold text-sm">Assistente Inteligente</h3>
                    <p className="text-xs text-indigo-100">Pergunte sobre sua loja</p>
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
                                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
                                    >
                                        {action.label}
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
                        placeholder="Digite sua pergunta..."
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
