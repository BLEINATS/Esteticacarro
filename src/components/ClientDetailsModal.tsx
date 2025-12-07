import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, MapPin, Calendar, Car, 
  History, TrendingUp, MessageCircle, Plus, Zap, Gift, Copy, DollarSign, Save, Loader2,
  Edit2, Trash2, StickyNote, Calculator, Bot
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { Client, Vehicle, VEHICLE_SIZES, VehicleSize, ClientPoints } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import FidelityCard from './FidelityCard';
import { useDialog } from '../context/DialogContext';

interface ClientDetailsModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientDetailsModal({ client, onClose }: ClientDetailsModalProps) {
  const { 
    workOrders, reminders, addVehicle, updateVehicle, removeVehicle, updateClient, 
    getClientPoints, getFidelityCard, createFidelityCard, companySettings, 
    getRewardsByLevel, getWhatsappLink, claimReward, getClientRedemptions, 
    addPointsToClient, subscription, consumeTokens 
  } = useApp();
  
  const { showConfirm, showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'history' | 'crm' | 'fidelidade'>('overview');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ model: '', plate: '', color: '', year: '', size: 'medium' });
  
  // Editing State for Overview
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: client.name,
    phone: client.phone,
    email: client.email,
    cep: client.cep || '',
    street: client.street || '',
    number: client.number || '',
    neighborhood: client.neighborhood || '',
    city: client.city || '',
    state: client.state || '',
    notes: client.notes || ''
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Editing State for Vehicles
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editVehicleData, setEditVehicleData] = useState<Partial<Vehicle>>({});

  // Manual Points State
  const [manualSpend, setManualSpend] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  // WhatsApp Status
  const isWhatsAppConnected = companySettings.whatsapp.session.status === 'connected';

  // Get Points or Default
  const rawPoints = getClientPoints(client.id);
  const points: ClientPoints = rawPoints || {
    clientId: client.id,
    totalPoints: 0,
    currentLevel: 1,
    tier: 'bronze',
    servicesCompleted: 0,
    lastServiceDate: new Date().toISOString(),
    pointsHistory: []
  };

  const card = getFidelityCard(client.id);
  const redemptions = getClientRedemptions(client.id);
  
  useEffect(() => {
    if (!card && companySettings.gamification?.enabled) {
      createFidelityCard(client.id);
    }
  }, [card, client.id, companySettings.gamification?.enabled, createFidelityCard]);

  useEffect(() => {
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/client-profile/${client.id}`);
  }, [client.id]);

  // Sync edit form data when client prop updates
  useEffect(() => {
    setEditFormData({
        name: client.name,
        phone: client.phone,
        email: client.email,
        cep: client.cep || '',
        street: client.street || '',
        number: client.number || '',
        neighborhood: client.neighborhood || '',
        city: client.city || '',
        state: client.state || '',
        notes: client.notes || ''
    });
  }, [client]);

  const clientWorkOrders = workOrders.filter(os => os.clientId === client.id);
  const clientReminders = reminders.filter(r => r.clientId === client.id);

  // --- CLIENT EDITING LOGIC ---
  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setEditFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      console.error("Error fetching CEP", error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditFormData(prev => ({ ...prev, cep: value }));
    if (value.replace(/\D/g, '').length === 8) {
        fetchAddress(value);
    }
  };

  const handleSaveClient = () => {
    const fullAddress = `${editFormData.street}, ${editFormData.number} - ${editFormData.neighborhood}, ${editFormData.city} - ${editFormData.state}, ${editFormData.cep}`;
    updateClient(client.id, {
        ...editFormData,
        address: fullAddress
    });
    setIsEditing(false);
    showAlert({ title: 'Sucesso', message: 'Dados do cliente atualizados.', type: 'success' });
  };

  // --- VEHICLE LOGIC ---
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

  const startEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setEditVehicleData(vehicle);
  };

  const saveEditVehicle = () => {
    if (editingVehicleId && editVehicleData.model && editVehicleData.plate) {
        updateVehicle(client.id, editVehicleData as Vehicle);
        setEditingVehicleId(null);
        setEditVehicleData({});
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    const confirmed = await showConfirm({
        title: 'Excluir Veículo',
        message: 'Tem certeza que deseja remover este veículo?',
        type: 'danger',
        confirmText: 'Sim, Excluir'
    });

    if (confirmed) {
        removeVehicle(client.id, vehicleId);
    }
  };

  const handleManualPoints = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(manualSpend);
    if (!isNaN(value) && value > 0) {
        const multiplier = companySettings.gamification?.pointsMultiplier || 1;
        const pointsToAdd = Math.floor(value * multiplier);
        const description = manualDesc || 'Compra em Loja / Avulso';
        
        addPointsToClient(client.id, 'manual', pointsToAdd, description);
        
        updateClient(client.id, {
            ltv: (client.ltv || 0) + value,
            visitCount: (client.visitCount || 0) + 1,
            lastVisit: new Date().toISOString()
        });

        setManualSpend('');
        setManualDesc('');
        showAlert({ title: 'Sucesso', message: `${pointsToAdd} pontos adicionados e LTV atualizado!`, type: 'success' });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showAlert({ title: 'Copiado', message: 'Link do cartão copiado!', type: 'success' });
  };

  const generateReminderMessage = (reminder: any) => {
    const vehicle = client.vehicles.find(v => v.id === reminder.vehicleId)?.model || 'seu veículo';
    return `Olá ${client.name}! Aqui é da Cristal Care. 
Passando para lembrar que a ${reminder.serviceType} do ${vehicle} vence em ${new Date(reminder.dueDate).toLocaleDateString('pt-BR')}.
Manter essa manutenção em dia é essencial para garantir a proteção e o brilho.
Podemos agendar para esta semana?`;
  };

  const handleSendFidelityCard = async () => {
    if (!card) return;
    
    const message = `Olá ${client.name}! 🎁\n\nSeu cartão de fidelidade ${companySettings.name} está pronto!\n\n📊 Status:\n• Pontos: ${points.totalPoints}\n• Nível: ${points.tier.toUpperCase()}\n• Número: ${card.cardNumber}\n\nAdicione ao Wallet para acompanhar em tempo real:\n${shareLink}`;
    
    if (isWhatsAppConnected) {
        // Bot Flow
        if ((subscription.tokenBalance || 0) < 1) {
            await showAlert({ title: 'Saldo Insuficiente', message: 'Você precisa de 1 token para enviar via Robô.', type: 'warning' });
            return;
        }
        
        const confirm = await showConfirm({
            title: 'Enviar Cartão via Robô',
            message: 'Deseja usar 1 Token para enviar o cartão automaticamente?',
            confirmText: 'Enviar (1 Token)',
            type: 'info'
        });

        if (confirm) {
            if (consumeTokens(1, `Envio Cartão Fidelidade: ${client.name}`)) {
                await showAlert({ title: 'Enviado', message: 'Cartão enviado para a fila de disparo.', type: 'success' });
            } else {
                await showAlert({ title: 'Erro', message: 'Falha ao processar tokens.', type: 'error' });
            }
        }
    } else {
        // Manual Flow
        const link = getWhatsappLink(client.phone, message);
        window.open(link, '_blank');
    }
  };

  const handleSendReminder = async (reminder: any) => {
    const message = generateReminderMessage(reminder);
    
    if (isWhatsAppConnected) {
        // Bot Flow
        if ((subscription.tokenBalance || 0) < 1) {
            await showAlert({ title: 'Saldo Insuficiente', message: 'Você precisa de 1 token para enviar via Robô.', type: 'warning' });
            return;
        }
        
        const confirm = await showConfirm({
            title: 'Enviar Lembrete via Robô',
            message: 'Deseja usar 1 Token para enviar este lembrete automaticamente?',
            confirmText: 'Enviar (1 Token)',
            type: 'info'
        });

        if (confirm) {
            if (consumeTokens(1, `Lembrete Manutenção: ${client.name}`)) {
                await showAlert({ title: 'Enviado', message: 'Lembrete enviado para a fila de disparo.', type: 'success' });
            } else {
                await showAlert({ title: 'Erro', message: 'Falha ao processar tokens.', type: 'error' });
            }
        }
    } else {
        // Manual Flow
        const link = getWhatsappLink(client.phone, message);
        window.open(link, '_blank');
    }
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
          
          {/* TAB: OVERVIEW (EDITABLE) */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4 relative">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Dados de Contato</h3>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                            <Edit2 size={14} /> Editar
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="text-slate-500 text-xs font-bold hover:underline">Cancelar</button>
                            <button onClick={handleSaveClient} className="text-green-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                <Save size={14} /> Salvar
                            </button>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-3 animate-in fade-in">
                        <input 
                            type="text" 
                            value={editFormData.name} 
                            onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                            placeholder="Nome"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                                type="text" 
                                value={editFormData.phone} 
                                onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder="Telefone"
                            />
                            <input 
                                type="email" 
                                value={editFormData.email} 
                                onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder="Email"
                            />
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Endereço</p>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <div className="relative col-span-1">
                                    <input 
                                        type="text" 
                                        value={editFormData.cep} 
                                        onChange={handleCepChange}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="CEP"
                                        maxLength={9}
                                    />
                                    {isLoadingCep && <Loader2 className="absolute right-2 top-2.5 animate-spin text-blue-500" size={14} />}
                                </div>
                                <div className="col-span-2">
                                    <input 
                                        type="text" 
                                        value={editFormData.street} 
                                        onChange={e => setEditFormData({...editFormData, street: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Rua"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <input 
                                    type="text" 
                                    value={editFormData.number} 
                                    onChange={e => setEditFormData({...editFormData, number: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="Nº"
                                />
                                <div className="col-span-2">
                                    <input 
                                        type="text" 
                                        value={editFormData.neighborhood} 
                                        onChange={e => setEditFormData({...editFormData, neighborhood: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Bairro"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-2">
                                    <input 
                                        type="text" 
                                        value={editFormData.city} 
                                        onChange={e => setEditFormData({...editFormData, city: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Cidade"
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    value={editFormData.state} 
                                    onChange={e => setEditFormData({...editFormData, state: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 uppercase"
                                    placeholder="UF"
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <textarea 
                            value={editFormData.notes} 
                            onChange={e => setEditFormData({...editFormData, notes: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400"
                            placeholder="Observações"
                            rows={2}
                        />
                    </div>
                ) : (
                    <>
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
                    </>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                    <Calculator size={18} className="text-blue-600" />
                    Métricas de Valor (LTV)
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Gasto</p>
                    <p className="text-base sm:text-2xl font-bold text-blue-700 dark:text-blue-400 break-all">{formatCurrency(client.ltv || 0)}</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Visitas</p>
                    <p className="text-base sm:text-2xl font-bold text-green-700 dark:text-green-400">{client.visitCount || 0}</p>
                  </div>
                  <div className="p-2 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Ticket Médio</p>
                    <p className="text-base sm:text-2xl font-bold text-purple-700 dark:text-purple-400 break-all">
                      {client.visitCount > 0 
                        ? formatCurrency((client.ltv || 0) / client.visitCount) 
                        : 'R$ 0,00'}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                    <div>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2 flex items-center gap-1">
                        <StickyNote size={12} /> Notas Internas
                    </p>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 sm:p-3 rounded-lg min-h-[60px] whitespace-pre-wrap">
                        {client.notes || 'Nenhuma observação registrada.'}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                        * Para alterar as notas, clique em "Editar" acima.
                    </p>
                    </div>
                )}
              </div>
            </div>
          )}

          {/* ... (Rest of the file remains the same) ... */}
          {/* TAB: VEHICLES (EDITABLE) */}
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
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                    <input 
                      type="text" placeholder="Placa" required
                      value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                    <input 
                      type="text" placeholder="Cor"
                      value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                    <input 
                      type="text" placeholder="Ano"
                      value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    />
                    <select
                      value={newVehicle.size}
                      onChange={e => setNewVehicle({...newVehicle, size: e.target.value as VehicleSize})}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm col-span-2 sm:col-span-1"
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
                  <div key={vehicle.id} className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 relative group">
                    <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0">
                      <Car size={18} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    
                    {editingVehicleId === vehicle.id ? (
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <input 
                                type="text" 
                                value={editVehicleData.model} 
                                onChange={e => setEditVehicleData({...editVehicleData, model: e.target.value})}
                                className="px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-950 dark:border-slate-700 text-slate-900 dark:text-white"
                                placeholder="Modelo"
                            />
                            <input 
                                type="text" 
                                value={editVehicleData.plate} 
                                onChange={e => setEditVehicleData({...editVehicleData, plate: e.target.value})}
                                className="px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-950 dark:border-slate-700 text-slate-900 dark:text-white"
                                placeholder="Placa"
                            />
                            <div className="col-span-2 flex justify-end gap-2 mt-1">
                                <button onClick={() => setEditingVehicleId(null)} className="text-xs text-slate-500">Cancelar</button>
                                <button onClick={saveEditVehicle} className="text-xs text-green-600 font-bold">Salvar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{vehicle.model}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{vehicle.plate} • {vehicle.color}</p>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                                {VEHICLE_SIZES[vehicle.size]}
                            </span>
                        </div>
                    )}

                    {!editingVehicleId && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditVehicle(vehicle)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
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
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-xs">Nenhum serviço encontrado.</div>
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
                  <TrendingUp size={18} className="text-amber-500 flex-shrink-0" />
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
                      
                      <button 
                        onClick={() => handleSendReminder(reminder)}
                        className={cn(
                            "flex items-center justify-center gap-2 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm w-full",
                            isWhatsAppConnected ? "bg-purple-600 hover:bg-purple-700" : "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        {isWhatsAppConnected ? <Bot size={16} /> : <MessageCircle size={16} />}
                        {isWhatsAppConnected ? 'Enviar via Robô (1 Token)' : 'Enviar WhatsApp (Manual)'}
                      </button>
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

          {/* TAB: FIDELIDADE */}
          {activeTab === 'fidelidade' && companySettings.gamification?.enabled && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {card ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Card & Actions */}
                  <div className="space-y-4">
                      <FidelityCard 
                          clientName={client.name}
                          clientPhone={client.phone}
                          totalPoints={points.totalPoints}
                          currentLevel={points.currentLevel}
                          tier={points.tier}
                          cardNumber={card.cardNumber}
                          servicesCompleted={points.servicesCompleted}
                          shopName={companySettings.name}
                      />

                      <div className="grid grid-cols-2 gap-3">
                          <button
                              onClick={handleSendFidelityCard}
                              className={cn(
                                "flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-bold text-sm transition-all",
                                isWhatsAppConnected ? "bg-purple-600 hover:bg-purple-700" : "bg-green-600 hover:bg-green-700"
                              )}
                          >
                              {isWhatsAppConnected ? <Bot size={18} /> : <MessageCircle size={18} />}
                              {isWhatsAppConnected ? 'Enviar (Robô)' : 'Enviar no Zap'}
                          </button>
                          <button
                              onClick={handleCopyLink}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all"
                          >
                              <Copy size={18} /> Copiar Link
                          </button>
                      </div>
                      <p className="text-xs text-center text-slate-500">
                          Este link é público. O cliente não precisa de senha para acessar.
                      </p>
                  </div>

                  {/* Right Column: Manual Entry & Rewards */}
                  <div className="space-y-6">
                      
                      {/* Manual Points Entry */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              <Zap size={18} className="text-amber-500" />
                              Lançar Pontos Manualmente
                          </h4>
                          <form onSubmit={handleManualPoints} className="space-y-3">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor Gasto (R$)</label>
                                  <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input 
                                          type="number" 
                                          step="0.01"
                                          value={manualSpend}
                                          onChange={(e) => setManualSpend(e.target.value)}
                                          placeholder="0,00"
                                          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white"
                                          required
                                      />
                                  </div>
                                  {manualSpend && (
                                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                          + {Math.floor(parseFloat(manualSpend) * (companySettings.gamification?.pointsMultiplier || 1))} pontos
                                      </p>
                                  )}
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição (Opcional)</label>
                                  <input 
                                      type="text" 
                                      value={manualDesc}
                                      onChange={(e) => setManualDesc(e.target.value)}
                                      placeholder="Ex: Compra de produtos"
                                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                                  />
                              </div>
                              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                  <Save size={16} /> Lançar Pontos & Atualizar LTV
                              </button>
                          </form>
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

                      {/* Rewards List */}
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-3">Recompensas Disponíveis</h4>
                          <div className="space-y-2 max-h-56 overflow-y-auto">
                          {getRewardsByLevel(points.tier).map(r => {
                              const canClaim = points.totalPoints >= r.requiredPoints;
                              return (
                              <div key={r.id} className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                  <div className="flex justify-between items-start gap-2 mb-1.5">
                                  <p className="font-bold text-slate-900 dark:text-white">{r.name}</p>
                                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded whitespace-nowrap">-{r.requiredPoints} pts</span>
                                  </div>
                                  <button
                                  onClick={() => {
                                      const result = claimReward(client.id, r.id);
                                      alert(result.message);
                                  }}
                                  disabled={!canClaim}
                                  className={`w-full text-xs font-bold py-1 rounded transition-colors ${
                                      canClaim
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                  }`}
                                  >
                                  {canClaim ? 'Resgatar' : `Faltam ${r.requiredPoints - points.totalPoints}`}
                                  </button>
                              </div>
                              );
                          })}
                          {getRewardsByLevel(points.tier).length === 0 && (
                              <p className="text-xs text-slate-500 italic text-center">Nenhuma recompensa para este nível.</p>
                          )}
                          </div>
                      </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 size={32} className="animate-spin mb-2" />
                  <p className="text-sm">Gerando cartão de fidelidade...</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
