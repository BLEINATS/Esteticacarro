import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, MapPin, Calendar, Car, 
  History, TrendingUp, MessageCircle, Plus, AlertCircle, Zap, Gift, Copy, Check, Smartphone, Wallet
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { Client, Vehicle, VEHICLE_SIZES, VehicleSize } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import FidelityCard from './FidelityCard';

interface ClientDetailsModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientDetailsModal({ client, onClose }: ClientDetailsModalProps) {
  const { workOrders, reminders, addVehicle, getClientPoints, getFidelityCard, companySettings, getRewardsByLevel, getWhatsappLink, generatePKPass, generateGoogleWallet, claimReward, getClientRedemptions } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'history' | 'crm' | 'fidelidade'>('overview');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ model: '', plate: '', color: '', year: '', size: 'medium' });
  
  const points = getClientPoints(client.id);
  const card = getFidelityCard(client.id);
  const redemptions = getClientRedemptions(client.id);
  
  useEffect(() => {
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/client-profile/${client.id}`);
    
    // Gerar QR code com dados completos do cartão
    if (card) {
      const qrData = {
        clientId: client.id,
        cardNumber: card.cardNumber,
        clientName: client.name,
        totalPoints: points?.totalPoints || 0,
        tier: points?.tier || 'bronze',
        timestamp: new Date().toISOString()
      };
      QRCode.toDataURL(JSON.stringify(qrData), { width: 300 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [client.id, card, points]);

  const clientWorkOrders = workOrders.filter(os => os.clientId === client.id);
  const clientReminders = reminders.filter(r => r.clientId === client.id);

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVehicle.model && newVehicle.plate) {
      addVehicle(client.id, {
        id: `v-${Date.now()}`,
        model: newVehicle.model || '',
        plate: newVehicle.plate || '',
        color: newVehicle.color || '',
        year: newVehicle.year || '',
        size: newVehicle.size as VehicleSize || 'medium'
      });
      setNewVehicle({ model: '', plate: '', color: '', year: '', size: 'medium' });
      setShowAddVehicle(false);
    }
  };

  const generateReminderMessage = (reminder: any) => {
    const vehicle = client.vehicles.find(v => v.id === reminder.vehicleId)?.model || 'seu veículo';
    return `Olá ${client.name}! Aqui é da Crystal Care. 
Passando para lembrar que a ${reminder.serviceType} do ${vehicle} vence em ${new Date(reminder.dueDate).toLocaleDateString('pt-BR')}.
Manter essa manutenção em dia é essencial para garantir a proteção e o brilho.
Podemos agendar para esta semana?`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl w-full h-full sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="w-10 sm:w-16 h-10 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-lg shadow-blue-600/20 flex-shrink-0">
              {client.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{client.name}</h2>
              <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold uppercase",
                  client.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  client.status === 'churn_risk' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}>
                  {client.status === 'active' ? 'Ativo' : client.status === 'churn_risk' ? 'Risco' : 'Inativo'}
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm flex items-center gap-1 whitespace-nowrap">
                  <Calendar size={12} className="hidden sm:block" /> {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex">
            {[
              { id: 'overview', label: 'Visão Geral', icon: User },
              { id: 'vehicles', label: 'Veículos', icon: Car },
              { id: 'history', label: 'Histórico', icon: History },
              { id: 'crm', label: 'CRM', icon: TrendingUp },
              ...(companySettings.gamification?.enabled ? [{ id: 'fidelidade', label: 'Fidelidade', icon: Zap }] : [])
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap",
                  activeTab === tab.id 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* TAB: FIDELIDADE - Simplified QR + Wallet only */}
          {activeTab === 'fidelidade' && companySettings.gamification?.enabled && points && card && (
            <div className="space-y-4 max-w-md mx-auto">
              {/* Tier Color Mapping */}
              {(() => {
                const tierColorMap = {
                  bronze: { bg: 'from-amber-500 to-amber-600', info: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-200' },
                  silver: { bg: 'from-slate-400 to-slate-600', info: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-800', text: 'text-slate-900 dark:text-slate-200' },
                  gold: { bg: 'from-yellow-500 to-yellow-600', info: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-900 dark:text-yellow-200' },
                  platinum: { bg: 'from-blue-500 to-blue-600', info: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-200' }
                };
                const colors = tierColorMap[points.tier] || tierColorMap.bronze;
                
                return (
                  <>
                    {/* QR Code */}
                    <div className={`${colors.info} ${colors.border} p-6 rounded-xl border text-center`}>
                      <p className={`text-sm font-bold ${colors.text} mb-3`}>QR Code para Validação</p>
                      {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />}
                    </div>

                    {/* Send via WhatsApp */}
                    <button
                      onClick={() => {
                        const message = `Olá ${client.name}! 🎁\n\nSeu cartão de fidelidade ${companySettings.name} está pronto!\n\n📊 Status:\n• Pontos: ${points.totalPoints}\n• Nível: ${points.tier.toUpperCase()}\n• Número: ${card.cardNumber}\n\nEscaneie o QR Code para validar seus pontos!\n\nAdicione ao Wallet para acompanhar em tempo real.`;
                        const link = getWhatsappLink(client.phone, message);
                        window.open(link, '_blank');
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${colors.bg} text-white rounded-lg font-bold hover:shadow-lg transition-all`}
                    >
                      💬 Enviar via WhatsApp
                    </button>

                    {/* Add to Wallet */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const url = generatePKPass(client.id);
                          if (url) {
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `cartao-${card.cardNumber}.txt`;
                            link.click();
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        <Smartphone size={16} /> iOS
                      </button>
                      <button
                        onClick={() => window.open(generateGoogleWallet(client.id), '_blank')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        <Wallet size={16} /> Google
                      </button>
                    </div>

                    {/* Vouchers Ativos */}
                    {redemptions.filter(r => r.status === 'active').length > 0 && (
                        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 p-4 rounded-lg">
                            <h4 className="font-bold text-pink-700 dark:text-pink-300 text-sm mb-3 flex items-center gap-2">
                                <Gift size={16} /> Vouchers Ativos
                            </h4>
                            <div className="space-y-2">
                                {redemptions.filter(r => r.status === 'active').map(r => (
                                    <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">{r.code}</span>
                                            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Ativo</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{r.rewardName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rewards Section */}
                    {getRewardsByLevel(points.tier).length > 0 && (
                      <div className={`${colors.info} ${colors.border} p-4 rounded-lg border`}>
                        <h4 className={`font-bold ${colors.text} text-sm mb-3`}>🎁 Recompensas Disponíveis</h4>
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                          {getRewardsByLevel(points.tier).map(r => {
                            const canClaim = points.totalPoints >= r.requiredPoints;
                            return (
                              <div key={r.id} className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                  <p className="font-bold text-slate-900 dark:text-white">{r.name}</p>
                                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded whitespace-nowrap">-{r.requiredPoints}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const result = claimReward(client.id, r.id);
                                    alert(result.message);
                                  }}
                                  disabled={!canClaim}
                                  className={`w-full text-xs font-bold py-1 rounded transition-colors ${
                                    canClaim
                                      ? 'bg-gradient-to-r ' + colors.bg + ' text-white hover:shadow-md'
                                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  {canClaim ? '🎁 Resgatar' : `Faltam ${r.requiredPoints - points.totalPoints}`}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-4">Dados de Contato</h3>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Phone size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 break-all">{client.phone}</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Mail size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 break-all">{client.email}</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <MapPin size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{client.address || 'Endereço não cadastrado'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-4">Métricas de Valor (LTV)</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Gasto</p>
                    <p className="text-base sm:text-2xl font-bold text-blue-700 dark:text-blue-400 break-all">{formatCurrency(client.ltv)}</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Ticket Médio</p>
                    <p className="text-base sm:text-2xl font-bold text-purple-700 dark:text-purple-400 break-all">
                      {clientWorkOrders.length > 0 
                        ? formatCurrency(client.ltv / clientWorkOrders.length) 
                        : 'R$ 0,00'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Notas Internas</p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 sm:p-3 rounded-lg line-clamp-3">
                    {client.notes || 'Nenhuma observação.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VEHICLES */}
          {activeTab === 'vehicles' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Veículos</h3>
                <button 
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <Plus size={14} /> <span className="hidden sm:inline">Adicionar</span>
                </button>
              </div>

              {showAddVehicle && (
                <form onSubmit={handleAddVehicle} className="bg-slate-100 dark:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <input 
                      type="text" placeholder="Modelo" required
                      value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm"
                    />
                    <input 
                      type="text" placeholder="Placa" required
                      value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm"
                    />
                    <input 
                      type="text" placeholder="Cor"
                      value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm"
                    />
                    <input 
                      type="text" placeholder="Ano"
                      value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm"
                    />
                    <select
                      value={newVehicle.size}
                      onChange={e => setNewVehicle({...newVehicle, size: e.target.value as VehicleSize})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm col-span-2 sm:col-span-1"
                    >
                      {Object.entries(VEHICLE_SIZES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-1 sm:gap-2">
                    <button type="button" onClick={() => setShowAddVehicle(false)} className="text-xs font-bold text-slate-500 px-2 sm:px-3 py-1.5 sm:py-2">Cancelar</button>
                    <button type="submit" className="text-xs font-bold bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">Salvar</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {client.vehicles.length > 0 ? client.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0">
                      <Car size={18} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{vehicle.model}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{vehicle.plate} • {vehicle.color}</p>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                        {VEHICLE_SIZES[vehicle.size]}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-6 sm:py-8 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                    Nenhum veículo cadastrado.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Histórico de Serviços</h3>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Serviço</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Veículo</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Valor</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {clientWorkOrders.map((os) => (
                      <tr key={os.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">{new Date(os.createdAt || '').toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white text-sm truncate">{os.service}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">{os.vehicle}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white text-sm">{formatCurrency(os.totalValue)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            os.status === 'Concluído' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>{os.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {clientWorkOrders.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Nenhum serviço encontrado.</div>
                )}
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2">
                {clientWorkOrders.length > 0 ? clientWorkOrders.map((os) => (
                  <div key={os.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{os.service}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(os.createdAt || '').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 whitespace-nowrap",
                        os.status === 'Concluído' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>{os.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Veículo</p>
                        <p className="font-medium text-slate-900 dark:text-white truncate">{os.vehicle}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Valor</p>
                        <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(os.totalValue)}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-xs">Nenhum serviço encontrado.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CRM / RETENTION */}
          {activeTab === 'crm' && (
            <div className="space-y-3 sm:space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-6 rounded-lg sm:rounded-xl text-white shadow-lg">
                <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">Gestão de Ciclo de Vida</h3>
                <p className="text-blue-100 text-xs sm:text-sm">
                  O sistema monitora automaticamente serviços que requerem manutenção e gera alertas.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                  Lembretes Ativos
                </h3>
                
                <div className="space-y-2 sm:space-y-3">
                  {clientReminders.length > 0 ? clientReminders.map((reminder) => (
                    <div key={reminder.id} className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{reminder.serviceType}</span>
                          {new Date(reminder.dueDate) < new Date() && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Vencido</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          Vencimento: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(reminder.dueDate).toLocaleDateString('pt-BR')}</span>
                        </p>
                      </div>
                      
                      <a 
                        href={`https://wa.me/55${client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(generateReminderMessage(reminder))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm w-full"
                      >
                        <MessageCircle size={16} />
                        WhatsApp
                      </a>
                    </div>
                  )) : (
                    <div className="text-center py-6 sm:py-8 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                      Nenhum lembrete de manutenção pendente.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
