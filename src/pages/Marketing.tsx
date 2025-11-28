import React, { useState } from 'react';
import { 
  Megaphone, Users, MessageCircle, Send, 
  TrendingUp, AlertTriangle, Star, CheckCircle2,
  CalendarClock, Wrench, BarChart3, ArrowRight,
  Instagram, Wand2, Image as ImageIcon, Share2, Copy,
  Smartphone, Video, BellRing, Loader2, Plus, X, Download, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { ClientSegment, MarketingCampaign, WorkOrder } from '../types';
import { cn, formatCurrency } from '../lib/utils';

export default function Marketing() {
  const { clients, campaigns, createCampaign, getWhatsappLink, workOrders, reminders } = useApp();
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
  const [newCampaign, setNewCampaign] = useState({ 
    name: '',
    target: 'inactive' as ClientSegment | 'all', 
    message: '' 
  });
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Segmentação de Clientes
  const segments = {
    vip: clients.filter(c => c.segment === 'vip'),
    recurring: clients.filter(c => c.segment === 'recurring'),
    inactive: clients.filter(c => c.segment === 'inactive'),
    new: clients.filter(c => c.segment === 'new')
  };

  // Lembretes de Retorno
  const returnReminders = reminders.filter(r => r.status === 'pending' || r.status === 'overdue');

  // --- ACTIONS ---

  const handleSendCampaign = () => {
    if (!newCampaign.message || !newCampaign.name) return;
    
    setSendingCampaign(true);
    
    // Simula envio
    setTimeout(() => {
      const targetCount = newCampaign.target === 'all' ? clients.length : segments[newCampaign.target].length;
      
      const campaign: MarketingCampaign = {
        id: `cmp-${Date.now()}`,
        name: newCampaign.name,
        targetSegment: newCampaign.target,
        messageTemplate: newCampaign.message,
        sentCount: targetCount,
        conversionCount: 0,
        revenueGenerated: 0,
        date: new Date().toISOString(),
        status: 'sent'
      };

      createCampaign(campaign);
      setSendingCampaign(false);
      setIsCampaignModalOpen(false);
      setNewCampaign({ name: '', target: 'inactive', message: '' });
    }, 2000);
  };

  const handleGenerateSocial = () => {
    const os = workOrders.find(o => o.id === selectedOSId);
    if (!os) return;

    setIsGenerating(true);

    // Simula IA Generativa
    setTimeout(() => {
      const service = os.service;
      const vehicle = os.vehicle;
      
      const captions = [
        `✨ Transformação incrível neste ${vehicle}! Realizamos o serviço de ${service} e o resultado fala por si só. Proteção, brilho e detalhamento técnico de alto nível. Agende o seu! 🚗💎`,
        `🔥 Olha o brilho desse ${vehicle} após passar pela nossa ${service}. Cuidamos de cada detalhe para garantir o aspecto de zero km. O que acharam? 👇`,
        `🛡️ Proteção e estética automotiva: ${service} finalizado com sucesso no ${vehicle}. Seu carro merece esse cuidado especial. Fale com a gente! 📲`
      ];

      setGeneratedContent({
        caption: captions[Math.floor(Math.random() * captions.length)],
        hashtags: ['#esteticaautomotiva', '#detailing', `#${vehicle.replace(/\s/g, '').toLowerCase()}`, '#carcare', '#brilho', '#protecaoveicular'],
        cta: 'Clique no link da bio para agendar sua avaliação gratuita!'
      });
      setIsGenerating(false);
    }, 1500);
  };

  const getSelectedOSPhotos = () => {
    const os = workOrders.find(o => o.id === selectedOSId);
    if (!os) return { before: null, after: null };

    const before = os.damages.find(d => d.photoUrl && d.photoUrl !== 'pending')?.photoUrl || 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=300&q=80';
    const after = os.dailyLog.flatMap(l => l.photos)[0] || 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=300&q=80'; // Fallback

    return { before, after };
  };

  const selectedPhotos = getSelectedOSPhotos();

  // --- SOCIAL ACTIONS ---
  const copyCaption = () => {
      if (generatedContent) {
          const text = `${generatedContent.caption}\n\n${generatedContent.hashtags.join(' ')}`;
          navigator.clipboard.writeText(text);
          alert('Legenda copiada! Agora cole no Instagram.');
      }
  };

  const downloadImage = (url: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleMobileShare = async () => {
      if (navigator.share && generatedContent) {
          try {
              await navigator.share({
                  title: 'Post Crystal Care',
                  text: `${generatedContent.caption}\n\n${generatedContent.hashtags.join(' ')}`,
                  url: selectedPhotos.after || ''
              });
          } catch (err) {
              console.log('Erro ao compartilhar', err);
          }
      } else {
          alert('Compartilhamento nativo não suportado neste navegador. Use os botões de download.');
      }
  };

  // Dados para Gráficos
  const campaignPerformanceData = campaigns.map(c => ({
    name: c.name,
    enviados: c.sentCount,
    convertidos: c.conversionCount || 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing & CRM</h2>
          <p className="text-slate-500 dark:text-slate-400">Automação de mensagens, fidelização e redes sociais.</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
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
                "px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB: DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/20 rounded-lg"><Star size={24} className="text-yellow-300" /></div>
                    <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">LTV Alto</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">{segments.vip.length}</h3>
                <p className="text-purple-100 text-sm font-medium">Clientes VIP</p>
             </div>

             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><AlertTriangle size={24} className="text-red-500" /></div>
                    <span className="bg-red-100 text-red-600 dark:bg-red-900/30 px-2 py-1 rounded text-xs font-bold">Atenção</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{segments.inactive.length}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Inativos (+60 dias)</p>
             </div>

             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"><TrendingUp size={24} className="text-green-500" /></div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{formatCurrency(campaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0))}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Receita de Campanhas</p>
             </div>

             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><MessageCircle size={24} className="text-blue-500" /></div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{campaigns.reduce((acc, c) => acc + c.sentCount, 0)}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mensagens Enviadas</p>
             </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6">Performance de Campanhas</h3>
                <div className="h-[300px] w-full">
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

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6">Distribuição da Base</h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'VIP', value: segments.vip.length, color: '#8b5cf6' },
                                    { name: 'Recorrente', value: segments.recurring.length, color: '#3b82f6' },
                                    { name: 'Novos', value: segments.new.length, color: '#10b981' },
                                    { name: 'Inativos', value: segments.inactive.length, color: '#ef4444' },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {[
                                    { color: '#8b5cf6' }, { color: '#3b82f6' }, { color: '#10b981' }, { color: '#ef4444' }
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> VIP</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Recorrente</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Novos</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Inativos</span>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CAMPAIGNS --- */}
      {activeTab === 'campaigns' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-right">
             <div className="flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-900 dark:text-white">Histórico de Campanhas</h3>
                 <button 
                    onClick={() => setIsCampaignModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
                 >
                    <Plus size={18} /> Nova Campanha
                 </button>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Campanha</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Público</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Enviados</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Receita Gerada</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {campaigns.map(campaign => (
                            <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{campaign.name}</td>
                                <td className="px-6 py-4">
                                    <span className="capitalize px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                                        {campaign.targetSegment === 'all' ? 'Todos' : campaign.targetSegment}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{campaign.sentCount}</td>
                                <td className="px-6 py-4 font-medium text-green-600 dark:text-green-400">{formatCurrency(campaign.revenueGenerated || 0)}</td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(campaign.date).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold">
                                        Enviado
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhuma campanha realizada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>

             {/* Modal Nova Campanha */}
             {isCampaignModalOpen && (
                 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                     <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="font-bold text-lg text-slate-900 dark:text-white">Nova Campanha</h3>
                             <button onClick={() => setIsCampaignModalOpen(false)}><X className="text-slate-400" /></button>
                         </div>

                         <div className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome da Campanha</label>
                                 <input 
                                    type="text" 
                                    value={newCampaign.name}
                                    onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                                    placeholder="Ex: Promoção Chuva Ácida"
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Público Alvo</label>
                                 <select 
                                    value={newCampaign.target}
                                    onChange={e => setNewCampaign({...newCampaign, target: e.target.value as any})}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                 >
                                     <option value="inactive">Inativos ({segments.inactive.length})</option>
                                     <option value="vip">VIPs ({segments.vip.length})</option>
                                     <option value="recurring">Recorrentes ({segments.recurring.length})</option>
                                     <option value="new">Novos ({segments.new.length})</option>
                                     <option value="all">Todos ({clients.length})</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mensagem (WhatsApp)</label>
                                 <textarea 
                                    value={newCampaign.message}
                                    onChange={e => setNewCampaign({...newCampaign, message: e.target.value})}
                                    rows={4}
                                    placeholder="Olá {cliente}, temos uma oferta especial..."
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none"
                                 />
                                 <p className="text-xs text-slate-400 mt-1">Variáveis: {'{cliente}'}</p>
                             </div>

                             <button 
                                onClick={handleSendCampaign}
                                disabled={sendingCampaign}
                                className="w-full py-3 bg-blue-600 disabled:bg-blue-800 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                             >
                                {sendingCampaign ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                Disparar Campanha
                             </button>
                         </div>
                     </div>
                 </div>
             )}
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
                                         #{os.id} - {os.vehicle} ({os.service})
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

                 {/* Generated Content */}
                 {generatedContent && (
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-bottom">
                         <h4 className="font-bold text-slate-900 dark:text-white mb-3">Legenda Sugerida</h4>
                         <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 mb-4 whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                             {generatedContent.caption}
                             <br/><br/>
                             <span className="text-blue-600 dark:text-blue-400">{generatedContent.hashtags.join(' ')}</span>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3">
                             <button 
                                onClick={copyCaption}
                                className="flex items-center justify-center gap-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                             >
                                 <Copy size={14} /> Copiar Legenda
                             </button>
                             <button 
                                onClick={handleMobileShare}
                                className="flex items-center justify-center gap-2 text-xs font-bold bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                             >
                                 <Share2 size={14} /> Compartilhar
                             </button>
                         </div>
                         
                         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Baixar Imagens (Para Carrossel)</p>
                             <div className="flex gap-3">
                                 <button 
                                    onClick={() => selectedPhotos.after && downloadImage(selectedPhotos.after, 'depois.jpg')}
                                    disabled={!selectedPhotos.after}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                 >
                                     <Download size={14} /> Foto Depois
                                 </button>
                                 <button 
                                    onClick={() => selectedPhotos.before && downloadImage(selectedPhotos.before, 'antes.jpg')}
                                    disabled={!selectedPhotos.before}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                 >
                                     <Download size={14} /> Foto Antes
                                 </button>
                             </div>
                         </div>
                     </div>
                 )}
             </div>

             {/* Right: Preview */}
             <div className="lg:col-span-7 flex justify-center bg-slate-100 dark:bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
                 <div className={cn(
                     "bg-white dark:bg-black shadow-2xl overflow-hidden flex flex-col transition-all duration-500 relative",
                     contentType === 'story' || contentType === 'reel' 
                        ? "w-[300px] h-[533px] rounded-3xl" // 9:16 Aspect Ratio
                        : "w-[350px] h-auto rounded-xl" // Feed
                 )}>
                     {/* Instagram Header */}
                     <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                         <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                                 <div className="w-full h-full rounded-full bg-white dark:bg-black border-2 border-transparent" />
                             </div>
                             <span className="text-xs font-bold text-slate-900 dark:text-white">cristal.care</span>
                         </div>
                         <div className="text-slate-900 dark:text-white"><Share2 size={16} /></div>
                     </div>

                     {/* Content Area */}
                     <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative group cursor-pointer">
                         {selectedPhotos.after ? (
                             <img src={selectedPhotos.after} alt="Post" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                 <ImageIcon size={32} className="mb-2" />
                                 <span className="text-xs">Selecione uma OS</span>
                             </div>
                         )}
                         
                         {/* Before Photo Overlay (Hover) - EXPLAINER */}
                         {selectedPhotos.before && (
                             <div className="absolute top-2 right-2 w-1/3 aspect-square rounded-lg border-2 border-white shadow-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                 <img src={selectedPhotos.before} alt="Before" className="w-full h-full object-cover" />
                                 <span className="absolute bottom-0 left-0 w-full bg-black/50 text-white text-[8px] font-bold text-center py-0.5">ANTES</span>
                             </div>
                         )}

                         {/* Hover Hint */}
                         {selectedPhotos.after && (
                             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                 Pré-visualização Interna
                             </div>
                         )}
                     </div>
                     
                     {/* Carousel Indicator Simulation */}
                     <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Layers size={16} className="text-white drop-shadow-md" />
                     </div>

                     {/* Footer (Feed Only) */}
                     {contentType === 'feed' && (
                         <div className="p-3">
                             <div className="flex gap-3 mb-2 text-slate-900 dark:text-white">
                                 <div className="font-bold text-lg">♡</div>
                                 <div className="font-bold text-lg">💬</div>
                                 <div className="font-bold text-lg">➢</div>
                             </div>
                             <p className="text-xs text-slate-900 dark:text-white">
                                 <span className="font-bold mr-1">cristal.care</span>
                                 {generatedContent ? generatedContent.caption.substring(0, 80) + '...' : 'Legenda aparecerá aqui...'}
                             </p>
                         </div>
                     )}

                     {/* Story Overlay */}
                     {(contentType === 'story' || contentType === 'reel') && (
                         <div className="absolute bottom-8 left-0 w-full px-4 text-center">
                             <div className="bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 rounded-lg mb-2">
                                 {generatedContent?.cta || 'Link na Bio'}
                             </div>
                         </div>
                     )}
                 </div>
             </div>
         </div>
      )}

      {/* --- TAB: AUTOMATION --- */}
      {activeTab === 'automation' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom">
            
            {/* Seção de Alertas de Retorno */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                        <BellRing size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas de Retorno (Recall)</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Clientes que precisam refazer serviços baseados na recorrência configurada.</p>
                    </div>
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {returnReminders.length} Pendentes
                    </span>
                </div>

                <div className="space-y-3">
                    {returnReminders.length > 0 ? returnReminders.map(reminder => {
                        const client = clients.find(c => c.id === reminder.clientId);
                        const vehicle = client?.vehicles.find(v => v.id === reminder.vehicleId);
                        const isOverdue = new Date(reminder.dueDate) < new Date();

                        return (
                            <div key={reminder.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-2 h-12 rounded-full", isOverdue ? "bg-red-500" : "bg-blue-500")} />
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{client?.name} • {vehicle?.model}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{reminder.serviceType}</p>
                                        <p className={cn("text-xs font-bold mt-1", isOverdue ? "text-red-500" : "text-blue-500")}>
                                            {isOverdue ? `Venceu em ${new Date(reminder.dueDate).toLocaleDateString()}` : `Vence em ${new Date(reminder.dueDate).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                <a 
                                    href={getWhatsappLink(client?.phone || '', `Olá ${client?.name}! O sistema da Crystal Care indicou que já está na hora de renovar o serviço de ${reminder.serviceType} do seu ${vehicle?.model}. Vamos agendar para manter a proteção em dia?`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors text-sm w-full md:w-auto justify-center"
                                >
                                    <MessageCircle size={16} /> Enviar Aviso
                                </a>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8 text-slate-400">
                            <p>Nenhum alerta de retorno pendente hoje.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Configurações Gerais */}
            <h3 className="font-bold text-slate-900 dark:text-white mt-8 mb-4">Configurações de Automação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
                { title: 'Lembrete de Agendamento', desc: 'Envia whats 24h antes do serviço.', active: true, icon: CalendarClock },
                { title: 'Status do Serviço', desc: 'Avisa quando muda de fase (ex: Polimento).', active: true, icon: Wrench },
                { title: 'Conclusão & Pagamento', desc: 'Envia link de pagamento e aviso de pronto.', active: true, icon: CheckCircle2 },
                { title: 'Pesquisa NPS', desc: 'Solicita nota 24h após a retirada.', active: true, icon: Star },
                { title: 'Recall de Manutenção', desc: 'Avisa conforme intervalo configurado no serviço.', active: true, icon: AlertTriangle },
            ].map((auto, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-lg", auto.active ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                    <auto.icon size={24} />
                    </div>
                    <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{auto.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{auto.desc}</p>
                    </div>
                </div>
                <div className={cn("w-12 h-6 rounded-full p-1 transition-colors cursor-pointer", auto.active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700")}>
                    <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform", auto.active ? "translate-x-6" : "translate-x-0")} />
                </div>
                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
}
