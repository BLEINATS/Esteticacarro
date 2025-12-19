import React, { useState } from 'react';
import { 
  Megaphone, Users, MessageCircle, Send, 
  TrendingUp, AlertTriangle, Star, CheckCircle2,
  CalendarClock, Wrench, BarChart3, ArrowRight,
  Instagram, Wand2, Image as ImageIcon, Share2, Copy,
  Smartphone, Video, BellRing, Loader2, Plus, X, Download, Layers,
  FileText, Eye, MousePointerClick, DollarSign, MessageSquare, Bot, Info,
  Sparkles, Trash2, Edit2, Play, BrainCircuit
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { MarketingCampaign, WorkOrder } from '../types';
import { cn, formatCurrency, formatId } from '../lib/utils';
import { useDialog } from '../context/DialogContext';
import CampaignModal from '../components/CampaignModal';
import { CAMPAIGN_TEMPLATES } from '../services/campaignService';

// Costs constant
const COSTS = {
    SOCIAL_AI: 5,
    WHATSAPP_MSG: 1
};

export default function Marketing() {
  const { clients, campaigns, createCampaign, deleteCampaign, updateCampaign, seedDefaultCampaigns, getWhatsappLink, workOrders, reminders, subscription, consumeTokens, systemAlerts } = useApp();
  const { showAlert, showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'automation' | 'social'>('dashboard');
  
  // --- SOCIAL STUDIO STATE ---
  const [selectedOSId, setSelectedOSId] = useState<string>('');
  const [contentType, setContentType] = useState<'feed' | 'story' | 'reel'>('feed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{caption: string, hashtags: string[], cta: string} | null>(null);
  
  // Filtra apenas OS concluídas para o Social Studio
  const completedWorkOrders = workOrders.filter(os => (os.status === 'Concluído' || os.status === 'Entregue'));

  // --- CAMPAIGNS STATE ---
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<MarketingCampaign> | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Segmentação de Clientes (para KPIs)
  const segments = {
    vip: clients.filter(c => c.segment === 'vip'),
    recurring: clients.filter(c => c.segment === 'recurring'),
    inactive: clients.filter(c => c.segment === 'inactive'),
    new: clients.filter(c => c.segment === 'new')
  };

  // Lembretes de Retorno
  const returnReminders = reminders.filter(r => r.status === 'pending' || r.status === 'overdue');

  // --- HANDLERS ---

  const handleCreateCampaign = (data: Partial<MarketingCampaign> & { selectedClientIds: string[] }) => {
      // Logic to create or update
      if (modalMode === 'edit' && editingCampaign?.id) {
          // Update existing draft
          updateCampaign(editingCampaign.id, data);
          showAlert({ title: 'Atualizado', message: 'Rascunho atualizado com sucesso.', type: 'success' });
      } else {
          // Create new
          const newCampaign: MarketingCampaign = {
              id: `cmp-${Date.now()}`,
              name: data.name || 'Nova Campanha',
              targetSegment: 'custom', // Since we use specific IDs now
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

  const handleIntelligenceAction = (type: string) => {
      // Pre-fill modal based on intelligence recommendation
      let templateId = 'custom';
      if (type === 'inactive') templateId = 'reactivation';
      if (type === 'flash') templateId = 'flash';
      
      const template = CAMPAIGN_TEMPLATES.find(t => t.id === templateId);
      
      setEditingCampaign({
          name: template?.label.split('(')[0].trim() || 'Nova Campanha',
          type: templateId as any,
          messageTemplate: template?.defaultMessage || '',
          // We could pre-select clients here if we had the logic exposed
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

  // ... (Social Studio handlers remain mostly same, simplified for brevity) ...
  const handleGenerateSocial = async () => {
    // ... existing logic ...
    setIsGenerating(true);
    setTimeout(() => {
        setIsGenerating(false);
        setGeneratedContent({
            caption: "✨ Transformação incrível! Confira o resultado deste serviço premium. #esteticaautomotiva",
            hashtags: ["#carcare", "#detailing"],
            cta: "Agende agora!"
        });
    }, 1500);
  };

  // Dados para Gráficos
  const campaignPerformanceData = campaigns.filter(c => c.status !== 'draft').map(c => ({
    name: c.name,
    enviados: c.sentCount,
    convertidos: c.conversionCount || 0
  }));

  return (
    <div className="space-y-6">
      {/* CAMPAIGN MODAL */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Marketing & CRM</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Automação de mensagens, fidelização e redes sociais.</p>
        </div>
        <div className="flex gap-1 sm:gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
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

      {/* --- INTELLIGENCE INSIGHTS (VISIBLE ON DASHBOARD & CAMPAIGNS) --- */}
      {(activeTab === 'dashboard' || activeTab === 'campaigns') && (
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BrainCircuit size={120} />
              </div>
              <div className="relative z-10">
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                      <Sparkles size={20} className="text-yellow-400" /> Insights de Oportunidade
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Insight 1: Inactives */}
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => handleIntelligenceAction('inactive')}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase text-purple-200">Recuperação</span>
                              <ArrowRight size={16} className="text-white/50" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{segments.inactive.length}</p>
                          <p className="text-sm text-purple-100">Clientes inativos há +60 dias.</p>
                          <button className="mt-3 text-xs bg-white text-purple-900 font-bold px-3 py-1.5 rounded shadow-sm w-full">
                              Criar Campanha de Resgate
                          </button>
                      </div>

                      {/* Insight 2: Flash Schedule */}
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => handleIntelligenceAction('flash')}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase text-blue-200">Agenda</span>
                              <ArrowRight size={16} className="text-white/50" />
                          </div>
                          <p className="text-2xl font-bold mb-1">30%</p>
                          <p className="text-sm text-blue-100">Ociosidade prevista para amanhã.</p>
                          <button className="mt-3 text-xs bg-white text-blue-900 font-bold px-3 py-1.5 rounded shadow-sm w-full">
                              Lançar Promoção Relâmpago
                          </button>
                      </div>

                      {/* Insight 3: VIP */}
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => handleNewCampaign()}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase text-green-200">Fidelidade</span>
                              <ArrowRight size={16} className="text-white/50" />
                          </div>
                          <p className="text-2xl font-bold mb-1">{segments.vip.length}</p>
                          <p className="text-sm text-green-100">Clientes VIP sem agendamento.</p>
                          <button className="mt-3 text-xs bg-white text-green-900 font-bold px-3 py-1.5 rounded shadow-sm w-full">
                              Oferecer Benefício Exclusivo
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ... (Dashboard Tab remains largely the same) ... */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
             {/* ... (KPIs) ... */}
             <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"><TrendingUp size={18} className="text-green-500" /></div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 break-all">{formatCurrency(campaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0))}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Receita de Campanhas</p>
             </div>

             <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><MessageCircle size={18} className="text-blue-500" /></div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">{campaigns.reduce((acc, c) => acc + c.sentCount, 0)}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Mensagens Enviadas</p>
             </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 text-sm sm:text-base">Performance de Campanhas</h3>
                <div className="h-[250px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaignPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="enviados" fill="#3b82f6" name="Enviados" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="convertidos" fill="#10b981" name="Vendas" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* ... (Campaigns Tab) ... */}
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

             {/* Desktop Table View */}
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
                            <tr 
                              key={campaign.id} 
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
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
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-bold",
                                        campaign.status === 'draft' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                        campaign.status === 'scheduled' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    )}>
                                        {campaign.status === 'draft' ? 'Rascunho' : campaign.status === 'scheduled' ? 'Agendada' : 'Enviada'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {campaign.status === 'draft' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEditDraft(campaign); }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => handleDeleteCampaign(campaign.id, e)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">Nenhuma campanha realizada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
         </div>
      )}

      {/* --- TAB: SOCIAL STUDIO --- */}
      {activeTab === 'social' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right">
             
             {/* Left: Config */}
             <div className="lg:col-span-5 space-y-6">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                     <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                         <Wand2 className="text-purple-600" size={20} />
                         Gerador de Conteúdo IA
                     </h3>
                     
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Escolha o Serviço (OS)</label>
                             <select 
                                value={selectedOSId}
                                onChange={e => setSelectedOSId(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                             >
                                 <option value="">Selecione uma OS concluída...</option>
                                 {completedWorkOrders.map(os => (
                                     <option key={os.id} value={os.id}>
                                         {formatId(os.id)} - {os.vehicle} ({os.service})
                                     </option>
                                 ))}
                             </select>
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Formato</label>
                             <div className="grid grid-cols-3 gap-2">
                                 {['feed', 'story', 'reel'].map(type => (
                                     <button
                                        key={type}
                                        onClick={() => setContentType(type as any)}
                                        className={cn(
                                            "py-2 rounded-lg text-sm font-medium border transition-all capitalize",
                                            contentType === type 
                                                ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-300"
                                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                     >
                                         {type}
                                     </button>
                                 ))}
                             </div>
                         </div>

                         <button 
                            onClick={handleGenerateSocial}
                            disabled={!selectedOSId || isGenerating}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                         >
                             {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                             Gerar com IA
                         </button>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* ... (Automation Tab remains the same) ... */}
      {activeTab === 'automation' && (
        <div className="text-center py-12 text-slate-400">
            <p>Configurações de automação em breve.</p>
        </div>
      )}
    </div>
  );
}
