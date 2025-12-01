import React, { useState } from 'react';
import { Search, UserPlus, Filter, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import ClientModal from '../components/ClientModal';
import ClientDetailsModal from '../components/ClientDetailsModal';

export default function Clients() {
  const { clients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.vehicles.some(v => v.plate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {isCreateModalOpen && <ClientModal onClose={() => setIsCreateModalOpen(false)} />}
      {selectedClient && <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes & CRM</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão de relacionamento e ciclo de vida.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
          <UserPlus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Users size={18} />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">Base Total</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <TrendingUp size={18} />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">LTV Médio</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(clients.reduce((acc, c) => acc + c.ltv, 0) / (clients.length || 1))}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">Risco de Churn</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {clients.filter(c => c.status === 'churn_risk').length}
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
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Cliente</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Veículos</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Total Gasto</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Última Visita</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300">Status</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClients.map((client) => (
              <tr 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white truncate">{client.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {client.vehicles.length > 0 
                    ? `${client.vehicles[0].model.substring(0, 15)} ${client.vehicles.length > 1 ? `+${client.vehicles.length - 1}` : ''}`
                    : 'Sem veículo'}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(client.ltv)}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                    client.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    client.status === 'churn_risk' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {client.status === 'active' ? 'Ativo' : client.status === 'churn_risk' ? 'Risco' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  <button className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Ver Detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div 
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{client.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{client.phone}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 whitespace-nowrap",
                  client.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  client.status === 'churn_risk' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}>
                  {client.status === 'active' ? 'Ativo' : client.status === 'churn_risk' ? 'Risco' : 'Inativo'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Veículos</p>
                  <p className="font-medium text-slate-900 dark:text-white">{client.vehicles.length > 0 ? client.vehicles[0].model : 'Sem veículo'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Total Gasto</p>
                  <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(client.ltv)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Última Visita</p>
                  <p className="font-medium text-slate-900 dark:text-white">{new Date(client.lastVisit).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Visitas</p>
                  <p className="font-medium text-slate-900 dark:text-white">{client.visitCount}</p>
                </div>
              </div>
              <button className="w-full text-xs text-blue-600 dark:text-blue-400 font-medium py-1 hover:underline">Ver Detalhes</button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            Nenhum cliente encontrado
          </div>
        )}
      </div>
    </div>
  );
}
