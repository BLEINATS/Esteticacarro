import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, MapPin, Calendar, Car, 
  History, TrendingUp, MessageCircle, Plus, Zap, Gift, Copy, DollarSign, Save, Loader2,
  Edit2, Trash2, StickyNote, Calculator, Bot, RefreshCw, ExternalLink, Palette, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Client, Vehicle, VEHICLE_SIZES, VehicleSize, ClientPoints } from '../types';
import { cn, formatCurrency, copyToClipboard, formatId } from '../lib/utils';
import FidelityCard from './FidelityCard';
import { useDialog } from '../context/DialogContext';

interface ClientDetailsModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientDetailsModal({ client, onClose }: ClientDetailsModalProps) {
  const navigate = useNavigate();
  const { 
    workOrders, reminders, addVehicle, updateVehicle, removeVehicle, updateClient, 
    getClientPoints, getFidelityCard, createFidelityCard, companySettings, 
    getRewardsByLevel, getWhatsappLink, claimReward, getClientRedemptions, 
    addPointsToClient, subscription, consumeTokens 
  } = useApp();
  
  const { showConfirm, showAlert, showOptions } = useDialog();
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'history' | 'crm' | 'fidelidade'>('overview');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
  // ... (Existing state for vehicles/edit) ...
  const [newVehicle, setNewVehicle] = useState({ 
    brand: '', 
    model: '', 
    plate: '', 
    color: '', 
    year: '', 
    size: 'medium' as VehicleSize 
  });
  
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
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editVehicleData, setEditVehicleData] = useState<Partial<Vehicle>>({});
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');

  // Manual Points State
  const [manualSpend, setManualSpend] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  // Card Generation State
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardGenerationError, setCardGenerationError] = useState(false);

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
  
  // ... (Existing useEffects) ...
  useEffect(() => {
    let mounted = true;
    if (!card && companySettings.gamification?.enabled && !isGeneratingCard && !cardGenerationError) {
      setIsGeneratingCard(true);
      createFidelityCard(client.id)
        .then(newCard => {
            if (mounted && !newCard.cardNumber) {
                setCardGenerationError(true);
            }
        })
        .catch(() => {
            if (mounted) setCardGenerationError(true);
        })
        .finally(() => {
            if (mounted) setIsGeneratingCard(false);
        });
    }
    return () => { mounted = false; };
  }, [card, client.id, companySettings.gamification?.enabled]);

  useEffect(() => {
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/client-profile/${client.id}`);
  }, [client.id]);

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

  // ... (Existing handlers: fetchAddress, handleCepChange, handleSaveClient, handleAddVehicle, etc.) ...
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
    } catch (error) { console.error("Error fetching CEP", error); } finally { setIsLoadingCep(false); }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditFormData(prev => ({ ...prev, cep: value }));
    if (value.replace(/\D/g, '').length === 8) fetchAddress(value);
  };

  const handleSaveClient = () => {
    const fullAddress = `${editFormData.street}, ${editFormData.number} - ${editFormData.neighborhood}, ${editFormData.city} - ${editFormData.state}, ${editFormData.cep}`;
    updateClient(client.id, { ...editFormData, address: fullAddress });
    setIsEditing(false);
    showAlert({ title: 'Sucesso', message: 'Dados do cliente atualizados.', type: 'success' });
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVehicle.brand && newVehicle.model && newVehicle.plate) {
      addVehicle(client.id, {
        id: `v-${Date.now()}`,
        model: `${newVehicle.brand} ${newVehicle.model}`,
        plate: newVehicle.plate,
        color: newVehicle.color,
        year: newVehicle.year,
        size: newVehicle.size
      });
      setNewVehicle({ brand: '', model: '', plate: '', color: '', year: '', size: 'medium' });
      setShowAddVehicle(false);
    }
  };

  const startEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setEditVehicleData(vehicle);
    const parts = vehicle.model.split(' ');
    if (parts.length > 1) {
        setEditBrand(parts[0]);
        setEditModel(parts.slice(1).join(' '));
    } else {
        setEditBrand('');
        setEditModel(vehicle.model);
    }
  };

  const saveEditVehicle = () => {
    if (editingVehicleId && editModel && editVehicleData.plate) {
        const fullModel = editBrand ? `${editBrand} ${editModel}` : editModel;
        updateVehicle(client.id, { ...editVehicleData, model: fullModel } as Vehicle);
        setEditingVehicleId(null);
        setEditVehicleData({});
        setEditBrand('');
        setEditModel('');
        showAlert({ title: 'Sucesso', message: 'Veículo atualizado.', type: 'success' });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    const confirmed = await showConfirm({
        title: 'Excluir Veículo',
        message: 'Tem certeza que deseja remover este veículo?',
        type: 'danger',
        confirmText: 'Sim, Excluir'
    });
    if (confirmed) removeVehicle(client.id, vehicleId);
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

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareLink);
    if (success) showAlert({ title: 'Copiado', message: 'Link do cartão copiado!', type: 'success' });
    else showAlert({ title: 'Erro', message: 'Não foi possível copiar o link.', type: 'error' });
  };

  const handleOpenCard = () => navigate(`/client-profile/${client.id}`);

  const handleSendFidelityCard = async () => {
    if (!card) return;
    const message = `Olá ${client.name}! 🎁\n\nSeu cartão de fidelidade ${companySettings.name} está pronto!\n\n📊 Status:\n• Pontos: ${points.totalPoints}\n• Nível: ${points.tier.toUpperCase()}\n• Número: ${card.cardNumber}\n\nAdicione ao Wallet para acompanhar em tempo real:\n${shareLink}`;
    
    if (isWhatsAppConnected) {
        if ((subscription.tokenBalance || 0) < 1) {
            await showAlert({ title: 'Saldo Insuficiente', message: 'Você precisa de 1 token para enviar via Robô.', type: 'warning' });
            return;
        }
        if (consumeTokens(1, `Envio Cartão Fidelidade: ${client.name}`)) {
            await showAlert({ title: 'Sucesso', message: 'Cartão enviado automaticamente! (1 Token usado)', type: 'success' });
        } else {
            await showAlert({ title: 'Erro', message: 'Falha ao processar tokens.', type: 'error' });
        }
    } else {
        const link = getWhatsappLink(client.phone, message);
        window.open(link, '_blank');
    }
  };

  const handleSendReminder = async (reminder: any) => {
    const vehicle = client.vehicles.find(v => v.id === reminder.vehicleId)?.model || 'seu veículo';
    const message = `Olá ${client.name}! Aqui é da Cristal Care. Passando para lembrar que a ${reminder.serviceType} do ${vehicle} vence em ${new Date(reminder.dueDate).toLocaleDateString('pt-BR')}.`;
    
    if (isWhatsAppConnected) {
        if ((subscription.tokenBalance || 0) < 1) {
            await showAlert({ title: 'Saldo Insuficiente', message: 'Você precisa de 1 token.', type: 'warning' });
            return;
        }
        if (consumeTokens(1, `Lembrete: ${client.name}`)) {
            await showAlert({ title: 'Sucesso', message: 'Lembrete enviado!', type: 'success' });
        }
    } else {
        const link = getWhatsappLink(client.phone, message);
        window.open(link, '_blank');
    }
  };

  const handleRetryCard = () => {
      setCardGenerationError(false);
      setIsGeneratingCard(true);
      createFidelityCard(client.id)
        .then(newCard => { if (!newCard.cardNumber) setCardGenerationError(true); })
        .catch(() => setCardGenerationError(true))
        .finally(() => setIsGeneratingCard(false));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl w-full h-full sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-7xl">
        
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
                  <Calendar size={12} className="hidden sm:block" /> 
                  Cadastro: {new Date(client.created_at || new Date()).toLocaleDateString('pt-BR')}
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
                  "flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap",
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
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {/* ... (Existing Overview Content) ... */}
              <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4 relative">
                {/* ... (Contact Data Form) ... */}
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
                {/* ... (Display/Edit Logic - same as before) ... */}
                {!isEditing ? (
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
                ) : (
                    <div className="space-y-3">
                        <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" placeholder="Nome" />
                        <input type="text" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" placeholder="Telefone" />
                        <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" placeholder="Email" />
                    </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                    <Calculator size={18} className="text-blue-600" /> Métricas de Valor (LTV)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Gasto</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(client.ltv || 0)}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Visitas</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{client.visitCount || 0}</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Ticket Médio</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {client.visitCount > 0 ? formatCurrency((client.ltv || 0) / client.visitCount) : 'R$ 0,00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VEHICLES */}
          {activeTab === 'vehicles' && (
            <div className="space-y-3 sm:space-y-4">
              {/* ... (Existing Vehicles Content) ... */}
              <div className="flex justify-between items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Veículos</h3>
                <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                  <Plus size={14} /> <span className="hidden sm:inline">Adicionar</span>
                </button>
              </div>
              {showAddVehicle && (
                <form onSubmit={handleAddVehicle} className="bg-slate-100 dark:bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <input type="text" placeholder="Marca" required value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                    <input type="text" placeholder="Modelo" required value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                    <input type="text" placeholder="Placa" required value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm uppercase" />
                    <input type="text" placeholder="Cor" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                    <input type="text" placeholder="Ano" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                    <select value={newVehicle.size} onChange={e => setNewVehicle({...newVehicle, size: e.target.value as VehicleSize})} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm">
                      {Object.entries(VEHICLE_SIZES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-1 sm:gap-2">
                    <button type="button" onClick={() => setShowAddVehicle(false)} className="text-xs font-bold text-slate-500 px-2 sm:px-3 py-1.5 sm:py-2">Cancelar</button>
                    <button type="submit" disabled={!newVehicle.brand || !newVehicle.model || !newVehicle.plate} className="text-xs font-bold bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg disabled:opacity-50">Salvar</button>
                  </div>
                </form>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {client.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{vehicle.model}</h4>
                        <p className="text-xs text-slate-500">{vehicle.plate} • {vehicle.color}</p>
                    </div>
                    <button onClick={() => handleDeleteVehicle(vehicle.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Histórico de Serviços</h3>
              <div className="space-y-2">
                {clientWorkOrders.length > 0 ? clientWorkOrders.map((os) => (
                  <div key={os.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{os.service}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(os.createdAt || '').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 whitespace-nowrap", os.status === 'Concluído' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}>{os.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-slate-500 dark:text-slate-400">Veículo</p><p className="font-medium text-slate-900 dark:text-white truncate">{os.vehicle}</p></div>
                      <div><p className="text-slate-500 dark:text-slate-400">Valor</p><p className="font-medium text-slate-900 dark:text-white">{formatCurrency(os.totalValue)}</p></div>
                    </div>
                  </div>
                )) : <div className="text-center py-6 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-xs">Nenhum serviço encontrado.</div>}
              </div>
            </div>
          )}

          {/* TAB: FIDELIDADE (NEW LAYOUT) */}
          {activeTab === 'fidelidade' && companySettings.gamification?.enabled && (
            <div className="h-full flex flex-col">
              {card ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                  
                  {/* Left Column: Card & Stats (Sticky on Desktop) */}
                  <div className="lg:col-span-5 space-y-6">
                      <div className="sticky top-0 space-y-6">
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

                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={handleSendFidelityCard} className={cn("flex flex-col items-center justify-center gap-1 p-3 rounded-xl font-bold text-xs transition-all border", isWhatsAppConnected ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800")}>
                                {isWhatsAppConnected ? <Bot size={20} /> : <MessageCircle size={20} />}
                                <span>Enviar</span>
                            </button>
                            <button onClick={handleOpenCard} className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-xs transition-all">
                                <ExternalLink size={20} />
                                <span>Visualizar</span>
                            </button>
                            <button onClick={handleCopyLink} className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition-all">
                                <Copy size={20} />
                                <span>Copiar</span>
                            </button>
                        </div>
                        
                        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-3 flex items-center gap-2">
                                <History size={16} /> Histórico Recente
                            </h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
                                {points.pointsHistory && points.pointsHistory.length > 0 ? (
                                    points.pointsHistory.slice().reverse().slice(0, 5).map(entry => (
                                        <div key={entry.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                                            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{entry.description}</span>
                                            <span className={cn("font-bold", entry.points > 0 ? "text-green-600" : "text-red-500")}>
                                                {entry.points > 0 ? '+' : ''}{entry.points}
                                            </span>
                                        </div>
                                    ))
                                ) : <p className="text-slate-400 italic text-center">Sem histórico.</p>}
                            </div>
                        </div>
                      </div>
                  </div>

                  {/* Right Column: Actions & Rewards */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                      
                      {/* Manual Points Entry */}
                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100} className="text-yellow-500" /></div>
                          <h4 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                              <Zap size={18} className="text-yellow-500 fill-yellow-500" />
                              Lançar Pontos Manualmente
                          </h4>
                          <form onSubmit={handleManualPoints} className="space-y-3 relative z-10">
                              <div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor Gasto (R$)</label>
                                  <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                      <input 
                                          type="number" 
                                          step="0.01"
                                          value={manualSpend}
                                          onChange={(e) => setManualSpend(e.target.value)}
                                          placeholder="0,00"
                                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                          required
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição (Opcional)</label>
                                  <input 
                                      type="text" 
                                      value={manualDesc}
                                      onChange={(e) => setManualDesc(e.target.value)}
                                      placeholder="Ex: Compra de produtos"
                                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                              </div>
                              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                                  <Save size={16} /> Lançar Pontos & Atualizar LTV
                              </button>
                          </form>
                      </div>

                      {/* Vouchers Ativos */}
                      {redemptions.filter(r => r.status === 'active').length > 0 && (
                          <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 p-4 rounded-xl">
                              <h4 className="font-bold text-pink-700 dark:text-pink-300 text-sm mb-3 flex items-center gap-2">
                                  <Gift size={16} /> Vouchers Ativos
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {redemptions.filter(r => r.status === 'active').map(r => (
                                      <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                          <div className="flex justify-between items-center mb-1">
                                              <span className="font-mono font-bold text-slate-900 dark:text-white text-lg tracking-wider">{r.code}</span>
                                              <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">ATIVO</span>
                                          </div>
                                          <p className="text-xs text-slate-500">{r.rewardName}</p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* Rewards List */}
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 flex flex-col">
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-3">Recompensas Disponíveis</h4>
                          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[200px]">
                          {getRewardsByLevel(points.tier).map(r => {
                              const canClaim = points.totalPoints >= r.requiredPoints;
                              return (
                              <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-sm flex justify-between items-center gap-3">
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="font-bold text-slate-900 dark:text-white text-sm">{r.name}</p>
                                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded whitespace-nowrap border border-slate-200 dark:border-slate-700">
                                              -{r.requiredPoints} pts
                                          </span>
                                      </div>
                                      <p className="text-slate-500 dark:text-slate-400 line-clamp-1">{r.description}</p>
                                  </div>
                                  <button
                                  onClick={() => {
                                      const result = claimReward(client.id, r.id);
                                      if(result.success) showAlert({ title: 'Resgatado!', message: result.message, type: 'success' });
                                      else showAlert({ title: 'Erro', message: result.message, type: 'error' });
                                  }}
                                  disabled={!canClaim}
                                  className={cn(
                                      "px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap",
                                      canClaim
                                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                  )}
                                  >
                                  {canClaim ? 'Resgatar' : `Faltam ${r.requiredPoints - points.totalPoints}`}
                                  </button>
                              </div>
                              );
                          })}
                          {getRewardsByLevel(points.tier).length === 0 && (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                                  <Gift size={32} className="mb-2 opacity-50" />
                                  <p>Nenhuma recompensa para este nível.</p>
                              </div>
                          )}
                          </div>
                      </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                  {cardGenerationError ? (
                      <div className="text-center">
                          <p className="text-sm text-red-500 mb-3">Erro ao carregar cartão.</p>
                          <button onClick={handleRetryCard} className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors mx-auto">
                              <RefreshCw size={16} /> Tentar Novamente
                          </button>
                      </div>
                  ) : (
                      <>
                        <Loader2 size={32} className="animate-spin mb-2" />
                        <p className="text-sm">Gerando cartão de fidelidade...</p>
                      </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
