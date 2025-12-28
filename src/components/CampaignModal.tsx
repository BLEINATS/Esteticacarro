import React, { useState, useEffect } from 'react';
import { 
  X, Send, Save, MessageSquare, Users, Settings, Eye, 
  Sparkles, Calendar, Clock, ChevronRight, AlertTriangle,
  Smartphone, Mail, CheckCircle2, Info, Link as LinkIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, MarketingCampaign, CampaignTemplate } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { CAMPAIGN_TEMPLATES, replaceVariables } from '../services/campaignService';
import RecipientSelector from './RecipientSelector';
import { useDialog } from '../context/DialogContext';
import { useNavigate } from 'react-router-dom';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Partial<MarketingCampaign> & { selectedClientIds: string[] }) => void;
  clients: Client[];
  initialData?: Partial<MarketingCampaign> | null;
  mode?: 'create' | 'edit';
}

export default function CampaignModal({ isOpen, onClose, onSave, clients, initialData, mode = 'create' }: CampaignModalProps) {
  const { subscription, companySettings } = useApp();
  const { showAlert, showConfirm } = useDialog();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'message' | 'recipients' | 'settings' | 'preview'>('message');
  
  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'custom');
  const [message, setMessage] = useState(initialData?.messageTemplate || '');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(initialData?.selectedClientIds || []);
  
  // Smart Segment State (Controls RecipientSelector)
  const [smartSegment, setSmartSegment] = useState<string | undefined>(
      initialData?.targetSegment && initialData.targetSegment !== 'custom' ? initialData.targetSegment : undefined
  );

  // Channel is now strictly 'whatsapp'
  const [channel, setChannel] = useState<'whatsapp'>('whatsapp');
  
  // Settings State
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  // Custom Variables for Preview
  const [customVars, setCustomVars] = useState<Record<string, string>>({
    horario: '',
    valor: '',
    nome_combo: '',
    lista_servicos: ''
  });

  // Load Template Logic (SMART UPDATE)
  const handleTemplateSelect = (template: CampaignTemplate) => {
    setType(template.id as any);
    setMessage(template.defaultMessage);
    if (name === '') setName(template.label.split('(')[0].trim());
    
    // Auto-select smart segment based on template
    if (template.suggestedSegment) {
        setSmartSegment(template.suggestedSegment);
    }
  };

  // Validation
  const isValid = name && message && selectedClientIds.length > 0;
  const costPerMsg = 1; // WhatsApp cost fixed at 1 token
  const totalCost = selectedClientIds.length * costPerMsg;
  const canAfford = (subscription.tokenBalance || 0) >= totalCost;
  const isWhatsAppConnected = companySettings.whatsapp.session.status === 'connected';

  // Preview Data
  const previewClient = selectedClientIds.length > 0 
    ? clients.find(c => c.id === selectedClientIds[0]) 
    : clients[0]; // Fallback for preview

  const previewMessage = previewClient 
    ? replaceVariables(message, previewClient, { 
        discount: { type: discountType, value: discountValue },
        customVariables: { ...customVars, horario: scheduleTime || '09:00', data: scheduleDate || 'Amanhã' }
      }) 
    : message;

  const handleSaveDraft = () => {
    if (!name) {
        showAlert({ title: 'Erro', message: 'Defina um nome para a campanha.', type: 'warning' });
        return;
    }
    onSave({
        name,
        type: type as any,
        messageTemplate: message,
        selectedClientIds,
        channel,
        discount: { type: discountType, value: discountValue },
        status: 'draft',
        costInTokens: totalCost,
        scheduledFor: scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : undefined
    });
  };

  const handleSendNow = async () => {
    if (!isValid) {
        showAlert({ title: 'Dados Incompletos', message: 'Preencha o nome, mensagem e selecione destinatários.', type: 'warning' });
        return;
    }

    // CHECK 1: WhatsApp Connection
    if (!isWhatsAppConnected) {
        const connect = await showConfirm({ 
            title: 'WhatsApp Desconectado', 
            message: 'Você precisa conectar seu WhatsApp para disparar campanhas. Deseja ir para as configurações agora?', 
            type: 'warning',
            confirmText: 'Ir para Configurações'
        });
        if (connect) {
            onClose();
            navigate('/settings', { state: { activeTab: 'integrations' } });
        }
        return;
    }

    // CHECK 2: Token Balance
    if (!canAfford) {
        const buy = await showConfirm({ 
            title: 'Saldo Insuficiente', 
            message: `Você precisa de ${totalCost} tokens, mas tem apenas ${subscription.tokenBalance || 0}. Deseja recarregar?`, 
            type: 'danger',
            confirmText: 'Comprar Tokens'
        });
        if (buy) {
            onClose();
            navigate('/settings', { state: { activeTab: 'billing' } });
        }
        return;
    }

    const confirm = await showConfirm({
        title: 'Disparar Campanha',
        message: `Enviar para ${selectedClientIds.length} clientes via WhatsApp? Custo: ${totalCost} tokens.`,
        confirmText: 'Enviar Agora',
        type: 'success'
    });

    if (confirm) {
        onSave({
            name,
            type: type as any,
            messageTemplate: message,
            selectedClientIds,
            channel,
            discount: { type: discountType, value: discountValue },
            status: 'sent',
            costInTokens: totalCost,
            date: new Date().toISOString()
        });
    }
  };

  const insertVariable = (variable: string) => {
      setMessage(prev => prev + ` ${variable}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {mode === 'create' ? 'Nova Campanha' : 'Editar Campanha'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Crie mensagens personalizadas para engajar seus clientes.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {[
                { id: 'message', label: '1. Mensagem', icon: MessageSquare },
                { id: 'recipients', label: '2. Destinatários', icon: Users },
                { id: 'settings', label: '3. Configurações', icon: Settings },
                { id: 'preview', label: '4. Revisão & Envio', icon: Eye },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                        "flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                        activeTab === tab.id 
                            ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    <tab.icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30 dark:bg-slate-950/30">
            
            {/* TAB 1: MESSAGE */}
            {activeTab === 'message' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Templates Sidebar */}
                        <div className="md:col-span-1 space-y-3">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Modelos Prontos</h3>
                            <div className="space-y-2">
                                {CAMPAIGN_TEMPLATES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTemplateSelect(t)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg border text-sm transition-all hover:shadow-md",
                                            type === t.id 
                                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500" 
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                                        )}
                                    >
                                        <span className="font-bold text-slate-900 dark:text-white block mb-1">{t.label}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.defaultMessage}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setType('custom'); setMessage(''); setSmartSegment(undefined); }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg border text-sm transition-all",
                                        type === 'custom' 
                                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500" 
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                                    )}
                                >
                                    <span className="font-bold text-slate-900 dark:text-white block">✨ Personalizado</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Escreva do zero</span>
                                </button>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome da Campanha</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ex: Promoção de Natal"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Mensagem</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium" onClick={() => insertVariable('{cliente}')}>+ Nome</button>
                                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium" onClick={() => insertVariable('{veiculo}')}>+ Veículo</button>
                                        <button className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium" onClick={() => insertVariable('{desconto}')}>+ Desconto</button>
                                        <button className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium" onClick={() => insertVariable('{valor}')}>+ Valor</button>
                                        <button className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium" onClick={() => insertVariable('{horario}')}>+ Horário</button>
                                    </div>
                                </div>
                                <textarea 
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={8}
                                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed"
                                    placeholder="Escreva sua mensagem aqui..."
                                />
                                <div className="flex justify-between mt-2 text-xs text-slate-400">
                                    <span>Variáveis disponíveis: {'{cliente}, {veiculo}, {desconto}, {valor}, {horario}'}</span>
                                    <span>{message.length} caracteres</span>
                                </div>
                            </div>

                            {/* Variables Input - Dynamically shown based on message content */}
                            {(message.includes('{desconto}') || message.includes('{valor}') || message.includes('{horario}')) && (
                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">Preencher Variáveis</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {message.includes('{desconto}') && (
                                            <div>
                                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Desconto (%)</label>
                                                <input 
                                                    type="number" 
                                                    value={discountValue} 
                                                    onChange={e => setDiscountValue(Number(e.target.value))} 
                                                    className="w-full px-3 py-2 rounded border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm" 
                                                    placeholder="Ex: 10"
                                                />
                                            </div>
                                        )}
                                        {message.includes('{valor}') && (
                                            <div>
                                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Valor (R$)</label>
                                                <input 
                                                    type="number" 
                                                    value={customVars.valor} 
                                                    onChange={e => setCustomVars({...customVars, valor: e.target.value})} 
                                                    className="w-full px-3 py-2 rounded border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm" 
                                                    placeholder="Ex: 150.00"
                                                />
                                            </div>
                                        )}
                                        {message.includes('{horario}') && (
                                            <div>
                                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Horário</label>
                                                <input 
                                                    type="time" 
                                                    value={scheduleTime} 
                                                    onChange={e => setScheduleTime(e.target.value)} 
                                                    className="w-full px-3 py-2 rounded border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: RECIPIENTS */}
            {activeTab === 'recipients' && (
                <div className="flex-1 overflow-hidden p-4">
                    <RecipientSelector 
                        clients={clients} 
                        selectedIds={selectedClientIds} 
                        onSelectionChange={setSelectedClientIds}
                        preSelectedSegment={smartSegment}
                    />
                </div>
            )}

            {/* TAB 3: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Smartphone size={20} className="text-blue-600" /> Canal de Envio
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                type="button"
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                    "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 cursor-default"
                                )}
                            >
                                <MessageSquare size={24} />
                                <span className="font-bold text-sm">WhatsApp</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">1 token/msg</span>
                            </button>
                        </div>
                        
                        <div className={cn(
                            "mt-4 p-3 rounded-lg flex items-center gap-2 text-xs",
                            isWhatsAppConnected 
                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" 
                                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        )}>
                            {isWhatsAppConnected ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            <span className="font-bold">
                                {isWhatsAppConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado - Conecte nas configurações'}
                            </span>
                            {!isWhatsAppConnected && (
                                <button onClick={() => navigate('/settings', { state: { activeTab: 'integrations' } })} className="ml-auto underline">
                                    Conectar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-purple-600" /> Agendamento
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Data</label>
                                <input 
                                    type="date" 
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Horário</label>
                                <input 
                                    type="time" 
                                    value={scheduleTime}
                                    onChange={e => setScheduleTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                            <Info size={12} /> Deixe em branco para enviar imediatamente.
                        </p>
                    </div>
                </div>
            )}

            {/* TAB 4: PREVIEW */}
            {activeTab === 'preview' && (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Preview Card */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Como o cliente vai ver:</h3>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden max-w-sm mx-auto md:mx-0">
                                <div className="bg-[#075E54] p-4 flex items-center gap-3 text-white">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <img src={companySettings.logoUrl} className="w-8 h-8 rounded-full" alt="Logo" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{companySettings.name}</p>
                                        <p className="text-xs opacity-80">online</p>
                                    </div>
                                </div>
                                <div className="bg-[#E5DDD5] dark:bg-[#0b141a] p-6 min-h-[300px] relative">
                                    <div className="bg-white dark:bg-[#1f2c34] p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%] text-sm text-slate-900 dark:text-white whitespace-pre-wrap relative">
                                        {previewMessage}
                                        <span className="text-[10px] text-slate-400 absolute bottom-1 right-2">10:42</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Resumo da Campanha</h3>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Nome:</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{name}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Destinatários:</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{selectedClientIds.length} clientes</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Canal:</span>
                                        <span className="capitalize text-slate-900 dark:text-white">WhatsApp</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Agendamento:</span>
                                        <span className="text-slate-900 dark:text-white">
                                            {scheduleDate ? `${new Date(scheduleDate).toLocaleDateString()} às ${scheduleTime}` : 'Envio Imediato'}
                                        </span>
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Custo Total:</span>
                                    <span className={cn("text-xl font-bold", canAfford ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                                        {totalCost} Tokens
                                    </span>
                                </div>
                                {!canAfford && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
                                        <AlertTriangle size={14} /> Saldo insuficiente ({subscription.tokenBalance} disponíveis).
                                    </div>
                                )}
                                {!isWhatsAppConnected && (
                                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs rounded-lg flex items-center gap-2">
                                        <LinkIcon size={14} /> WhatsApp desconectado.
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleSendNow}
                                    disabled={!isValid}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Send size={20} /> 
                                    {scheduleDate ? 'Agendar Envio' : 'Enviar Agora'}
                                </button>
                                <button 
                                    onClick={handleSaveDraft}
                                    className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Salvar Rascunho
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between">
            <button 
                onClick={() => {
                    if (activeTab === 'recipients') setActiveTab('message');
                    if (activeTab === 'settings') setActiveTab('recipients');
                    if (activeTab === 'preview') setActiveTab('settings');
                }}
                disabled={activeTab === 'message'}
                className="px-6 py-2 text-slate-500 dark:text-slate-400 font-bold disabled:opacity-50"
            >
                Voltar
            </button>
            <button 
                onClick={() => {
                    if (activeTab === 'message') setActiveTab('recipients');
                    if (activeTab === 'recipients') setActiveTab('settings');
                    if (activeTab === 'settings') setActiveTab('preview');
                }}
                disabled={activeTab === 'preview'}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-0 disabled:pointer-events-none transition-all flex items-center gap-2"
            >
                Próximo <ChevronRight size={16} />
            </button>
        </div>
      </div>
    </div>
  );
}
