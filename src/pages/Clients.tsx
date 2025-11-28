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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Base Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">LTV Médio</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(clients.reduce((acc, c) => acc + c.ltv, 0) / (clients.length || 1))}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Risco de Churn</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {clients.filter(c => c.status === 'churn_risk').length}
          </p>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou placa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>
        <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
          <Filter size={18} />
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Cliente</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Veículos</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Total Gasto (LTV)</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Última Visita</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClients.map((client) => (
              <tr 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{client.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{client.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  {client.vehicles.length > 0 
                    ? `${client.vehicles[0].model} ${client.vehicles.length > 1 ? `+${client.vehicles.length - 1}` : ''}`
                    : 'Sem veículo'}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{formatCurrency(client.ltv)}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                  {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold",
                    client.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    client.status === 'churn_risk' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {client.status === 'active' ? 'Ativo' : client.status === 'churn_risk' ? 'Risco' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Ver Detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
