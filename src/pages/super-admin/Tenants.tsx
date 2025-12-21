import React, { useState } from 'react';
import { 
  Search, Filter, MoreHorizontal, Shield, 
  MessageSquare, Ban, CheckCircle, LogIn,
  CreditCard, ExternalLink, User, Mail
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { formatCurrency, cn } from '../../lib/utils';
import { SaaSTenant } from '../../types';
import { useDialog } from '../../context/DialogContext';

export default function Tenants() {
  const { tenants, updateTenant, addTokensToTenant, plans } = useSuperAdmin();
  const { showConfirm, showAlert } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter
  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (tenant: SaaSTenant, newStatus: SaaSTenant['status']) => {
    const action = newStatus === 'active' ? 'ativar' : newStatus === 'suspended' ? 'suspender' : 'cancelar';
    const confirmed = await showConfirm({
        title: `Confirmar Ação`,
        message: `Deseja realmente ${action} a loja ${tenant.name}?`,
        type: newStatus === 'active' ? 'success' : 'danger',
        confirmText: 'Confirmar'
    });

    if (confirmed) {
        updateTenant(tenant.id, { status: newStatus });
        showAlert({ title: 'Sucesso', message: `Status atualizado para ${newStatus}.`, type: 'success' });
    }
  };

  const handleAddTokens = async (tenant: SaaSTenant) => {
    const confirmed = await showConfirm({
        title: 'Bonificar Tokens',
        message: `Adicionar 100 tokens de cortesia para ${tenant.name}?`,
        type: 'info',
        confirmText: 'Adicionar'
    });

    if (confirmed) {
        addTokensToTenant(tenant.id, 100);
        showAlert({ title: 'Sucesso', message: '100 tokens adicionados.', type: 'success' });
    }
  };

  const handleLoginAs = (tenant: SaaSTenant) => {
    alert(`Simulando login como administrador na loja: ${tenant.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lojas (Tenants)</h1>
            <p className="text-slate-500 dark:text-slate-400">Gerencie seus clientes e acessos.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            Nova Loja
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nome, email..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
            </div>
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
                <Filter size={18} /> Filtros
            </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Loja / Responsável</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Plano</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Tokens</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">MRR</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredTenants.map(tenant => {
                        const plan = plans.find(p => p.id === tenant.planId);
                        return (
                            <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                                            {tenant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{tenant.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{tenant.responsibleName} • {tenant.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                        tenant.planId === 'enterprise' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                                        tenant.planId === 'pro' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    )}>
                                        {plan?.name || tenant.planId}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit",
                                        tenant.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                        tenant.status === 'suspended' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                        tenant.status === 'trial' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                    )}>
                                        {tenant.status === 'active' && <CheckCircle size={12} />}
                                        {tenant.status === 'suspended' && <Ban size={12} />}
                                        {tenant.status === 'active' ? 'Ativo' : tenant.status === 'suspended' ? 'Suspenso' : tenant.status === 'trial' ? 'Trial' : 'Cancelado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={16} className="text-slate-400" />
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{tenant.tokenBalance}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(tenant.mrr)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleAddTokens(tenant)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                            title="Adicionar Tokens"
                                        >
                                            <CreditCard size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleLoginAs(tenant)}
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            title="Acessar Painel (Login As)"
                                        >
                                            <LogIn size={18} />
                                        </button>
                                        {tenant.status === 'active' ? (
                                            <button 
                                                onClick={() => handleStatusChange(tenant, 'suspended')}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Suspender"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleStatusChange(tenant, 'active')}
                                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                title="Reativar"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-4 p-4 bg-slate-50 dark:bg-slate-950">
            {filteredTenants.map(tenant => {
                const plan = plans.find(p => p.id === tenant.planId);
                return (
                    <div key={tenant.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                                    {tenant.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{tenant.name}</p>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 mt-1",
                                        tenant.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                        tenant.status === 'suspended' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                    )}>
                                        {tenant.status === 'active' ? 'Ativo' : tenant.status === 'suspended' ? 'Suspenso' : 'Trial'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(tenant.mrr)}</p>
                                <p className="text-[10px] text-slate-400">/mês</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <User size={14} />
                                <span className="truncate">{tenant.responsibleName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <Shield size={14} />
                                <span className="truncate">{plan?.name || tenant.planId}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <MessageSquare size={14} />
                                <span>{tenant.tokenBalance} Tokens</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <Mail size={14} />
                                <span className="truncate">{tenant.email}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                            <button 
                                onClick={() => handleAddTokens(tenant)}
                                className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                            >
                                <CreditCard size={14} /> Tokens
                            </button>
                            <button 
                                onClick={() => handleLoginAs(tenant)}
                                className="flex-1 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                            >
                                <LogIn size={14} /> Acessar
                            </button>
                            {tenant.status === 'active' ? (
                                <button 
                                    onClick={() => handleStatusChange(tenant, 'suspended')}
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                                >
                                    <Ban size={16} />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleStatusChange(tenant, 'active')}
                                    className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg"
                                >
                                    <CheckCircle size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            {filteredTenants.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    Nenhuma loja encontrada.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
