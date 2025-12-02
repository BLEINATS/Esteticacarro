import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Settings, Gift, Trophy, Star, TrendingUp, Users, Award, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { TierConfig } from '../types';

export default function Gamification() {
  const { companySettings, updateCompanySettings, clients, rewards, addReward, deleteReward, updateReward, updateTierConfig, redemptions } = useApp();
  const [isEnabled, setIsEnabled] = useState(companySettings.gamification?.enabled || false);
  const [multiplier, setMultiplier] = useState(companySettings.gamification?.pointsMultiplier || 1);
  
  // Reward Form State
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [newReward, setNewReward] = useState({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', rewardType: 'discount', percentage: 0, gift: '' });

  // Tier Config State
  const [tiers, setTiers] = useState<TierConfig[]>(companySettings.gamification.tiers || []);
  const [isEditingTiers, setIsEditingTiers] = useState(false);

  useEffect(() => {
    if (companySettings.gamification.tiers) {
        setTiers(companySettings.gamification.tiers);
    }
  }, [companySettings.gamification.tiers]);

  const handleToggle = (value: boolean) => {
    setIsEnabled(value);
    updateCompanySettings({
      ...companySettings,
      gamification: {
        ...companySettings.gamification,
        enabled: value,
      }
    });
  };

  const handleMultiplierChange = (value: number) => {
    setMultiplier(value);
    updateCompanySettings({
      ...companySettings,
      gamification: {
        ...companySettings.gamification,
        pointsMultiplier: value,
      }
    });
  };

  const handleTierChange = (index: number, field: keyof TierConfig, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const saveTiers = () => {
    updateTierConfig(tiers);
    setIsEditingTiers(false);
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReward.name && newReward.description) {
      if (editingRewardId) {
        updateReward(editingRewardId, {
          name: newReward.name,
          description: newReward.description,
          requiredPoints: newReward.requiredPoints,
          requiredLevel: newReward.requiredLevel as any,
          rewardType: newReward.rewardType as any,
          percentage: newReward.rewardType === 'discount' ? newReward.percentage : undefined,
          gift: newReward.rewardType === 'gift' || newReward.rewardType === 'free_service' ? newReward.gift : undefined,
        });
        setEditingRewardId(null);
      } else {
        addReward({
          name: newReward.name,
          description: newReward.description,
          requiredPoints: newReward.requiredPoints,
          requiredLevel: newReward.requiredLevel as any,
          rewardType: newReward.rewardType as any,
          percentage: newReward.rewardType === 'discount' ? newReward.percentage : undefined,
          gift: newReward.rewardType === 'gift' || newReward.rewardType === 'free_service' ? newReward.gift : undefined,
          active: true
        });
      }
      setNewReward({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', rewardType: 'discount', percentage: 0, gift: '' });
      setShowRewardForm(false);
    }
  };

  const handleEditReward = (reward: any) => {
    setEditingRewardId(reward.id);
    setNewReward({
      name: reward.name,
      description: reward.description,
      requiredPoints: reward.requiredPoints,
      requiredLevel: reward.requiredLevel,
      rewardType: reward.rewardType,
      percentage: reward.percentage || 0,
      gift: reward.gift || ''
    });
    setShowRewardForm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={32} className="text-amber-500" />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Gamificação & Fidelidade</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Crie um programa de recompensas para fidelizar seus clientes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enable/Disable */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings size={20} className="text-blue-600" />
                    Configuração Geral
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ative para começar a oferecer pontos e recompensas</p>
                </div>
                <button
                  onClick={() => handleToggle(!isEnabled)}
                  className={cn(
                    "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                    isEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                      isEnabled ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {isEnabled && (
                <div className="mt-6 space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  {/* Multiplier */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Multiplicador de Pontos
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 1.5, 2, 3].map((m) => (
                        <button
                          key={m}
                          onClick={() => handleMultiplierChange(m)}
                          className={cn(
                            "py-3 px-4 rounded-lg font-bold transition-all",
                            multiplier === m
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {m}x
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Cada real gasto = {multiplier} ponto{multiplier !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Tier Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Trophy size={18} className="text-purple-600" />
                          Configuração de Níveis
                        </h4>
                        {!isEditingTiers ? (
                            <button onClick={() => setIsEditingTiers(true)} className="text-xs text-blue-600 hover:underline">Editar Pontuação</button>
                        ) : (
                            <button onClick={saveTiers} className="text-xs text-green-600 font-bold hover:underline">Salvar Alterações</button>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        {tiers.map((tier, idx) => (
                            <div key={tier.id} className={cn("p-4 rounded-lg border flex items-center justify-between bg-white dark:bg-slate-900", isEditingTiers ? "border-blue-500" : "border-slate-200 dark:border-slate-700")}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${tier.color}`}></div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{tier.name}</p>
                                        {isEditingTiers ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-500">Mínimo:</span>
                                                <input 
                                                    type="number" 
                                                    value={tier.minPoints} 
                                                    onChange={(e) => handleTierChange(idx, 'minPoints', parseInt(e.target.value))}
                                                    className="w-20 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">A partir de {tier.minPoints} pontos</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{tier.benefits[0]}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rewards Structure */}
            {isEnabled && (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award size={20} className="text-emerald-600" />
                      Gerenciar Recompensas
                    </h3>
                    <button
                      onClick={() => {
                        setEditingRewardId(null);
                        setNewReward({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', rewardType: 'discount', percentage: 0, gift: '' });
                        setShowRewardForm(!showRewardForm);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      <Plus size={18} /> Nova Recompensa
                    </button>
                  </div>

                  {/* Add/Edit Reward Form */}
                  {showRewardForm && (
                    <form onSubmit={handleAddReward} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome da Recompensa *</label>
                          <input
                            type="text" placeholder="ex: Desconto 10%"
                            value={newReward.name}
                            onChange={e => setNewReward({...newReward, name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Recompensa *</label>
                          <select
                            value={newReward.rewardType}
                            onChange={e => setNewReward({...newReward, rewardType: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="discount">Desconto %</option>
                            <option value="service">Serviço Grátis</option>
                            <option value="gift">Brinde</option>
                            <option value="free_service">Serviço Completo</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
                        <textarea
                          placeholder="ex: Desconto de 10% em todos os serviços"
                          value={newReward.description}
                          onChange={e => setNewReward({...newReward, description: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nível Mínimo *</label>
                          <select
                            value={newReward.requiredLevel}
                            onChange={e => setNewReward({...newReward, requiredLevel: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="bronze">Bronze</option>
                            <option value="silver">Prata</option>
                            <option value="gold">Ouro</option>
                            <option value="platinum">Platina</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Pontos Necessários</label>
                          <input
                            type="number" min="0"
                            value={newReward.requiredPoints}
                            onChange={e => setNewReward({...newReward, requiredPoints: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        {newReward.rewardType === 'discount' && (
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Percentual (%)</label>
                            <input
                              type="number" min="0" max="100"
                              value={newReward.percentage}
                              onChange={e => setNewReward({...newReward, percentage: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          </div>
                        )}
                        {(newReward.rewardType === 'gift' || newReward.rewardType === 'service' || newReward.rewardType === 'free_service') && (
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Brinde/Serviço</label>
                            <input
                              type="text" placeholder="ex: Toalha Premium"
                              value={newReward.gift}
                              onChange={e => setNewReward({...newReward, gift: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRewardForm(false);
                            setEditingRewardId(null);
                            setNewReward({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', rewardType: 'discount', percentage: 0, gift: '' });
                          }}
                          className="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors hover:bg-slate-400 dark:hover:bg-slate-600"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          {editingRewardId ? 'Salvar Alterações' : 'Adicionar Recompensa'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Rewards List */}
                  <div className="space-y-3">
                    {rewards && rewards.length > 0 ? (
                      rewards.map(reward => (
                        <div key={reward.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">{reward.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{reward.description}</p>
                            <div className="flex gap-3 mt-2 flex-wrap">
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                {reward.requiredLevel.charAt(0).toUpperCase() + reward.requiredLevel.slice(1)}
                              </span>
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                {reward.requiredPoints} pontos
                              </span>
                              {reward.rewardType === 'discount' && (
                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
                                  {reward.percentage}% desconto
                                </span>
                              )}
                              {(reward.rewardType === 'gift' || reward.rewardType === 'free_service') && (
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                                  {reward.gift}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditReward(reward)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded transition-colors"
                              title="Editar recompensa"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => updateReward(reward.id, { active: !reward.active })}
                              className={cn("px-3 py-1 rounded text-sm font-semibold transition-colors", reward.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}
                            >
                              {reward.active ? 'Ativo' : 'Inativo'}
                            </button>
                            <button
                              onClick={() => deleteReward(reward.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                              title="Deletar recompensa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 dark:text-slate-400 py-4">Nenhuma recompensa cadastrada. Crie sua primeira!</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="text-center mb-4">
                <div className={cn(
                  "w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3",
                  isEnabled ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
                )}>
                  <Zap size={32} className={isEnabled ? "text-emerald-600" : "text-slate-400"} />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">STATUS</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {isEnabled ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>

            {/* Clients with Points */}
            {isEnabled && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Clientes Ativos
                </h4>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{clients.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Elegíveis para pontos</p>
                </div>
              </div>
            )}

            {/* Vouchers Ativos */}
            {isEnabled && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Gift size={18} className="text-pink-600" />
                        Vouchers Ativos
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {redemptions.filter(r => r.status === 'active').length > 0 ? (
                            redemptions.filter(r => r.status === 'active').map(r => (
                                <div key={r.id} className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 text-xs">
                                    <div className="flex justify-between font-bold mb-1">
                                        <span>{r.code}</span>
                                        <span className="text-green-600">Ativo</span>
                                    </div>
                                    <p className="text-slate-500">{r.rewardName}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-400 text-xs">Nenhum voucher ativo.</p>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
