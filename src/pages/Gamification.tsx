import React, { useState, useMemo } from 'react';
import { 
  Trophy, Gift, Star, Users, Zap, Settings, Plus, Edit2, Trash2, 
  ChevronRight, Award, Crown, TrendingUp, AlertCircle, CheckCircle2, Info,
  RefreshCw, Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';
import { Reward, TierLevel, TierConfig } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const DEFAULT_TIERS: TierConfig[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-500 to-amber-600', benefits: ['5% de desconto'] },
  { id: 'silver', name: 'Prata', minPoints: 1000, color: 'from-slate-400 to-slate-600', benefits: ['10% de desconto', 'Frete grátis'] },
  { id: 'gold', name: 'Ouro', minPoints: 3000, color: 'from-yellow-500 to-yellow-600', benefits: ['15% de desconto', 'Atendimento prioritário'] },
  { id: 'platinum', name: 'Platina', minPoints: 5000, color: 'from-blue-500 to-blue-600', benefits: ['20% de desconto', 'Brinde exclusivo'] }
];

export default function Gamification() {
  const navigate = useNavigate();
  const { 
    companySettings, updateCompanySettings, rewards, addReward, updateReward, deleteReward,
    checkPermission, seedDefaultRewards, clients, redemptions, clientPoints, workOrders
  } = useApp();
  const { showConfirm, showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'settings'>('overview');
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [newReward, setNewReward] = useState<Partial<Reward>>({
    name: '',
    description: '',
    requiredPoints: 100,
    requiredLevel: 'bronze',
    active: true,
    percentage: 0,
    value: 0,
    gift: false
  });

  const isEnabled = companySettings.gamification?.enabled;

  // Metrics Calculation
  const totalPointsIssued = clientPoints.reduce((acc, cp) => acc + cp.totalPoints, 0);
  const activeParticipants = clientPoints.length;
  const totalRedemptions = redemptions.length;
  const topTierCount = clientPoints.filter(cp => cp.tier === 'platinum' || cp.tier === 'gold').length;

  // --- CÁLCULOS REAIS DE ENGAJAMENTO (Membros) ---
  const memberMetrics = useMemo(() => {
    const memberIds = clientPoints.map(cp => cp.clientId);
    
    // Filtrar apenas ordens de serviço concluídas de membros do clube
    const memberOrders = workOrders.filter(os => 
        memberIds.includes(os.clientId) && 
        (os.status === 'Concluído' || os.status === 'Entregue')
    );

    // Ticket Médio dos Membros
    const totalRevenueMembers = memberOrders.reduce((acc, os) => acc + os.totalValue, 0);
    const avgTicketMembers = memberOrders.length > 0 ? totalRevenueMembers / memberOrders.length : 0;

    // Frequência (Visitas nos últimos 30 dias / Total de Membros)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMemberOrders = memberOrders.filter(os => new Date(os.createdAt) >= thirtyDaysAgo);
    
    // Média de visitas por membro ativo no último mês
    const frequency = activeParticipants > 0 ? recentMemberOrders.length / activeParticipants : 0;

    return {
        avgTicket: avgTicketMembers,
        frequency: frequency
    };
  }, [clientPoints, workOrders, activeParticipants]);

  if (!checkPermission('gamification')) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20">
          <Crown size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Fidelidade Premium</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-lg">
          Transforme clientes em fãs! Crie um clube de vantagens exclusivo, aumente a recorrência e o ticket médio com nosso sistema de gamificação.
        </p>
        <button className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/25 hover:scale-105 transition-all">
          Fazer Upgrade para PRO
        </button>
      </div>
    );
  }

  const handleToggleModule = () => {
      updateCompanySettings({
          gamification: {
              ...companySettings.gamification,
              enabled: !isEnabled
          }
      });
  };

  const handleSaveReward = () => {
    if (newReward.name && newReward.requiredPoints) {
      if (editingReward) {
        updateReward(editingReward.id, newReward);
        showAlert({ title: 'Sucesso', message: 'Recompensa atualizada!', type: 'success' });
      } else {
        addReward(newReward as any);
        showAlert({ title: 'Sucesso', message: 'Nova recompensa criada!', type: 'success' });
      }
      setIsRewardModalOpen(false);
      setEditingReward(null);
      setNewReward({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', active: true, percentage: 0, value: 0, gift: false });
    }
  };

  const handleDeleteReward = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Recompensa',
      message: 'Tem certeza? Isso não afetará resgates já realizados.',
      type: 'danger'
    });
    if (confirmed) {
      deleteReward(id);
    }
  };

  const openEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setNewReward(reward);
    setIsRewardModalOpen(true);
  };

  const handleSeedRewards = async () => {
      await seedDefaultRewards();
      showAlert({ title: 'Sucesso', message: 'Recompensas padrão criadas!', type: 'success' });
  };

  // --- ACTIONS FOR NEXT STEPS ---
  const handleCreateSeasonalReward = () => {
      const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
      const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
      
      setNewReward({
          name: `Especial de ${capitalizedMonth}`,
          description: 'Recompensa exclusiva por tempo limitado.',
          requiredPoints: 1500,
          requiredLevel: 'silver',
          active: true,
          percentage: 0,
          value: 0,
          gift: true,
          config: { gift: 'Brinde Surpresa' }
      });
      setActiveTab('rewards');
      setIsRewardModalOpen(true);
  };

  const handlePromotePlatinum = () => {
      navigate('/marketing', { 
          state: { 
              action: 'create_campaign', 
              campaignData: {
                  name: 'Convite VIP Platina',
                  messageTemplate: 'Olá {cliente}! 🌟 Você é um dos nossos melhores clientes e está muito perto de alcançar o nível Platina! Agende seu próximo serviço e desbloqueie 20% de desconto vitalício.',
                  targetSegment: 'custom'
              },
              targetTier: 'gold'
          } 
      });
  };

  const handleTierChange = (index: number, field: keyof TierConfig, value: any) => {
    const newTiers = [...(companySettings.gamification?.tiers || DEFAULT_TIERS)];
    
    if (field === 'benefits') {
        // Handle comma separated string to array
        newTiers[index] = { ...newTiers[index], benefits: value.split(',').map((s: string) => s.trim()) };
    } else {
        newTiers[index] = { ...newTiers[index], [field]: value };
    }

    updateCompanySettings({
        gamification: {
            ...companySettings.gamification,
            tiers: newTiers
        }
    });
  };

  const handleRestoreDefaults = async () => {
      const confirm = await showConfirm({
          title: 'Restaurar Padrão',
          message: 'Isso irá redefinir os nomes e pontos dos níveis para o padrão do sistema. Deseja continuar?',
          type: 'warning'
      });
      
      if (confirm) {
          updateCompanySettings({
              gamification: {
                  ...companySettings.gamification,
                  tiers: DEFAULT_TIERS
              }
          });
          showAlert({ title: 'Restaurado', message: 'Níveis redefinidos para o padrão.', type: 'success' });
      }
  };

  const handleSaveSettings = () => {
      // In reality, settings are saved on change, but this provides feedback
      showAlert({ title: 'Salvo', message: 'Configurações de gamificação salvas com sucesso.', type: 'success' });
  };

  if (!isEnabled) {
      return (
          <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Trophy size={48} className="text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Programa de Fidelidade</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-lg">
              O módulo está desativado. Ative agora para começar a recompensar seus melhores clientes e aumentar a retenção.
            </p>
            <button 
                onClick={handleToggleModule}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Zap size={20} /> Ativar Gamificação
            </button>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Clube de Vantagens
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie níveis, pontos e recompensas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Status:</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-500 flex items-center gap-1"><CheckCircle2 size={14} /> Ativo</span>
                    <button 
                        onClick={handleToggleModule}
                        className="text-xs text-slate-400 hover:text-red-500 underline ml-2"
                    >
                        Desativar
                    </button>
                </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 sm:flex-none",
                activeTab === 'overview' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
            >
                Visão Geral
            </button>
            <button
                onClick={() => setActiveTab('rewards')}
                className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 sm:flex-none",
                activeTab === 'rewards' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
            >
                Recompensas
            </button>
            <button
                onClick={() => setActiveTab('settings')}
                className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 sm:flex-none",
                activeTab === 'settings' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
            >
                Configurações
            </button>
            </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Zap size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Pontos Emitidos</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalPointsIssued.toLocaleString()}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Participantes</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeParticipants}</p>
                    <p className="text-xs text-slate-500 mt-1">Clientes com pontos</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Gift size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Resgates</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalRedemptions}</p>
                    <p className="text-xs text-slate-500 mt-1">Vouchers gerados</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <Crown size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Top Tiers</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{topTierCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Clientes Ouro/Platina</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={120} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 relative z-10">Engajamento do Clube</h3>
                    <p className="text-indigo-100 mb-6 relative z-10 max-w-md">
                        Gamificação aumenta a retenção em até 40%. Incentive seus clientes a subirem de nível para desbloquear benefícios exclusivos.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                            <p className="text-xs font-bold uppercase text-indigo-200 mb-1">Ticket Médio (Membros)</p>
                            <p className="text-2xl font-bold text-yellow-300">{formatCurrency(memberMetrics.avgTicket)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                            <p className="text-xs font-bold uppercase text-indigo-200 mb-1">Frequência</p>
                            <p className="text-2xl font-bold text-white">{memberMetrics.frequency.toFixed(1)}x <span className="text-sm font-normal opacity-70">/mês</span></p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500" /> Próximos Passos
                    </h3>
                    <div className="space-y-4">
                        <div 
                            onClick={handleCreateSeasonalReward}
                            className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                                <Plus size={16} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Criar Recompensa Sazonal</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Aproveite datas comemorativas para criar prêmios temáticos.</p>
                            </div>
                        </div>
                        <div 
                            onClick={handlePromotePlatinum}
                            className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                                <Award size={16} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Divulgar Nível Platina</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Envie uma campanha para clientes Ouro incentivando o upgrade.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* REWARDS TAB */}
      {activeTab === 'rewards' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Catálogo de Prêmios</h2>
            <div className="flex gap-2 w-full sm:w-auto">
                {rewards.length === 0 && (
                    <button 
                        onClick={handleSeedRewards}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Zap size={18} /> Gerar Padrão
                    </button>
                )}
                <button 
                    onClick={() => { setEditingReward(null); setNewReward({ name: '', description: '', requiredPoints: 100, requiredLevel: 'bronze', active: true, percentage: 0, value: 0, gift: false }); setIsRewardModalOpen(true); }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} /> Nova Recompensa
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map(reward => (
              <div key={reward.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 relative group hover:border-yellow-500/50 transition-colors shadow-sm">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditReward(reward)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteReward(reward.id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg shrink-0",
                    reward.requiredLevel === 'bronze' ? "bg-gradient-to-br from-amber-500 to-amber-700" :
                    reward.requiredLevel === 'silver' ? "bg-gradient-to-br from-slate-400 to-slate-600" :
                    reward.requiredLevel === 'gold' ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
                    "bg-gradient-to-br from-blue-500 to-blue-700"
                  )}>
                    <Gift size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{reward.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{reward.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-yellow-500 font-bold">
                    <Star size={14} fill="currentColor" />
                    <span>{reward.requiredPoints} pts</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                    Nível {reward.requiredLevel}
                  </span>
                </div>
              </div>
            ))}
            
            {rewards.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <Gift size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma recompensa criada</p>
                    <p className="text-slate-400 text-sm mt-1">Crie opções de troca para seus clientes.</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right">
            {/* Regras de Pontuação */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings size={20} className="text-blue-500" /> Regras de Pontuação
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Multiplicador de Pontos</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                value={companySettings.gamification?.pointsMultiplier || 1}
                                onChange={(e) => updateCompanySettings({ gamification: { ...companySettings.gamification, pointsMultiplier: Number(e.target.value) } })}
                                className="w-24 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-slate-500 dark:text-slate-400 font-medium">pontos por R$ 1,00 gasto</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Ex: Se o cliente gastar R$ 100,00 e o multiplicador for {companySettings.gamification?.pointsMultiplier || 1}, ele ganha {100 * (companySettings.gamification?.pointsMultiplier || 1)} pontos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Níveis de Fidelidade (Tiers) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Trophy size={20} className="text-yellow-500" /> Níveis de Fidelidade (Tiers)
                    </h3>
                    <button 
                        onClick={handleRestoreDefaults}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                        <RefreshCw size={12} /> Restaurar Padrão
                    </button>
                </div>
                
                {(companySettings.gamification?.tiers || DEFAULT_TIERS).map((tier, index) => (
                    <div key={tier.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md",
                            index === 0 ? "bg-amber-600" : index === 1 ? "bg-slate-500" : index === 2 ? "bg-yellow-500" : "bg-blue-600"
                        )}>
                            {index + 1}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Nível</label>
                                <input 
                                    type="text" 
                                    value={tier.name}
                                    onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pontos Mínimos</label>
                                <input 
                                    type="number" 
                                    value={tier.minPoints}
                                    onChange={(e) => handleTierChange(index, 'minPoints', Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Benefícios (Separar por vírgula)</label>
                                <input 
                                    type="text" 
                                    value={tier.benefits.join(', ')}
                                    onChange={(e) => handleTierChange(index, 'benefits', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: 5% desconto, Frete grátis"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSaveSettings}
                    className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    <Save size={18} /> Salvar Configurações
                </button>
            </div>
        </div>
      )}

      {/* REWARD MODAL */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Prêmio</label>
                <input 
                  type="text" 
                  value={newReward.name}
                  onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Lavagem Grátis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <textarea 
                  value={newReward.description}
                  onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Ex: Válido para carros pequenos..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pontos Necessários</label>
                  <input 
                    type="number" 
                    value={newReward.requiredPoints}
                    onChange={(e) => setNewReward({...newReward, requiredPoints: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nível Mínimo</label>
                  <select 
                    value={newReward.requiredLevel}
                    onChange={(e) => setNewReward({...newReward, requiredLevel: e.target.value as TierLevel})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Prata</option>
                    <option value="gold">Ouro</option>
                    <option value="platinum">Platina</option>
                  </select>
                </div>
              </div>

              {/* Advanced Config */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Configuração do Benefício</p>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs text-slate-500 mb-1">Desconto (%)</label>
                          <input 
                            type="number" 
                            value={newReward.percentage || 0}
                            onChange={(e) => setNewReward({...newReward, percentage: Number(e.target.value)})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
                          <input 
                            type="number" 
                            value={newReward.value || 0}
                            onChange={(e) => setNewReward({...newReward, value: Number(e.target.value)})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="isGift"
                        checked={newReward.gift || false}
                        onChange={(e) => setNewReward({...newReward, gift: e.target.checked})}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isGift" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">É um brinde físico? (Boné, Cera, etc)</label>
                  </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsRewardModalOpen(false)}
                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveReward}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
