import React, { useState } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Check, Edit2, Save, X, MessageSquare, Plus, Trash2, Power, Ban, Package } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { useDialog } from '../../context/DialogContext';
import { SaaSPlan, TokenPackage } from '../../types';

export default function Plans() {
  const { plans, updatePlan, addPlan, deletePlan, tokenPackages, updateTokenPackage, addTokenPackage, deleteTokenPackage } = useSuperAdmin();
  const { showAlert, showConfirm } = useDialog();
  
  // Plan Editing State
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SaaSPlan>>({});
  const [newFeature, setNewFeature] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // Package Editing State
  const [editingPackage, setEditingPackage] = useState<TokenPackage | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  // --- PLAN FUNCTIONS ---
  const handleCreatePlan = () => {
    const newPlan: SaaSPlan = {
        id: `plan-${Date.now()}` as any, // Cast to any to bypass strict union type for dynamic plans
        name: 'Novo Plano',
        price: 0,
        features: [],
        includedTokens: 0,
        maxDiskSpace: 0,
        active: false
    };
    setEditForm(newPlan);
    setEditingPlanId(newPlan.id);
    setIsCreatingPlan(true);
  };

  const startEdit = (plan: SaaSPlan) => {
    setEditingPlanId(plan.id);
    setEditForm(plan);
    setNewFeature('');
    setIsCreatingPlan(false);
  };

  const cancelEdit = () => {
    setEditingPlanId(null);
    setEditForm({});
    setNewFeature('');
    setIsCreatingPlan(false);
  };

  const saveEdit = () => {
    if (editingPlanId && editForm.name) {
        if (isCreatingPlan) {
            addPlan(editForm as SaaSPlan);
            showAlert({ title: 'Sucesso', message: 'Novo plano criado.', type: 'success' });
        } else {
            updatePlan(editingPlanId, editForm);
            showAlert({ title: 'Sucesso', message: 'Plano atualizado.', type: 'success' });
        }
        setEditingPlanId(null);
        setIsCreatingPlan(false);
    }
  };

  const handleDeletePlan = async (plan: SaaSPlan) => {
    const confirmed = await showConfirm({
        title: 'Excluir Plano',
        message: `Tem certeza que deseja excluir o plano "${plan.name}"? Isso não afetará assinaturas ativas imediatamente, mas impedirá novas adesões.`,
        type: 'danger',
        confirmText: 'Sim, Excluir'
    });

    if (confirmed) {
        deletePlan(plan.id);
        showAlert({ title: 'Excluído', message: 'Plano removido com sucesso.', type: 'success' });
    }
  };

  const handleAddFeature = () => {
    if (newFeature) {
        setEditForm({
            ...editForm,
            features: [...(editForm.features || []), newFeature]
        });
        setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (editForm.features) {
        const newFeatures = [...editForm.features];
        newFeatures.splice(index, 1);
        setEditForm({
            ...editForm,
            features: newFeatures
        });
    }
  };

  const togglePlanActive = async (plan: SaaSPlan) => {
      if (editingPlanId === plan.id) {
          setEditForm({ ...editForm, active: !editForm.active });
      } else {
          const action = plan.active ? 'desativar' : 'ativar';
          const confirm = await showConfirm({
              title: `${action.charAt(0).toUpperCase() + action.slice(1)} Plano`,
              message: `Tem certeza que deseja ${action} o plano ${plan.name}?`,
              type: plan.active ? 'warning' : 'success'
          });

          if (confirm) {
              updatePlan(plan.id, { active: !plan.active });
              showAlert({ title: 'Sucesso', message: `Plano ${plan.active ? 'desativado' : 'ativado'}.`, type: 'success' });
          }
      }
  };

  // --- PACKAGE FUNCTIONS ---
  const handleNewPackage = () => {
      setEditingPackage({
          id: `pack-${Date.now()}`,
          name: '',
          tokens: 100,
          price: 0,
          active: true
      });
      setIsPackageModalOpen(true);
  };

  const handleEditPackage = (pkg: TokenPackage) => {
      setEditingPackage(pkg);
      setIsPackageModalOpen(true);
  };

  const handleDeletePackage = async (pkg: TokenPackage) => {
      const confirmed = await showConfirm({
          title: 'Excluir Pacote',
          message: `Deseja excluir o pacote "${pkg.name}"?`,
          type: 'danger',
          confirmText: 'Excluir'
      });

      if (confirmed) {
          deleteTokenPackage(pkg.id);
          showAlert({ title: 'Excluído', message: 'Pacote removido.', type: 'success' });
      }
  };

  const handleSavePackage = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingPackage && editingPackage.name) {
          const exists = tokenPackages.some(p => p.id === editingPackage.id);
          if (exists) {
              updateTokenPackage(editingPackage.id, editingPackage);
          } else {
              addTokenPackage(editingPackage);
          }
          setIsPackageModalOpen(false);
          setEditingPackage(null);
          showAlert({ title: 'Sucesso', message: 'Pacote salvo com sucesso.', type: 'success' });
      }
  };

  // Combine existing plans with the one being created if applicable for rendering
  const displayPlans = isCreatingPlan && editingPlanId 
    ? [...plans, editForm as SaaSPlan] 
    : plans;

  return (
    <div className="space-y-8">
      {/* PACKAGE EDIT MODAL */}
      {isPackageModalOpen && editingPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Package size={20} className="text-blue-600" />
                        {tokenPackages.some(p => p.id === editingPackage.id) ? 'Editar Pacote' : 'Novo Pacote'}
                    </h3>
                    <button onClick={() => setIsPackageModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSavePackage} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome do Pacote</label>
                        <input 
                            type="text" 
                            value={editingPackage.name}
                            onChange={e => setEditingPackage({...editingPackage, name: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                            required
                            placeholder="Ex: Pacote Iniciante"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tokens</label>
                            <input 
                                type="number" 
                                value={editingPackage.tokens}
                                onChange={e => setEditingPackage({...editingPackage, tokens: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Preço (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={editingPackage.price}
                                onChange={e => setEditingPackage({...editingPackage, price: parseFloat(e.target.value)})}
                                className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
                        <button 
                            type="button"
                            onClick={() => setEditingPackage({...editingPackage, active: !editingPackage.active})}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors",
                                editingPackage.active 
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}
                        >
                            {editingPackage.active ? 'Ativo' : 'Inativo'}
                        </button>
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setIsPackageModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planos & Pacotes</h1>
            <p className="text-slate-500 dark:text-slate-400">Configure os preços, recursos e limites.</p>
        </div>
        <button 
            onClick={handleCreatePlan}
            disabled={isCreatingPlan}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Plus size={18} /> Novo Plano
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPlans.map(plan => {
            const isEditing = editingPlanId === plan.id;
            const currentPlan = isEditing ? (editForm as SaaSPlan) : plan;

            return (
                <div 
                    key={plan.id} 
                    className={cn(
                        "bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 shadow-sm relative transition-all flex flex-col",
                        currentPlan.highlight ? "border-indigo-500 shadow-indigo-100 dark:shadow-indigo-900/20" : "border-slate-200 dark:border-slate-800",
                        isEditing ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950" : "",
                        !currentPlan.active && !isEditing ? "opacity-75 grayscale" : ""
                    )}
                >
                    {currentPlan.highlight && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            Mais Popular
                        </div>
                    )}

                    {!currentPlan.active && !isEditing && (
                        <div className="absolute top-4 right-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Ban size={12} /> Inativo
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="font-bold text-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 w-full mr-2 text-slate-900 dark:text-white"
                                placeholder="Nome do Plano"
                            />
                        ) : (
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                        )}
                        
                        {isEditing ? (
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={saveEdit} className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50" title="Salvar"><Save size={16} /></button>
                                <button onClick={cancelEdit} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Cancelar"><X size={16} /></button>
                            </div>
                        ) : (
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(plan)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeletePlan(plan)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        {isEditing ? (
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white mr-1">R$</span>
                                <input 
                                    type="number" 
                                    value={editForm.price} 
                                    onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                    className="w-24 p-1 border rounded font-bold text-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                                <span className="text-slate-500 dark:text-slate-400 ml-1">/mês</span>
                            </div>
                        ) : (
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                {formatCurrency(plan.price)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mês</span>
                            </p>
                        )}
                    </div>

                    {/* Limits Section */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-6 space-y-3 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <MessageSquare size={16} className="text-green-500" />
                                Tokens Mensais
                            </div>
                            {isEditing ? (
                                <input 
                                    type="number" 
                                    value={editForm.includedTokens} 
                                    onChange={e => setEditForm({...editForm, includedTokens: parseInt(e.target.value)})}
                                    className="w-20 p-1 border rounded text-right text-sm font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                                />
                            ) : (
                                <div className="text-right">
                                    <span className="font-bold text-slate-900 dark:text-white block">{plan.includedTokens}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">(Não cumulativo)</span>
                                </div>
                            )}
                        </div>
                        
                        {isEditing && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status do Plano</span>
                                <button 
                                    onClick={() => togglePlanActive(plan)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors",
                                        editForm.active 
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    )}
                                >
                                    {editForm.active ? <Power size={12} /> : <Ban size={12} />}
                                    {editForm.active ? 'Ativo' : 'Inativo'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Recursos Inclusos</h4>
                        <ul className="space-y-3 mb-4">
                            {currentPlan.features?.map((feature, idx) => (
                                <li key={idx} className="flex items-start justify-between gap-2 text-sm text-slate-600 dark:text-slate-300 group/item">
                                    <div className="flex items-start gap-3">
                                        <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                    {isEditing && (
                                        <button 
                                            onClick={() => handleRemoveFeature(idx)}
                                            className="text-red-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {isEditing && (
                            <div className="flex gap-2 mt-2">
                                <input 
                                    type="text" 
                                    value={newFeature}
                                    onChange={e => setNewFeature(e.target.value)}
                                    placeholder="Novo recurso..."
                                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    onKeyDown={e => e.key === 'Enter' && handleAddFeature()}
                                />
                                <button 
                                    onClick={handleAddFeature}
                                    disabled={!newFeature}
                                    className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Token Packages */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pacotes de Tokens Avulsos</h2>
            <button 
                onClick={handleNewPackage}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
                <Plus size={16} /> Novo Pacote
            </button>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Nome do Pacote</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Quantidade de Tokens</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Preço</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {tokenPackages.map(pkg => (
                        <tr key={pkg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{pkg.name}</td>
                            <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{pkg.tokens}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatCurrency(pkg.price)}</td>
                            <td className="px-6 py-4">
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-bold",
                                    pkg.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {pkg.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => handleEditPackage(pkg)}
                                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                                    >
                                        <Edit2 size={14} /> Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePackage(pkg)}
                                        className="text-red-600 dark:text-red-400 hover:underline font-medium flex items-center gap-1"
                                    >
                                        <Trash2 size={14} /> Excluir
                                    </button>
                                </div>
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
