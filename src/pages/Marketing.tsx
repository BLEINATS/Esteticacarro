import React, { useState, useMemo } from 'react';
import { 
  Megaphone, Users, MessageCircle, Send, 
  TrendingUp, AlertTriangle, Star, CheckCircle2,
  CalendarClock, Wrench, BarChart3, ArrowRight,
  Instagram, Wand2, Image as ImageIcon, Share2, Copy,
  Smartphone, Video, BellRing, Loader2, Plus, X, Download, Layers,
  FileText, Eye, MousePointerClick, DollarSign, MessageSquare, Bot, Info,
  Sparkles, Trash2, Edit2, Play, BrainCircuit, Calendar, Gift, Heart,
  Filter, ArrowDown, RefreshCw, Check, ThumbsUp, Activity, Zap
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useApp } from '../context/AppContext';
import { MarketingCampaign, WorkOrder, SocialPost, CustomAutomation } from '../types';
import { cn, formatCurrency, formatId } from '../lib/utils';
import { useDialog } from '../context/DialogContext';
import CampaignModal from '../components/CampaignModal';
import { CAMPAIGN_TEMPLATES } from '../services/campaignService';

// Costs constant
const COSTS = {
    SOCIAL_AI: 5,
    WHATSAPP_MSG: 1
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Marketing() {
  const { 
    clients, campaigns, createCampaign, deleteCampaign, updateCampaign, seedDefaultCampaigns, 
    getWhatsappLink, workOrders, reminders, subscription, consumeTokens, systemAlerts,
    socialPosts, createSocialPost, generateSocialContent, companySettings, updateCompanySettings,
    messageLogs
  } = useApp();
  
  const { showAlert, showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'automation' | 'social'>('dashboard');
  
  // --- SOCIAL STUDIO STATE ---
  const [selectedOSId, setSelectedOSId] = useState<string>('');
  const [contentType, setContentType] = useState<'feed' | 'story' | 'reel'>('feed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{caption: string, hashtags: string[]} | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filtra apenas OS concluídas para o Social Studio
  const completedWorkOrders = workOrders.filter(os => (os.status === 'Concluído' || os.status === 'Entregue'));

  // --- CAMPAIGNS STATE ---
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<MarketingCampaign> | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // --- AUTOMATION EDIT STATE ---
  const [editingAutomation, setEditingAutomation] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState('');

  // --- CUSTOM AUTOMATION STATE ---
  const [isCustomAutoModalOpen, setIsCustomAutoModalOpen] = useState(false);
  const [newAutomation, setNewAutomation] = useState<Partial<CustomAutomation>>({
      name: '',
      trigger: 'service_completion',
      delayValue: 1,
      delayUnit: 'days',
      messageTemplate: '',
      active: true
  });

  // Segmentação de Clientes (para KPIs)
  const segments = {
    vip: clients.filter(c => c.segment === 'vip'),
    recurring: clients.filter(c => c.segment === 'recurring'),
    inactive: clients.filter(c => c.segment === 'inactive'),
    new: clients.filter(c => c.segment === 'new')
  };

  // ... (Analytics logic remains the same) ...
  const analytics = useMemo(() => {
    // 1. Campaign Metrics
    const campaignSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const campaignConverted = campaigns.reduce((acc, c) => acc + (c.conversionCount || 0), 0);
    const campaignRevenue = campaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0);
    const campaignCost = campaigns.reduce((acc, c) => acc + (c.costInTokens || 0), 0) * 0.50; 

    // 2. Automation Metrics
    const npsCount = workOrders.filter(os => os.npsScore).length;
    const remindersSent = reminders.filter(r => r.status === 'sent').length;
    const autoSent = remindersSent + npsCount;
    const autoConverted = Math.floor(autoSent * 0.3); 
    const autoRevenue = autoConverted * 150; 
    const autoCost = autoSent * 0.50; 

    // 3. Totals
    const totalSent = campaignSent + autoSent;
    const totalDelivered = Math.floor(totalSent * 0.98); 
    const totalRead = Math.floor(totalDelivered * 0.85); 
    const totalEngaged = Math.floor(totalRead * 0.40); 
    const totalConverted = campaignConverted + autoConverted;
    const totalRevenue = campaignRevenue + autoRevenue;
    const totalCost = campaignCost + autoCost;

    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    return { totalSent, totalDelivered, totalRead, totalEngaged, totalConverted, totalRevenue, totalCost, roi };
  }, [campaigns, workOrders, reminders]);

  // ... (Existing handlers: handleCreateCampaign, handleEditDraft, etc.) ...
  const handleCreateCampaign = (data: Partial<MarketingCampaign> & { selectedClientIds: string[] }) => {
      if (modalMode === 'edit' && editingCampaign?.id) {
          updateCampaign(editingCampaign.id, data);
          showAlert({ title: 'Atualizado', message: 'Rascunho atualizado com sucesso.', type: 'success' });
      } else {
          const newCampaign: MarketingCampaign = {
              id: `cmp-${Date.now()}`,
              name: data.name || 'Nova Campanha',
              targetSegment: 'custom',
              selectedClientIds: data.selectedClientIds,
              messageTemplate: data.messageTemplate || '',
              sentCount: data.status === 'sent' ? data.selectedClientIds.length : 0,
              conversionCount: 0,
              revenueGenerated: 0,
              date: new Date().toISOString(),
              status: data.status || 'draft',
              costInTokens: data.costInTokens,
              type: data.type,
              channel: data.channel,
              discount: data.discount
          };
          createCampaign(newCampaign);
          
          if (data.status === 'sent') {
              consumeTokens(data.costInTokens || 0, `Campanha: ${data.name}`);
              showAlert({ title: 'Enviado', message: 'Campanha disparada com sucesso!', type: 'success' });
          } else {
              showAlert({ title: 'Salvo', message: 'Rascunho salvo com sucesso.', type: 'success' });
          }
      }
      setIsCampaignModalOpen(false);
  };

  const handleEditDraft = (campaign: MarketingCampaign) => {
      setEditingCampaign(campaign);
      setModalMode('edit');
      setIsCampaignModalOpen(true);
  };

  const handleNewCampaign = () => {
      setEditingCampaign(null);
      setModalMode('create');
      setIsCampaignModalOpen(true);
  };

  const handleDuplicateCampaign = (campaign: MarketingCampaign, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingCampaign({
          ...campaign,
          name: `${campaign.name} (Cópia)`,
          status: 'draft',
          sentCount: 0,
          conversionCount: 0,
          revenueGenerated: 0,
          costInTokens: 0,
          date: undefined,
          scheduledFor: undefined,
          id: undefined // Clear ID to create new
      });
      setModalMode('create');
      setIsCampaignModalOpen(true);
  };

  const handleIntelligenceAction = (type: string) => {
      let templateId = 'custom';
      if (type === 'inactive') templateId = 'reactivation';
      if (type === 'flash') templateId = 'flash';
      
      const template = CAMPAIGN_TEMPLATES.find(t => t.id === templateId);
      
      setEditingCampaign({
          name: template?.label.split('(')[0].trim() || 'Nova Campanha',
          type: templateId as any,
          messageTemplate: template?.defaultMessage || '',
          targetSegment: template?.suggestedSegment || 'all'
      });
      setModalMode('create');
      setIsCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const confirm = await showConfirm({
          title: 'Excluir Campanha',
          message: 'Deseja excluir esta campanha do histórico?',
          type: 'danger',
          confirmText: 'Sim, Excluir'
      });
      if (confirm) {
          deleteCampaign(id);
      }
  };

  // Automation Handlers
  const toggleAutomation = (key: keyof typeof companySettings.automations) => {
      const current = companySettings.automations?.[key] ?? false;
      updateCompanySettings({
          automations: {
              ...companySettings.automations,
              [key]: !current
          }
      });
  };

  const openEditTemplate = (key: string, templateKey: keyof typeof companySettings.whatsapp.templates) => {
      setEditingAutomation(key);
      setTemplateText(companySettings.whatsapp.templates[templateKey] || '');
  };

  const handleSaveTemplate = () => {
      if (!editingAutomation) return;
      
      let templateKey = '';
      if (editingAutomation === 'nps') templateKey = 'nps';
      else if (editingAutomation === 'birthday') templateKey = 'birthday';
      else if (editingAutomation === 'churnRecovery') templateKey = 'recall';
      else if (editingAutomation === 'appointmentReminders') templateKey = 'appointmentReminder';
      else if (editingAutomation === 'reviewRequest') templateKey = 'reviewRequest';

      if (templateKey) {
          updateCompanySettings({
              whatsapp: {
                  ...companySettings.whatsapp,
                  templates: {
                      ...companySettings.whatsapp.templates,
                      [templateKey]: templateText
                  }
              }
          });
          showAlert({ title: 'Salvo', message: 'Mensagem automática atualizada.', type: 'success' });
      }
      setEditingAutomation(null);
  };

  // Custom Automation Handlers
  const handleSaveCustomAutomation = () => {
      if (!newAutomation.name || !newAutomation.messageTemplate) return;
      
      const automation: CustomAutomation = {
          id: `auto-${Date.now()}`,
          name: newAutomation.name || 'Nova Regra',
          trigger: newAutomation.trigger || 'service_completion',
          delayValue: newAutomation.delayValue || 1,
          delayUnit: newAutomation.delayUnit || 'days',
          messageTemplate: newAutomation.messageTemplate || '',
          active: true
      };

      const updatedCustom = [...(companySettings.customAutomations || []), automation];
      updateCompanySettings({ customAutomations: updatedCustom });
      
      setIsCustomAutoModalOpen(false);
      setNewAutomation({
          name: '',
          trigger: 'service_completion',
          delayValue: 1,
          delayUnit: 'days',
          messageTemplate: '',
          active: true
      });
      showAlert({ title: 'Sucesso', message: 'Nova automação criada.', type: 'success' });
  };

  const deleteCustomAutomation = (id: string) => {
      const updatedCustom = (companySettings.customAutomations || []).filter(a => a.id !== id);
      updateCompanySettings({ customAutomations: updatedCustom });
  };

  // ... (Social Studio Handlers remain same) ...
  const handleGenerateSocial = async () => {
    if (!selectedOSId) return;
    const os = workOrders.find(o => o.id === selectedOSId);
    if (!os) return;
    if ((subscription.tokenBalance || 0) < COSTS.SOCIAL_AI) {
        showAlert({ title: 'Saldo Insuficiente', message: `Necessário ${COSTS.SOCIAL_AI} tokens.`, type: 'warning' });
        return;
    }
    setIsGenerating(true);
    try {
        const content = await generateSocialContent(os);
        consumeTokens(COSTS.SOCIAL_AI, `Social AI: ${os.vehicle}`);
        setGeneratedContent(content);
        const photo = os.dailyLog.flatMap(l => l.photos)[0] || os.damages.find(d => d.photoUrl && d.photoUrl !== 'pending')?.photoUrl;
        setSelectedImage(photo || null);
    } catch (e) {
        showAlert({ title: 'Erro', message: 'Falha ao gerar conteúdo.', type: 'error' });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSavePost = () => {
      if (!generatedContent) return;
      const newPost: SocialPost = {
          id: `post-${Date.now()}`,
          workOrderId: selectedOSId,
          image: selectedImage || '',
          caption: generatedContent.caption,
          hashtags: generatedContent.hashtags,
          platform: 'instagram',
          status: 'draft',
          createdAt: new Date().toISOString()
      };
      createSocialPost(newPost);
      setGeneratedContent(null);
      setSelectedOSId('');
      showAlert({ title: 'Salvo', message: 'Post salvo em rascunhos.', type: 'success' });
  };

  const handleSeedData = async () => {
      await seedDefaultCampaigns();
      await showAlert({ title: 'Dados Gerados', message: 'Campanhas de exemplo criadas com sucesso!', type: 'success' });
  };

  const campaignRevenueData = campaigns.filter(c => c.status !== 'draft').map(c => ({ name: c.name, value: c.revenueGenerated || 0 })).filter(d => d.value > 0);
  const campaignConversionData = campaigns.filter(c => c.status !== 'draft').map(c => ({ name: c.name, value: c.conversionCount || 0 })).filter(d => d.value > 0);
  const displayData = campaignRevenueData.length > 0 ? campaignRevenueData : campaignConversionData;
  const isRevenue = campaignRevenueData.length > 0;
  const npsScoreAvg = workOrders.filter(os => os.npsScore).reduce((acc, os) => acc + (os.npsScore || 0), 0) / (workOrders.filter(os => os.npsScore).length || 1);
  const churnCount = clients.filter(c => c.status === 'churn_risk').length;

  // Bot Status Logic
  const isBotConnected = companySettings.whatsapp.session.status === 'connected';
  const recentBotLogs = messageLogs.filter(l => l.channel === 'whatsapp_bot').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* ... (Existing Modals) ... */}
      {isCampaignModalOpen && (
        <CampaignModal 
            isOpen={isCampaignModalOpen}
            onClose={() => setIsCampaignModalOpen(false)}
            onSave={handleCreateCampaign}
            clients={clients}
            initialData={editingCampaign}
            mode={modalMode}
        />
      )}

      {editingAutomation && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Editar Mensagem Automática</h3>
                      <button onClick={() => setEditingAutomation(null)}><X className="text-slate-400" /></button>
                  </div>
                  <div className="space-y-4">
                      <textarea 
                          value={templateText}
                          onChange={(e) => setTemplateText(e.target.value)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                          rows={6}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                          Variáveis: {'{cliente}, {veiculo}, {valor}, {horario}'}
                      </p>
                      <div className="flex gap-3">
                          <button onClick={() => setEditingAutomation(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
                          <button onClick={handleSaveTemplate} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Salvar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CUSTOM AUTOMATION MODAL */}
      {isCustomAutoModalOpen && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Nova Automação</h3>
                      <button onClick={() => setIsCustomAutoModalOpen(false)}><X className="text-slate-400" /></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome da Regra</label>
                          <input 
                              type="text" 
                              value={newAutomation.name}
                              onChange={e => setNewAutomation({...newAutomation, name: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              placeholder="Ex: Lembrete de 7 dias"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Gatilho</label>
                              <select 
                                  value={newAutomation.trigger}
                                  onChange={e => setNewAutomation({...newAutomation, trigger: e.target.value as any})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              >
                                  <option value="service_completion">Após Conclusão</option>
                                  <option value="after_days_inactive">Após Inatividade</option>
                                  <option value="birthday">Aniversário</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Esperar (Delay)</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="number" 
                                      value={newAutomation.delayValue}
                                      onChange={e => setNewAutomation({...newAutomation, delayValue: parseInt(e.target.value)})}
                                      className="w-16 px-2 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                                  />
                                  <select 
                                      value={newAutomation.delayUnit}
                                      onChange={e => setNewAutomation({...newAutomation, delayUnit: e.target.value as any})}
                                      className="flex-1 px-2 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                                  >
                                      <option value="hours">Horas</option>
                                      <option value="days">Dias</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Mensagem</label>
                          <textarea 
                              value={newAutomation.messageTemplate}
                              onChange={e => setNewAutomation({...newAutomation, messageTemplate: e.target.value})}
                              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                              rows={4}
                              placeholder="Olá {cliente}..."
                          />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setIsCustomAutoModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
                          <button onClick={handleSaveCustomAutomation} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Criar Regra</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Marketing & CRM</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Automação de mensagens, fidelização e redes sociais.</p>
        </div>
        <div className="flex gap-1 sm:gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Funil & Dashboard', icon: BarChart3 },
            { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
            { id: 'social', label: 'Social Studio AI', icon: Instagram },
            { id: 'automation', label: 'Automação', icon: Wrench }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md capitalize transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ... (Intelligence Insights - Keeping same) ... */}
      {(activeTab === 'dashboard' || activeTab === 'campaigns') && (
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
              {/* ... (Insights content) ... */}
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BrainCircuit size={120} />
              </div>
              <div className="relative z-10">
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                      <Sparkles size={20} className="text-yellow-400" /> Insights de Oportunidade
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Insight 1 */}
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => handleIntelligenceAction('inactive')}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase text-purple-200">Recuperação</span>
                              <ArrowRight size={16} className="text-white/50" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{segments.inactive.length}</p>
                          <p className="text-sm text-purple-100">Clientes inativos há +60 dias.</p>
                          <button className="mt-3 text-xs bg-white text-purple-900 font-bold px-3 py-1.5 rounded shadow-sm w-full">Criar Campanha de Resgate</button>
                      </div>
                      {/* Insight 2 */}
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => handleIntelligenceAction('flash')}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase text-blue-200">Agenda</span>
                              <ArrowRight size={16} className="text-white/50" />
                          </div>
                          <p className="text-2xl font-bold mb-1">30%</p>
                          <p className="text-sm text-blue-100">Ociosidade prevista para amanhã.</p>
                          <button className="mt-3 text-xs bg-white text-blue-900 font-bold px-3 py-1.5 rounded shadow-sm w-full">Lançar Promoção Relâmpago</button>
                      </div>
                      {/* Insight 3 */}
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => handleNewCampaign()}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase text-green-200">Fidelidade</span>
                              <ArrowRight size={16} className="text-white/50" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{segments.vip.length}</p>
                          <p className="text-sm text-green-100">Clientes VIP sem agendamento.</p>
                          <button className="mt-3 text-xs bg-white text-green-900 font-bold px-3 py-1.5 rounded shadow-sm w-full">Oferecer Benefício Exclusivo</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ... (Dashboard Tab - Keeping same) ... */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left">
             {/* ... (Funnel & Charts content) ... */}
             <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <Filter size={20} className="text-blue-600" /> Funil de Conversão
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Jornada do cliente: Do envio da mensagem até o caixa.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">ROI Estimado</p>
                        <p className={cn("text-xl font-bold", analytics.roi > 0 ? "text-green-600" : "text-slate-600")}>{analytics.roi.toFixed(0)}%</p>
                    </div>
                </div>
                {/* Funnel Visualization */}
                <div className="space-y-4">
                    <div className="relative">
                        <div className="flex justify-between text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-2"><Send size={14} /> Enviados</span>
                            <span>{analytics.totalSent} msgs</span>
                        </div>
                        <div className="h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-full relative overflow-hidden flex items-center px-3">
                            <div className="h-full bg-blue-500 absolute left-0 top-0 opacity-20 w-full"></div>
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 relative z-10">100%</span>
                        </div>
                        <div className="flex justify-center -my-1 relative z-10"><ArrowDown size={14} className="text-slate-300" /></div>
                    </div>
                    <div className="relative">
                        <div className="flex justify-between text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-2"><Eye size={14} /> Visualizados (Est.)</span>
                            <span>{analytics.totalRead} msgs</span>
                        </div>
                        <div className="h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg relative overflow-hidden flex items-center px-3" style={{ width: '85%' }}>
                            <div className="h-full bg-indigo-500 absolute left-0 top-0 opacity-20 w-full"></div>
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 relative z-10">{analytics.totalSent > 0 ? ((analytics.totalRead / analytics.totalSent) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="flex justify-center -my-1 relative z-10 w-[85%]"><ArrowDown size={14} className="text-slate-300" /></div>
                    </div>
                    <div className="relative">
                        <div className="flex justify-between text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-2"><CheckCircle2 size={14} /> Conversões (Agendamentos)</span>
                            <span>{analytics.totalConverted}</span>
                        </div>
                        <div className="h-10 bg-green-100 dark:bg-green-900/20 rounded-lg relative overflow-hidden flex items-center px-3" style={{ width: '40%' }}>
                            <div className="h-full bg-green-500 absolute left-0 top-0 opacity-20 w-full"></div>
                            <span className="text-xs font-bold text-green-700 dark:text-green-300 relative z-10">{analytics.totalSent > 0 ? ((analytics.totalConverted / analytics.totalSent) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <div className="flex justify-center -my-1 relative z-10 w-[40%]"><ArrowDown size={14} className="text-slate-300" /></div>
                    </div>
                    <div className="relative">
                        <div className="flex justify-between text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-2"><DollarSign size={14} /> Receita Gerada</span>
                            <span className="text-green-600 font-bold">{formatCurrency(analytics.totalRevenue)}</span>
                        </div>
                        <div className="h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 relative overflow-hidden flex items-center justify-center" style={{ width: '35%' }}>
                            <div className="h-full bg-emerald-500 absolute left-0 top-0 opacity-10 w-full"></div>
                            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 relative z-10">💰 Sucesso</span>
                        </div>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mt-6">
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 text-sm sm:text-base">Performance de Campanhas ({isRevenue ? 'Receita' : 'Conversões'})</h3>
                    <div className="h-[250px] sm:h-[300px] w-full relative">
                        {displayData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={displayData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationBegin={0} animationDuration={1500}>
                                        {displayData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => isRevenue ? formatCurrency(value) : value} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value, entry: any) => <span className="text-slate-600 dark:text-slate-300 text-xs font-medium ml-1">{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <BarChart3 size={32} className="mb-2 opacity-50" />
                                <p className="text-sm mb-3">Sem dados de performance ainda.</p>
                                <button onClick={handleSeedData} className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                    <RefreshCw size={14} /> Gerar Dados de Demonstração
                                </button>
                            </div>
                        )}
                        {displayData.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{isRevenue ? formatCurrency(displayData.reduce((acc, c) => acc + c.value, 0)) : displayData.reduce((acc, c) => acc + c.value, 0)}</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* ... (Campaigns Tab - Keeping same) ... */}
      {activeTab === 'campaigns' && (
         <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right">
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                 <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Histórico de Campanhas</h3>
                 <div className="flex gap-2">
                    <button 
                        onClick={handleNewCampaign}
                        className="flex items-center gap-2 justify-center sm:justify-start px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Nova</span> Campanha
                    </button>
                 </div>
             </div>
             {/* ... (Table) ... */}
             <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Campanha</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Público</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Enviados</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Receita Gerada</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Data</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Status</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {campaigns.map(campaign => (
                            <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                  {campaign.name}
                                  {campaign.type && <span className="block text-[10px] text-slate-400 capitalize">{campaign.type}</span>}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <span className="capitalize px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                        {campaign.targetSegment === 'custom' ? `${campaign.selectedClientIds?.length || 0} Selecionados` : campaign.targetSegment === 'all' ? 'Todos' : campaign.targetSegment}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">{campaign.sentCount || 0}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-green-600 dark:text-green-400 text-xs sm:text-sm">{campaign.revenueGenerated ? formatCurrency(campaign.revenueGenerated) : 'R$ 0,00'}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{campaign.date ? new Date(campaign.date).toLocaleDateString('pt-BR') : 'S/D'}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <span className={cn("px-2 py-1 rounded-full text-xs font-bold", campaign.status === 'draft' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : campaign.status === 'scheduled' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400")}>
                                        {campaign.status === 'draft' ? 'Rascunho' : campaign.status === 'scheduled' ? 'Agendada' : 'Enviada'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={(e) => handleDuplicateCampaign(campaign, e)} 
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors" 
                                            title="Duplicar / Reutilizar"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        {campaign.status === 'draft' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleEditDraft(campaign); }} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Editar"><Edit2 size={16} /></button>
                                        )}
                                        <button onClick={(e) => handleDeleteCampaign(campaign.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">Nenhuma campanha realizada.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
         </div>
      )}

      {/* ... (Social Studio Tab - Keeping same) ... */}
      {activeTab === 'social' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right">
             {/* ... (Social Studio Content) ... */}
             <div className="lg:col-span-5 space-y-6">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                     <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                         <Wand2 className="text-purple-600" size={20} /> Gerador de Conteúdo IA
                     </h3>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Escolha o Serviço (OS)</label>
                             <select value={selectedOSId} onChange={e => setSelectedOSId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                                 <option value="">Selecione uma OS concluída...</option>
                                 {completedWorkOrders.map(os => (<option key={os.id} value={os.id}>{formatId(os.id)} - {os.vehicle} ({os.service})</option>))}
                             </select>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Formato</label>
                             <div className="grid grid-cols-3 gap-2">
                                 {['feed', 'story', 'reel'].map(type => (
                                     <button key={type} onClick={() => setContentType(type as any)} className={cn("py-2 rounded-lg text-sm font-medium border transition-all capitalize", contentType === type ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-300" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>{type}</button>
                                 ))}
                             </div>
                         </div>
                         <button onClick={handleGenerateSocial} disabled={!selectedOSId || isGenerating} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                             {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} Gerar com IA
                         </button>
                     </div>
                 </div>
                 {/* ... (Recent Generations) ... */}
             </div>
             {/* Right: Preview */}
             <div className="lg:col-span-7 flex justify-center">
                 {generatedContent ? (
                     <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden w-full max-w-sm animate-in zoom-in-95">
                         {/* ... (Preview Content) ... */}
                         <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                                 <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full p-[2px]">
                                     <img src={companySettings.logoUrl} className="w-full h-full rounded-full object-cover" alt="Logo" />
                                 </div>
                             </div>
                             <span className="text-sm font-bold text-slate-900 dark:text-white">{companySettings.name}</span>
                         </div>
                         <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
                             {selectedImage ? <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" /> : <div className="text-slate-400 flex flex-col items-center"><ImageIcon size={48} /><span className="text-xs mt-2">Sem imagem selecionada</span></div>}
                         </div>
                         <div className="p-4">
                             <div className="flex gap-4 mb-3">
                                 <Heart size={24} className="text-slate-900 dark:text-white" /><MessageCircle size={24} className="text-slate-900 dark:text-white" /><Send size={24} className="text-slate-900 dark:text-white" />
                             </div>
                             <p className="text-sm text-slate-900 dark:text-white mb-2"><span className="font-bold mr-2">{companySettings.name}</span>{generatedContent.caption}</p>
                             <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">{generatedContent.hashtags.join(' ')}</p>
                             <div className="flex gap-2">
                                 <button onClick={handleSavePost} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Salvar Post</button>
                                 <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"><Copy size={18} /></button>
                             </div>
                         </div>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl w-full">
                         <Sparkles size={48} className="mb-4 opacity-50" /><p className="text-center">Selecione uma OS e clique em gerar para ver a mágica acontecer.</p>
                     </div>
                 )}
             </div>
         </div>
      )}

      {/* --- TAB: AUTOMATION (UPDATED) --- */}
      {activeTab === 'automation' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right">
            
            {/* BOT STATUS PANEL */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-xl p-6 text-white shadow-lg border border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-700", isBotConnected ? "bg-green-500" : "bg-red-500")}>
                            <Bot size={32} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                Robô de Automação
                                <span className={cn("text-xs px-2 py-0.5 rounded-full uppercase font-bold", isBotConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                    {isBotConnected ? 'Online' : 'Offline'}
                                </span>
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {isBotConnected 
                                    ? `Conectado a ${companySettings.whatsapp.session.device?.name || 'WhatsApp Business'}` 
                                    : 'Conecte seu WhatsApp em Configurações para ativar.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 text-center">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <p className="text-xs text-slate-400 uppercase font-bold">Envios Hoje</p>
                            <p className="text-xl font-bold">{messageLogs.filter(l => l.channel === 'whatsapp_bot' && new Date(l.sentAt).toDateString() === new Date().toDateString()).length}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <p className="text-xs text-slate-400 uppercase font-bold">Última Ação</p>
                            <p className="text-sm font-medium">
                                {recentBotLogs.length > 0 ? new Date(recentBotLogs[0].sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <Zap className="text-yellow-500" size={20} /> Regras Ativas
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">O robô executará estas ações automaticamente.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NPS Automation */}
                    <div className={cn("p-4 rounded-xl border-2 transition-all", companySettings.automations?.nps ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-70")}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600"><Star size={20} /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">Pesquisa NPS</h4><p className="text-xs text-slate-500 dark:text-slate-400">Envia 24h após conclusão.</p></div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={companySettings.automations?.nps ?? false} onChange={() => toggleAutomation('nps')} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex justify-between items-end pt-2 border-t border-blue-200 dark:border-blue-800/30">
                            <div><p className="text-xs text-slate-500">Média Atual</p><p className="text-lg font-bold text-slate-900 dark:text-white">{npsScoreAvg.toFixed(1)}</p></div>
                            <button onClick={() => openEditTemplate('nps', 'nps')} className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-1.5 rounded transition-colors" title="Editar Mensagem"><Edit2 size={16} /></button>
                        </div>
                    </div>

                    {/* Review Request (NEW) */}
                    <div className={cn("p-4 rounded-xl border-2 transition-all", companySettings.automations?.reviewRequest ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-70")}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><ThumbsUp size={20} /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">Avaliação 5 Estrelas</h4><p className="text-xs text-slate-500 dark:text-slate-400">Solicitar review no Google.</p></div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={companySettings.automations?.reviewRequest ?? false} onChange={() => toggleAutomation('reviewRequest')} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-green-200 dark:border-green-800/30">
                            <button onClick={() => openEditTemplate('reviewRequest', 'reviewRequest')} className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 p-1.5 rounded transition-colors" title="Editar Mensagem"><Edit2 size={16} /></button>
                        </div>
                    </div>

                    {/* Birthday Automation */}
                    <div className={cn("p-4 rounded-xl border-2 transition-all", companySettings.automations?.birthday ? "border-pink-500 bg-pink-50 dark:bg-pink-900/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-70")}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600"><Gift size={20} /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">Aniversário</h4><p className="text-xs text-slate-500 dark:text-slate-400">Cupom automático no dia.</p></div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={companySettings.automations?.birthday ?? false} onChange={() => toggleAutomation('birthday')} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                            </label>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-pink-200 dark:border-pink-800/30">
                            <button onClick={() => openEditTemplate('birthday', 'birthday')} className="text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 p-1.5 rounded transition-colors" title="Editar Mensagem"><Edit2 size={16} /></button>
                        </div>
                    </div>

                    {/* Churn Recovery */}
                    <div className={cn("p-4 rounded-xl border-2 transition-all", companySettings.automations?.churnRecovery ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-70")}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600"><Heart size={20} /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">Resgate Inativos</h4><p className="text-xs text-slate-500 dark:text-slate-400">Reativação após 60 dias.</p></div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={companySettings.automations?.churnRecovery ?? false} onChange={() => toggleAutomation('churnRecovery')} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                        <div className="flex justify-between items-end pt-2 border-t border-red-200 dark:border-red-800/30">
                            <div><p className="text-xs text-slate-500">Em Risco</p><p className="text-lg font-bold text-slate-900 dark:text-white">{churnCount} clientes</p></div>
                            <button onClick={() => openEditTemplate('churnRecovery', 'recall')} className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 rounded transition-colors" title="Editar Mensagem"><Edit2 size={16} /></button>
                        </div>
                    </div>

                    {/* Appointment Reminders */}
                    <div className={cn("p-4 rounded-xl border-2 transition-all", companySettings.automations?.appointmentReminders ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-70")}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Calendar size={20} /></div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white">Lembretes</h4><p className="text-xs text-slate-500 dark:text-slate-400">Confirmação 24h antes.</p></div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={companySettings.automations?.appointmentReminders ?? false} onChange={() => toggleAutomation('appointmentReminders')} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-blue-200 dark:border-blue-800/30">
                            <button onClick={() => openEditTemplate('appointmentReminders', 'appointmentReminder')} className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-1.5 rounded transition-colors" title="Editar Mensagem"><Edit2 size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Automations Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="text-purple-600" size={20} /> Automações Personalizadas
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Crie regras específicas para o seu negócio.</p>
                    </div>
                    <button 
                        onClick={() => setIsCustomAutoModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors"
                    >
                        <Plus size={16} /> Nova Regra
                    </button>
                </div>

                <div className="space-y-3">
                    {companySettings.customAutomations && companySettings.customAutomations.length > 0 ? (
                        companySettings.customAutomations.map(auto => (
                            <div key={auto.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{auto.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Gatilho: {auto.trigger === 'service_completion' ? 'Após Serviço' : auto.trigger === 'birthday' ? 'Aniversário' : 'Inatividade'} • 
                                        Espera: {auto.delayValue} {auto.delayUnit === 'days' ? 'dias' : 'horas'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => deleteCustomAutomation(auto.id)}
                                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <p className="text-sm">Nenhuma automação personalizada criada.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
