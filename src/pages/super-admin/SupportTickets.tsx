import React, { useState } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { 
  Search, Filter, CheckCircle2, Clock, AlertCircle, 
  MessageSquare, Send, X, User, Building2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SupportTicket } from '../../types';
import { useDialog } from '../../context/DialogContext';

export default function SupportTickets() {
  const { supportTickets, respondToTicket, tenants } = useSuperAdmin();
  const { showAlert } = useDialog();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<SupportTicket['status']>('resolved');

  const filteredTickets = supportTickets.filter(t => {
      const matchesSearch = 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenants.find(ten => ten.id === t.tenantId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleOpenTicket = (ticket: SupportTicket) => {
      setSelectedTicket(ticket);
      setResponseText(ticket.adminResponse || '');
      setNewStatus(ticket.status === 'open' ? 'in_progress' : ticket.status);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTicket || !responseText) return;

      const success = await respondToTicket(selectedTicket.id, responseText, newStatus);
      if (success) {
          showAlert({ title: 'Sucesso', message: 'Resposta enviada e status atualizado.', type: 'success' });
          setSelectedTicket(null);
      } else {
          showAlert({ title: 'Erro', message: 'Falha ao atualizar ticket.', type: 'error' });
      }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'open': return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><AlertCircle size={12} /> Aberto</span>;
          case 'in_progress': return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12} /> Em Análise</span>;
          case 'resolved': return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Resolvido</span>;
          case 'closed': return <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><X size={12} /> Fechado</span>;
          default: return null;
      }
  };

  const getPriorityColor = (priority: string) => {
      switch(priority) {
          case 'critical': return 'text-red-600 font-bold';
          case 'high': return 'text-orange-600 font-bold';
          case 'medium': return 'text-blue-600';
          default: return 'text-slate-500';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Response Modal */}
      {selectedTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-xs uppercase font-bold", getPriorityColor(selectedTicket.priority))}>
                                  {selectedTicket.priority}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs text-slate-500 uppercase font-bold">{selectedTicket.type}</span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                              <User size={14} /> {selectedTicket.userName || 'Usuário'}
                              <span>•</span>
                              <Building2 size={14} /> {tenants.find(t => t.id === selectedTicket.tenantId)?.name || 'Loja Desconhecida'}
                          </div>
                      </div>
                      <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{selectedTicket.message}</p>
                          <p className="text-xs text-slate-400 mt-2 text-right">
                              Enviado em {new Date(selectedTicket.createdAt).toLocaleString()}
                          </p>
                      </div>

                      <form id="response-form" onSubmit={handleSubmitResponse} className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sua Resposta</label>
                              <textarea 
                                  value={responseText}
                                  onChange={e => setResponseText(e.target.value)}
                                  className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[150px]"
                                  placeholder="Escreva a solução ou peça mais detalhes..."
                                  required
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Atualizar Status</label>
                              <div className="flex gap-2">
                                  {['in_progress', 'resolved', 'closed'].map(status => (
                                      <button
                                          key={status}
                                          type="button"
                                          onClick={() => setNewStatus(status as any)}
                                          className={cn(
                                              "px-4 py-2 rounded-lg text-sm font-bold border transition-all capitalize",
                                              newStatus === status 
                                                  ? "bg-indigo-600 text-white border-indigo-600" 
                                                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                          )}
                                      >
                                          {status === 'in_progress' ? 'Em Análise' : status === 'resolved' ? 'Resolvido' : 'Fechado'}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </form>
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-xl flex justify-end gap-3">
                      <button 
                          onClick={() => setSelectedTicket(null)}
                          className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          type="submit"
                          form="response-form"
                          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                          <Send size={18} /> Enviar Resposta
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suporte & Chamados</h1>
        <p className="text-slate-500 dark:text-slate-400">Gerencie solicitações de ajuda das lojas.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por assunto, loja ou usuário..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <select 
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">Todos os Status</option>
                    <option value="open">Abertos</option>
                    <option value="in_progress">Em Análise</option>
                    <option value="resolved">Resolvidos</option>
                    <option value="closed">Fechados</option>
                </select>
                <select 
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">Todas Prioridades</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                </select>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Loja (Tenant)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Assunto</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Prioridade</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredTickets.map(ticket => (
                        <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => handleOpenTicket(ticket)}>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                {tenants.find(t => t.id === ticket.tenantId)?.name || 'Desconhecida'}
                                <span className="block text-xs text-slate-500 font-normal">{ticket.userName}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                {ticket.subject}
                            </td>
                            <td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-400">
                                {ticket.type}
                            </td>
                            <td className="px-6 py-4">
                                <span className={cn("text-xs font-bold uppercase", getPriorityColor(ticket.priority))}>
                                    {ticket.priority}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {getStatusBadge(ticket.status)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                    <MessageSquare size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                Nenhum chamado encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
