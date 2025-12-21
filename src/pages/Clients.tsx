import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, TrendingUp, Users, AlertCircle, Trash2, Eye, Calendar, MessageCircle, Clock, Star, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import ClientModal from '../components/ClientModal';
import ClientDetailsModal from '../components/ClientDetailsModal';
import { useDialog } from '../context/DialogContext';
import { differenceInDays } from 'date-fns';
import { useLocation } from 'react-router-dom';

export default function Clients() {
  const { clients, deleteClient, getWhatsappLink, subscription, consumeTokens, companySettings } = useApp();
  const { showConfirm, showAlert, showOptions } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'vip' | 'risk' | 'inactive' | 'new'>('all');

  const location = useLocation();
  const isWhatsAppConnected = companySettings.whatsapp.session.status === 'connected';

  // Handle navigation from Global Search
  useEffect(() => {
    if (location.state && (location.state as any).selectedClientId) {
      const clientId = (location.state as any).selectedClientId;
      setSelectedClientId(clientId);
      
      // Optional: Clear state to prevent reopening on refresh, though React Router handles this well usually.
      // window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Filter Logic
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.phone.includes(searchTerm) ||
                          client.vehicles.some(v => v.plate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (activeFilter === 'vip') return client.segment === 'vip';
    if (activeFilter === 'risk') return client.status === 'churn_risk';
    if (activeFilter === 'inactive') return client.status === 'inactive';
    if (activeFilter === 'new') return client.segment === 'new';
    
    return true;
  });

  const activeClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  const handleDelete = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmed = await showConfirm({
        title: 'Excluir Cliente',
        message: `Tem certeza que deseja excluir ${client.name}? O histórico de serviços será mantido, mas o cliente não aparecerá mais na lista ativa.`,
        type: 'danger',
        confirmText: 'Sim, Excluir'
    });

    if (confirmed) {
        deleteClient(client.id);
        await showAlert({
            title: 'Cliente Excluído',
            message: 'O cliente foi removido com sucesso.',
            type: 'success'
        });
    }
  };

  const handleCreateNew = () => {
    setEditingClient(null);
    setIsCreateModalOpen(true);
  };

  const handleQuickAction = async (client: Client, e: React.MouseEvent) => {
      e.stopPropagation();
      
      let message = '';
      let actionType = '';

      if (client.status === 'churn_risk' || client.status === 'inactive') {
          message = `Olá ${client.name}, tudo bem? Sentimos sua falta aqui na Cristal Care! Faz um tempo que não cuidamos do seu carro. Que tal agendar uma visita com uma condição especial de retorno?`;
          actionType = 'Recuperação';
      } else if (client.segment === 'vip') {
          message = `Olá ${client.name}! Como cliente VIP, temos horários exclusivos para você esta semana. Gostaria de agendar uma manutenção?`;
          actionType = 'VIP';
      } else {
          message = `Olá ${client.name}, como está o seu veículo? Estamos à disposição para qualquer serviço que precisar!`;
          actionType = 'Contato';
      }

      let method = 'manual';

      if (isWhatsAppConnected && (subscription.tokenBalance || 0) > 0) {
          method = await showOptions({
              title: `Enviar Mensagem (${actionType})`,
              message: 'Como deseja enviar esta mensagem?',
              options: [
                  { label: '🤖 Robô (1 Token)', value: 'bot', variant: 'primary' },
                  { label: '📱 Manual (WhatsApp Web)', value: 'manual', variant: 'secondary' }
              ]
          }) || 'cancel';
      }

      if (method === 'bot') {
          if (consumeTokens(1, `Msg ${actionType}: ${client.name}`)) {
              await showAlert({ title: 'Enviado', message: 'Mensagem na fila de disparo.', type: 'success' });
          } else {
              await showAlert({ title: 'Erro', message: 'Erro ao processar tokens.', type: 'error' });
          }
      } else if (method === 'manual') {
          const link = getWhatsappLink(client.phone, message);
          window.open(link, '_blank');
      }
  };

  const getDaysSinceLastVisit = (dateStr: string) => {
      if (!dateStr) return 0;
      return differenceInDays(new Date(), new Date(dateStr));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {isCreateModalOpen && (
        <ClientModal 
            client={editingClient} 
            onClose={() => setIsCreateModalOpen(false)} 
        />
      )}
      
      {activeClient && (
        <ClientDetailsModal 
            client={activeClient} 
            onClose={() => setSelectedClientId(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">CRM de Retenção</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie o relacionamento e recupere clientes inativos.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
          <UserPlus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-6">
        <div 
            onClick={() => setActiveFilter('all')}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                activeFilter === 'all' 
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Base Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
        </div>
        
        <div 
            onClick={() => setActiveFilter('vip')}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                activeFilter === 'vip' 
                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-2 ring-purple-500/20" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Star size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">VIPs</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {clients.filter(c => c.segment === 'vip').length}
          </p>
        </div>

        <div 
            onClick={() => setActiveFilter('risk')}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                activeFilter === 'risk' 
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 ring-2 ring-amber-500/20" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Clock size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Em Risco (60d+)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {clients.filter(c => c.status === 'churn_risk').length}
          </p>
        </div>

        <div 
            onClick={() => setActiveFilter('inactive')}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                activeFilter === 'inactive' 
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 ring-2 ring-red-500/20" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Inativos (90d+)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {clients.filter(c => c.status === 'inactive').length}
          </p>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou placa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>
        <button className="px-3 sm:px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center sm:justify-start gap-2 flex-shrink-0">
          <Filter size={16} />
          <span className="hidden sm:inline">Filtros Avançados</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Cliente</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Segmento</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Última Visita</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-center">Frequência</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Total Gasto</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClients.map((client) => {
              const daysSince = getDaysSinceLastVisit(client.lastVisit);
              return (
              <tr 
                key={client.id} 
                onClick={() => setSelectedClientId(client.id)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white truncate">{client.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 w-fit",
                    client.segment === 'vip' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                    client.status === 'churn_risk' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    client.status === 'inactive' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {client.segment === 'vip' && <Star size={12} />}
                    {client.status === 'churn_risk' && <Clock size={12} />}
                    {client.segment === 'vip' ? 'VIP' : client.status === 'churn_risk' ? 'Risco' : client.status === 'inactive' ? 'Inativo' : 'Ativo'}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                        {daysSince === 0 ? 'Hoje' : `Há ${daysSince} dias`}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                  <span className="font-bold text-slate-900 dark:text-white">{client.visitCount}</span>
                  <span className="text-xs text-slate-500 ml-1">visitas</span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 dark:text-white">
                    {formatCurrency(client.ltv || 0)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                        onClick={(e) => handleQuickAction(client, e)}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" 
                        title="Enviar Mensagem"
                    >
                        <MessageCircle size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedClientId(client.id); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                        title="Ver Detalhes"
                    >
                        <Eye size={16} />
                    </button>
                    <button 
                        onClick={(e) => handleDelete(client, e)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const daysSince = getDaysSinceLastVisit(client.lastVisit);
            return (
            <div 
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{client.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Há {daysSince} dias sem vir</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0 whitespace-nowrap flex items-center gap-1",
                  client.segment === 'vip' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                  client.status === 'churn_risk' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                  {client.segment === 'vip' && <Star size={10} />}
                  {client.segment === 'vip' ? 'VIP' : client.status === 'churn_risk' ? 'Risco' : 'Ativo'}
                </span>
              </div>
              
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                 <button 
                    onClick={(e) => handleQuickAction(client, e)}
                    className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg"
                 >
                    <MessageCircle size={14} /> Recuperar
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedClientId(client.id); }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                 >
                    <Eye size={14} /> Ver
                 </button>
              </div>
            </div>
          )})
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            Nenhum cliente encontrado
          </div>
        )}
      </div>
    </div>
  );
}
