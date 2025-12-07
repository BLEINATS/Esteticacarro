import React, { useState } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Check, Edit2, Save, X, MessageSquare } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { useDialog } from '../../context/DialogContext';
import { SaaSPlan } from '../../types';

export default function Plans() {
  const { plans, updatePlan, tokenPackages } = useSuperAdmin();
  const { showAlert } = useDialog();
  
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SaaSPlan>>({});

  const startEdit = (plan: SaaSPlan) => {
    setEditingPlanId(plan.id);
    setEditForm(plan);
  };

  const cancelEdit = () => {
    setEditingPlanId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingPlanId && editForm.price) {
        updatePlan(editingPlanId, editForm);
        setEditingPlanId(null);
        showAlert({ title: 'Sucesso', message: 'Plano atualizado.', type: 'success' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planos & Pacotes</h1>
        <p className="text-slate-500">Configure os preços e limites de tokens.</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
            <div 
                key={plan.id} 
                className={cn(
                    "bg-white rounded-2xl p-6 border-2 shadow-sm relative transition-all",
                    plan.highlight ? "border-indigo-500 shadow-indigo-100" : "border-slate-200",
                    editingPlanId === plan.id ? "ring-2 ring-indigo-500 ring-offset-2" : ""
                )}
            >
                {plan.highlight && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Mais Popular
                    </div>
                )}

                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {editingPlanId === plan.id ? (
                        <div className="flex gap-2">
                            <button onClick={saveEdit} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"><Save size={16} /></button>
                            <button onClick={cancelEdit} className="p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"><X size={16} /></button>
                        </div>
                    ) : (
                        <button onClick={() => startEdit(plan)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Edit2 size={16} />
                        </button>
                    )}
                </div>

                <div className="mb-6">
                    {editingPlanId === plan.id ? (
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-slate-900 mr-1">R$</span>
                            <input 
                                type="number" 
                                value={editForm.price} 
                                onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                className="w-24 p-1 border rounded font-bold text-2xl"
                            />
                            <span className="text-slate-500 ml-1">/mês</span>
                        </div>
                    ) : (
                        <p className="text-3xl font-bold text-slate-900">
                            {formatCurrency(plan.price)} <span className="text-sm font-normal text-slate-500">/mês</span>
                        </p>
                    )}
                </div>

                {/* Limits Section */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <MessageSquare size={16} className="text-green-500" />
                            Tokens Mensais
                        </div>
                        {editingPlanId === plan.id ? (
                            <input 
                                type="number" 
                                value={editForm.includedTokens} 
                                onChange={e => setEditForm({...editForm, includedTokens: parseInt(e.target.value)})}
                                className="w-16 p-1 border rounded text-right text-sm font-bold"
                            />
                        ) : (
                            <span className="font-bold text-slate-900">{plan.includedTokens}</span>
                        )}
                    </div>
                </div>

                <ul className="space-y-3 mb-4">
                    {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
        ))}
      </div>

      {/* Token Packages */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Pacotes de Tokens Avulsos</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700">Nome do Pacote</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Quantidade de Tokens</th>
                        <th className="px-6 py-4 font-semibold text-slate-700">Preço</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {tokenPackages.map(pkg => (
                        <tr key={pkg.id}>
                            <td className="px-6 py-4 font-medium text-slate-900">{pkg.name}</td>
                            <td className="px-6 py-4 font-bold text-indigo-600">{pkg.tokens}</td>
                            <td className="px-6 py-4 text-slate-600">{formatCurrency(pkg.price)}</td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 hover:underline font-medium">Editar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
