import React, { useState } from 'react';
import { 
  Search, Filter, MoreHorizontal, Shield, 
  MessageSquare, Ban, CheckCircle, LogIn,
  CreditCard, ExternalLink
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
    // In a real app, this would generate a temporary admin token for that tenant
    // For this demo, we'll simulate it
    alert(`Simulando login como administrador na loja: ${tenant.name}`);
    // Optionally redirect to the main app dashboard
    // window.location.href = '/';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Lojas (Tenants)</h1>
            <p className="text-slate-500">Gerencie seus clientes e acessos.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
            Nova Loja
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nome, email..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <Filter size={18} /> Filtros
            </button>
        </div>

        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Loja / Responsável</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Plano</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Tokens</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">MRR</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {filteredTenants.map(tenant => {
                    const plan = plans.find(p => p.id === tenant.planId);
                    return (
                        <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                                        {tenant.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{tenant.name}</p>
                                        <p className="text-xs text-slate-500">{tenant.responsibleName} • {tenant.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                    tenant.planId === 'enterprise' ? "bg-purple-100 text-purple-700" :
                                    tenant.planId === 'pro' ? "bg-blue-100 text-blue-700" :
                                    "bg-slate-100 text-slate-700"
                                )}>
                                    {plan?.name || tenant.planId}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit",
                                    tenant.status === 'active' ? "bg-green-100 text-green-700" :
                                    tenant.status === 'suspended' ? "bg-red-100 text-red-700" :
                                    tenant.status === 'trial' ? "bg-blue-100 text-blue-700" :
                                    "bg-slate-100 text-slate-500"
                                )}>
                                    {tenant.status === 'active' && <CheckCircle size={12} />}
                                    {tenant.status === 'suspended' && <Ban size={12} />}
                                    {tenant.status === 'active' ? 'Ativo' : tenant.status === 'suspended' ? 'Suspenso' : tenant.status === 'trial' ? 'Trial' : 'Cancelado'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={16} className="text-slate-400" />
                                    <span className="font-bold text-slate-700">{tenant.tokenBalance}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-green-600">
                                {formatCurrency(tenant.mrr)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => handleAddTokens(tenant)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Adicionar Tokens"
                                    >
                                        <CreditCard size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleLoginAs(tenant)}
                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Acessar Painel (Login As)"
                                    >
                                        <LogIn size={18} />
                                    </button>
                                    {tenant.status === 'active' ? (
                                        <button 
                                            onClick={() => handleStatusChange(tenant, 'suspended')}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Suspender"
                                        >
                                            <Ban size={18} />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleStatusChange(tenant, 'active')}
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
    </div>
  );
}
