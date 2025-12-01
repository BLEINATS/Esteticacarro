import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Settings, Gift, Trophy, Star, TrendingUp, Users, Award, Plus, Trash2, Edit2 } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const levelColors = ['bg-slate-100', 'bg-blue-100', 'bg-purple-100', 'bg-emerald-100', 'bg-amber-100'];
const levelNames = ['Iniciante', 'Bronze', 'Prata', 'Ouro', 'Platina'];

export default function Gamification() {
  const { companySettings, updateCompanySettings, clients, rewards, addReward, deleteReward, updateReward, getRewardsByLevel } = useApp();
  const [isEnabled, setIsEnabled] = useState(companySettings.gamification?.enabled || false);
  const [multiplier, setMultiplier] = useState(companySettings.gamification?.pointsMultiplier || 1);
  const [levelSystem, setLevelSystem] = useState(companySettings.gamification?.levelSystem || true);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [newReward, setNewReward] = useState({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', rewardType: 'discount', percentage: 0, gift: '' });

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

  const handleLevelSystem = (value: boolean) => {
    setLevelSystem(value);
    updateCompanySettings({
      ...companySettings,
      gamification: {
        ...companySettings.gamification,
        levelSystem: value,
      }
    });
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReward.name && newReward.description) {
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
      setNewReward({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', rewardType: 'discount', percentage: 0, gift: '' });
      setShowRewardForm(false);
    }
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
                    Ativar Gamificação
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
                <div className="mt-6 space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
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

                  {/* Level System */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Trophy size={18} className="text-purple-600" />
                          Sistema de Níveis
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Desbloqueie recompensas conforme sobe de nível</p>
                      </div>
                      <button
                        onClick={() => handleLevelSystem(!levelSystem)}
                        className={cn(
                          "relative inline-flex h-8 w-14 items-center rounded-full transition-colors",
                          levelSystem ? "bg-purple-500" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                            levelSystem ? "translate-x-7" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rewards Structure */}
            {isEnabled && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Gift size={20} className="text-emerald-600" />
                  Estrutura de Recompensas
                </h3>
                <div className="space-y-3">
                  {levelSystem && [
                    { level: 1, name: 'Bronze', points: '0-500', reward: '5% desconto', color: 'from-amber-500 to-amber-600' },
                    { level: 2, name: 'Prata', points: '501-1500', reward: '10% desconto', color: 'from-slate-400 to-slate-500' },
                    { level: 3, name: 'Ouro', points: '1501-3000', reward: '15% desconto', color: 'from-yellow-500 to-yellow-600' },
                    { level: 4, name: 'Platina', points: '3001+', reward: '20% desconto + Brinde', color: 'from-blue-500 to-blue-600' },
                  ].map((tier) => (
                    <div key={tier.level} className={`bg-gradient-to-r ${tier.color} p-4 rounded-lg text-white shadow-md`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Star size={24} className="fill-current" />
                          <div>
                            <p className="font-bold">{tier.name}</p>
                            <p className="text-sm opacity-90">{tier.points} pontos</p>
                          </div>
                        </div>
                        <span className="font-bold text-lg">{tier.reward}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Award size={18} />
                Dica Pro
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Ative a gamificação para aumentar a retenção de clientes em até 40% e estimular compras recorrentes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
