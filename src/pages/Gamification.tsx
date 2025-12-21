import React, { useState } from 'react';
import { 
  Trophy, Gift, Award, TrendingUp, Plus, Edit2, Trash2, Save, X, 
  Settings, Users, Ticket, Zap, Power, CheckCircle2, Rocket, AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Reward, TierConfig } from '../types';
import { useDialog } from '../context/DialogContext';

export default function Gamification() {
  const { 
    companySettings, 
    updateCompanySettings, 
    rewards, 
    addReward, 
    updateReward, 
    deleteReward, 
    clients,
    redemptions
  } = useApp();
  
  const { showConfirm, showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'settings'>('overview');
  
  // Reward Form State
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState<Partial<Reward>>({
    name: '',
    description: '',
    requiredPoints: 100,
    requiredLevel: 'bronze',
    rewardType: 'discount',
    active: true,
    percentage: 0,
    value: 0,
    gift: ''
  });

  // Settings Form State
  const [pointsMultiplier, setPointsMultiplier] = useState(companySettings.gamification.pointsMultiplier || 1);
  const [tiers, setTiers] = useState<TierConfig[]>(companySettings.gamification.tiers || []);

  // Stats
  const totalPointsDistributed = clients.reduce((acc, c) => {
      return acc + Math.floor((c.ltv || 0) * (companySettings.gamification.pointsMultiplier || 1));
  }, 0);
  
  const activeParticipants = clients.filter(c => c.visitCount > 1).length;

  const seedDefaultRewards = () => {
      const defaults = [
          {
            name: 'Lavagem Simples Grátis',
            description: 'Resgate uma lavagem simples completa.',
            requiredPoints: 1000,
            requiredLevel: 'silver',
            rewardType: 'free_service',
            gift: 'Lavagem Simples',
            active: true,
            percentage: 0,
            value: 0
          },
          {
            name: '10% de Desconto',
            description: 'Desconto em qualquer serviço de estética.',
            requiredPoints: 500,
            requiredLevel: 'bronze',
            rewardType: 'discount',
            percentage: 10,
            active: true,
            value: 0,
            gift: ''
          },
          {
            name: 'Kit Cera Líquida',
            description: 'Leve para casa nossa cera exclusiva.',
            requiredPoints: 1500,
            requiredLevel: 'gold',
            rewardType: 'gift',
            gift: 'Cera Líquida Premium',
            active: true,
            percentage: 0,
            value: 0
          },
          {
            name: 'Polimento 50% OFF',
            description: 'Meio preço no polimento técnico completo.',
            requiredPoints: 2500,
            requiredLevel: 'platinum',
            rewardType: 'discount',
            percentage: 50,
            active: true,
            value: 0,
            gift: ''
          }
      ];

      defaults.forEach(r => addReward(r as any));
  };

  const handleToggleModule = async (enabled: boolean) => {
      if (!enabled) {
          const confirm = await showConfirm({
              title: 'Desativar Gamificação?',
              message: 'Ao desativar, a aba de fidelidade será ocultada dos clientes e não será possível acumular ou resgatar pontos. Os dados não serão perdidos.',
              type: 'warning',
              confirmText: 'Sim, Desativar'
          });
          if (!confirm) return;
      } else {
          // Se estiver ativando e não houver recompensas, criar padrões
          if (rewards.length === 0) {
              seedDefaultRewards();
          }
      }

      updateCompanySettings({
          gamification: {
              ...companySettings.gamification,
              enabled
          }
      });

      if (enabled) {
          showAlert({ title: 'Módulo Ativado', message: 'O programa de fidelidade está ativo! Recompensas padrão foram configuradas.', type: 'success' });
      } else {
          showAlert({ title: 'Módulo Desativado', message: 'O programa de fidelidade foi pausado.', type: 'info' });
      }
  };

  const handleOpenRewardModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setRewardForm(reward);
    } else {
      setEditingReward(null);
      setRewardForm({
        name: '',
        description: '',
        requiredPoints: 100,
        requiredLevel: 'bronze',
        rewardType: 'discount',
        active: true,
        percentage: 0,
        value: 0,
        gift: ''
      });
    }
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.name || !rewardForm.requiredPoints) return;

    if (editingReward) {
      updateReward(editingReward.id, rewardForm);
      showAlert({ title: 'Sucesso', message: 'Recompensa atualizada.', type: 'success' });
    } else {
      addReward(rewardForm as any);
      showAlert({ title: 'Sucesso', message: 'Nova recompensa criada.', type: 'success' });
    }
    setIsRewardModalOpen(false);
  };

  const handleDeleteReward = async (id: string) => {
    const confirm = await showConfirm({
        title: 'Excluir Recompensa',
        message: 'Tem certeza? Isso não afetará resgates já realizados.',
        type: 'danger',
        confirmText: 'Excluir'
    });
    if (confirm) {
        deleteReward(id);
        showAlert({ title: 'Excluído', message: 'Recompensa removida.', type: 'success' });
    }
  };

  const handleSaveSettings = () => {
      updateCompanySettings({
          gamification: {
              ...companySettings.gamification,
              pointsMultiplier,
              tiers
          }
      });
      showAlert({ title: 'Salvo', message: 'Configurações de gamificação atualizadas.', type: 'success' });
  };

  // --- DISABLED STATE VIEW ---
  if (!companySettings.gamification.enabled) {
      return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-full shadow-2xl mb-6">
                  <Trophy size={64} className="text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  Engaje seus Clientes com Gamificação
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mb-8">
                  Transforme compras em pontos, crie níveis de fidelidade (Bronze, Prata, Ouro) e ofereça recompensas exclusivas. Clientes fiéis gastam até 3x mais!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <Zap className="w-10 h-10 text-yellow-500 mb-3 mx-auto" />
                      <h3 className="font-bold text-slate-900 dark:text-white">Pontos Automáticos</h3>
                      <p className="text-sm text-slate-500 mt-2">Cada serviço gera pontos baseados no valor gasto (LTV).</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <Award className="w-10 h-10 text-purple-500 mb-3 mx-auto" />
                      <h3 className="font-bold text-slate-900 dark:text-white">Níveis VIP</h3>
                      <p className="text-sm text-slate-500 mt-2">Classifique clientes em Bronze, Prata, Ouro e Platina.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <Gift className="w-10 h-10 text-green-500 mb-3 mx-auto" />
                      <h3 className="font-bold text-slate-900 dark:text-white">Recompensas</h3>
                      <p className="text-sm text-slate-500 mt-2">Crie vouchers de desconto e brindes para resgate.</p>
                  </div>
              </div>

              <button 
                  onClick={() => handleToggleModule(true)}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 hover:scale-105 w-full sm:w-auto justify-center"
              >
                  <Rocket size={24} /> Ativar Módulo de Fidelidade
              </button>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Gamificação & Fidelidade</h1>
            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800">Ativo</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Engaje seus clientes com pontos e recompensas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Quick Toggle in Header */}
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Status do Módulo</span>
                <button 
                    onClick={() => handleToggleModule(!companySettings.gamification.enabled)}
                    className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                        companySettings.gamification.enabled ? "bg-green-500" : "bg-slate-300"
                    )}
                >
                    <span className={cn(
                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm",
                        companySettings.gamification.enabled ? "translate-x-4" : "translate-x-1"
                    )} />
                </button>
            </div>

            <div className="flex p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                        activeTab === 'overview' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                >
                    Visão Geral
                </button>
                <button 
                    onClick={() => setActiveTab('rewards')}
                    className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                        activeTab === 'rewards' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                >
                    Recompensas
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                        activeTab === 'settings' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                >
                    Configurações
                </button>
            </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                          <Zap size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Pontos Emitidos</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalPointsDistributed.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Total acumulado pelos clientes</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                          <Ticket size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Resgates</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{redemptions.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Recompensas solicitadas</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <Users size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Participantes Ativos</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeParticipants}</p>
                  <p className="text-xs text-slate-500 mt-1">{((activeParticipants / (clients.length || 1)) * 100).toFixed(0)}% da base de clientes</p>
              </div>
          </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
          <div className="space-y-6">
              <div className="flex justify-end">
                  <button 
                    onClick={() => handleOpenRewardModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                  >
                      <Plus size={18} /> Nova Recompensa
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rewards.map(reward => (
                      <div key={reward.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                          <div className={cn("h-2 w-full", 
                              reward.requiredLevel === 'bronze' ? 'bg-amber-600' :
                              reward.requiredLevel === 'silver' ? 'bg-slate-400' :
                              reward.requiredLevel === 'gold' ? 'bg-yellow-500' : 'bg-blue-600'
                          )} />
                          <div className="p-5">
                              <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{reward.name}</h3>
                                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                      {reward.requiredPoints} pts
                                  </span>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 line-clamp-2">{reward.description}</p>
                              
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                                  <Award size={14} /> Nível Mínimo: <span className="capitalize">{reward.requiredLevel}</span>
                              </div>

                              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                  <button 
                                    onClick={() => handleOpenRewardModal(reward)}
                                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                      <Edit2 size={14} /> Editar
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReward(reward.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
                  {rewards.length === 0 && (
                      <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <Gift size={48} className="mx-auto mb-3 opacity-50" />
                          <p>Nenhuma recompensa cadastrada.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              
              <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings size={20} className="text-blue-600" /> Regras de Pontuação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Multiplicador de Pontos</label>
                          <div className="flex items-center gap-3">
                              <input 
                                  type="number" 
                                  value={pointsMultiplier}
                                  onChange={(e) => setPointsMultiplier(parseFloat(e.target.value))}
                                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                              />
                              <span className="text-sm text-slate-500 dark:text-slate-400">pontos por R$ 1,00 gasto</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">Ex: Se o cliente gastar R$ 100,00 e o multiplicador for 1, ele ganha 100 pontos.</p>
                      </div>
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Trophy size={20} className="text-amber-500" /> Níveis de Fidelidade (Tiers)
                  </h3>
                  <div className="space-y-4">
                      {tiers.map((tier, idx) => (
                          <div key={tier.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold", 
                                  tier.id === 'bronze' ? 'bg-amber-600' :
                                  tier.id === 'silver' ? 'bg-slate-400' :
                                  tier.id === 'gold' ? 'bg-yellow-500' : 'bg-blue-600'
                              )}>
                                  {idx + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome do Nível</label>
                                      <input 
                                          type="text" 
                                          value={tier.name}
                                          onChange={(e) => {
                                              const newTiers = [...tiers];
                                              newTiers[idx].name = e.target.value;
                                              setTiers(newTiers);
                                          }}
                                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pontos Mínimos</label>
                                      <input 
                                          type="number" 
                                          value={tier.minPoints}
                                          onChange={(e) => {
                                              const newTiers = [...tiers];
                                              newTiers[idx].minPoints = parseInt(e.target.value);
                                              setTiers(newTiers);
                                          }}
                                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Benefícios (separar por vírgula)</label>
                                      <input 
                                          type="text" 
                                          value={tier.benefits.join(', ')}
                                          onChange={(e) => {
                                              const newTiers = [...tiers];
                                              newTiers[idx].benefits = e.target.value.split(',').map(s => s.trim());
                                              setTiers(newTiers);
                                          }}
                                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
                                      />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button 
                      onClick={handleSaveSettings}
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                      <Save size={20} /> Salvar Configurações
                  </button>
              </div>
          </div>
      )}

      {/* Reward Modal */}
      {isRewardModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}
                      </h3>
                      <button onClick={() => setIsRewardModalOpen(false)}><X className="text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleSaveReward} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome da Recompensa</label>
                          <input 
                              type="text" 
                              value={rewardForm.name}
                              onChange={e => setRewardForm({...rewardForm, name: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                              required
                              placeholder="Ex: Lavagem Grátis"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição</label>
                          <textarea 
                              value={rewardForm.description}
                              onChange={e => setRewardForm({...rewardForm, description: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                              rows={2}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pontos Necessários</label>
                              <input 
                                  type="number" 
                                  value={rewardForm.requiredPoints}
                                  onChange={e => setRewardForm({...rewardForm, requiredPoints: parseInt(e.target.value)})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                                  required
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nível Mínimo</label>
                              <select 
                                  value={rewardForm.requiredLevel}
                                  onChange={e => setRewardForm({...rewardForm, requiredLevel: e.target.value as any})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                              >
                                  <option value="bronze">Bronze</option>
                                  <option value="silver">Prata</option>
                                  <option value="gold">Ouro</option>
                                  <option value="platinum">Platina</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo de Recompensa</label>
                          <select 
                              value={rewardForm.rewardType}
                              onChange={e => setRewardForm({...rewardForm, rewardType: e.target.value as any})}
                              className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900 mb-2"
                          >
                              <option value="discount">Desconto Percentual</option>
                              <option value="free_service">Serviço Grátis</option>
                              <option value="gift">Brinde Físico</option>
                          </select>

                          {rewardForm.rewardType === 'discount' && (
                              <div className="flex items-center gap-2">
                                  <input 
                                      type="number" 
                                      value={rewardForm.percentage}
                                      onChange={e => setRewardForm({...rewardForm, percentage: parseInt(e.target.value)})}
                                      className="flex-1 px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                                      placeholder="Ex: 10"
                                  />
                                  <span className="text-slate-500">% de desconto</span>
                              </div>
                          )}
                          {(rewardForm.rewardType === 'gift' || rewardForm.rewardType === 'free_service') && (
                              <input 
                                  type="text" 
                                  value={rewardForm.gift}
                                  onChange={e => setRewardForm({...rewardForm, gift: e.target.value})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                                  placeholder={rewardForm.rewardType === 'gift' ? "Ex: Boné, Cera..." : "Ex: Lavagem Simples"}
                              />
                          )}
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button"
                              onClick={() => setIsRewardModalOpen(false)}
                              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit"
                              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                          >
                              Salvar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
