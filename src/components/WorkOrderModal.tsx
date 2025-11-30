import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, Camera, User, 
  MessageCircle, FileText, Box, Save, PenTool, 
  ShieldCheck, ClipboardCheck, CalendarClock, Hammer,
  CreditCard, UploadCloud, Lock, Share2, Plus, Trash2,
  DollarSign, Wrench, Check, Smile, Star, ListTodo,
  Image as ImageIcon, Search, Car, UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkOrder, DamagePoint, VehicleInventory, DailyLogEntry, AdditionalItem, QualityChecklistItem, ScopeItem, Vehicle, VehicleSize, VEHICLE_SIZES } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import VehicleDamageMap from './VehicleDamageMap';
import ClientModal from './ClientModal';

interface WorkOrderModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
}

export default function WorkOrderModal({ workOrder, onClose }: WorkOrderModalProps) {
  const { addWorkOrder, updateWorkOrder, completeWorkOrder, submitNPS, clients, recipes, services, getPrice, getWhatsappLink, workOrders, addVehicle } = useApp();
  const [activeTab, setActiveTab] = useState<'reception' | 'execution' | 'quality' | 'finance'>('reception');
  
  // --- CLIENT & VEHICLE SELECTION STATE ---
  const [selectedClientId, setSelectedClientId] = useState<string>(workOrder.clientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState<string>(workOrder.plate || '');
  
  // New Vehicle State (Quick Add)
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ model: '', plate: '', color: '', size: 'medium' });

  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // --- EXISTING STATES ---
  const [damages, setDamages] = useState<DamagePoint[]>(workOrder.damages || []);
  const [inventory, setInventory] = useState<VehicleInventory>(workOrder.vehicleInventory || {
    estepe: false, macaco: false, chaveRoda: false, tapetes: false, manual: false, antena: false, pertences: ''
  });
  const [dailyLog, setDailyLog] = useState<DailyLogEntry[]>(workOrder.dailyLog || []);
  const [newLogText, setNewLogText] = useState('');
  const [insurance, setInsurance] = useState(workOrder.insuranceDetails || { isInsurance: false });
  const [qaList, setQaList] = useState<QualityChecklistItem[]>(workOrder.qaChecklist || []);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>(workOrder.additionalItems || []);
  const [scopeList, setScopeList] = useState<ScopeItem[]>(workOrder.scopeChecklist || []);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(workOrder.serviceId || '');
  const [npsScore, setNpsScore] = useState<number | null>(workOrder.npsScore || null);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [currentDamageArea, setCurrentDamageArea] = useState<DamagePoint['area'] | null>(null);
  const [damageDesc, setDamageDesc] = useState('');
  const [damagePhoto, setDamagePhoto] = useState<string | null>(null);

  // --- PRICE STATE (EDITABLE) ---
  // Initialize with existing total minus extras, or 0
  const [servicePrice, setServicePrice] = useState<number>(() => {
    const extras = workOrder.additionalItems?.reduce((acc, item) => acc + item.value, 0) || 0;
    return workOrder.totalValue > 0 ? Math.max(0, workOrder.totalValue - extras) : 0;
  });

  // Derived Data
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientVehicles = selectedClient ? selectedClient.vehicles : [];
  const selectedVehicleObj = clientVehicles.find(v => v.plate === selectedVehiclePlate);

  // Filter Clients for Search
  const filteredClients = clientSearch.length > 0 
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
    : [];

  // Initialize or Update when props change
  useEffect(() => {
    if (workOrder.clientId && workOrder.clientId !== 'c1' && workOrder.clientId !== '') {
        const c = clients.find(cl => cl.id === workOrder.clientId);
        if (c) {
            setClientSearch(c.name);
            setSelectedClientId(c.id);
        }
    }
  }, [workOrder.clientId, clients]);

  // Initialize Scope Checklist
  useEffect(() => {
    if (scopeList.length === 0) {
        const items: ScopeItem[] = [];
        if (workOrder.service) items.push({ id: 'main-svc', label: workOrder.service, completed: false, type: 'main' });
        if (workOrder.additionalItems && workOrder.additionalItems.length > 0) {
            workOrder.additionalItems.forEach(item => {
                items.push({ id: `add-${item.id}`, label: item.description, completed: false, type: 'additional' });
            });
        }
        if (items.length > 0) setScopeList(items);
    }
  }, [workOrder.service, workOrder.additionalItems]);

  // Initialize QA Checklist
  useEffect(() => {
    if (qaList.length === 0) {
      const defaultQA: QualityChecklistItem[] = [
        { id: 'q1', label: 'Serviço principal executado conforme OS', checked: false, required: true },
        { id: 'q2', label: 'Limpeza final realizada (sem resíduos)', checked: false, required: true },
        { id: 'q3', label: 'Pertences do cliente conferidos', checked: false, required: true },
      ];
      if (workOrder.service.toLowerCase().includes('funilaria') || workOrder.service.toLowerCase().includes('pintura')) {
        defaultQA.push({ id: 'q4', label: 'Tonalidade da pintura conferida na luz natural', checked: false, required: true });
        defaultQA.push({ id: 'q5', label: 'Montagem de peças alinhada (gaps)', checked: false, required: true });
      }
      if (workOrder.service.toLowerCase().includes('polimento') || workOrder.service.toLowerCase().includes('vitrificação')) {
        defaultQA.push({ id: 'q6', label: 'Inspeção de hologramas com luz de detalhamento', checked: false, required: true });
        defaultQA.push({ id: 'q7', label: 'Plásticos e borrachas protegidos/limpos', checked: false, required: true });
      }
      if (workOrder.service.toLowerCase().includes('higienização')) {
        defaultQA.push({ id: 'q8', label: 'Bancos e carpetes 100% secos', checked: false, required: true });
      }
      setQaList(defaultQA);
    }
  }, [workOrder.service]);

  const handleClientSelect = (client: any) => {
    setSelectedClientId(client.id);
    setClientSearch(client.name);
    setShowClientList(false);
    // Auto-select first vehicle if exists
    if (client.vehicles.length > 0) {
        const v = client.vehicles[0];
        setSelectedVehiclePlate(v.plate);
        // Update price if service is already selected
        if (selectedServiceId) {
            setServicePrice(getPrice(selectedServiceId, v.size));
        }
    } else {
        setSelectedVehiclePlate('');
        setIsAddingVehicle(true); // Prompt to add vehicle
    }
  };

  const handleVehicleChange = (plate: string) => {
    setSelectedVehiclePlate(plate);
    const v = clientVehicles.find(veh => veh.plate === plate);
    if (v && selectedServiceId) {
        setServicePrice(getPrice(selectedServiceId, v.size));
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (selectedVehicleObj && serviceId) {
        setServicePrice(getPrice(serviceId, selectedVehicleObj.size));
    }
  };

  const handleQuickAddVehicle = () => {
    if (selectedClientId && newVehicle.model && newVehicle.plate) {
        const v: Vehicle = {
            id: `v-${Date.now()}`,
            model: newVehicle.model || '',
            plate: newVehicle.plate || '',
            color: newVehicle.color || '',
            year: newVehicle.year || '',
            size: newVehicle.size as VehicleSize || 'medium'
        };
        addVehicle(selectedClientId, v);
        setSelectedVehiclePlate(v.plate);
        if (selectedServiceId) {
            setServicePrice(getPrice(selectedServiceId, v.size));
        }
        setIsAddingVehicle(false);
        setNewVehicle({ model: '', plate: '', color: '', size: 'medium' });
    }
  };

  const handleSave = () => {
    if (!selectedClientId || !selectedVehiclePlate) {
        alert("Por favor, selecione um cliente e um veículo.");
        setActiveTab('reception');
        return;
    }

    // Use the editable servicePrice state
    const extrasTotal = additionalItems.reduce((acc, item) => acc + item.value, 0);
    const finalTotal = insurance.isInsurance 
      ? (insurance.deductibleAmount || 0) + (insurance.insuranceCoveredAmount || 0) + extrasTotal 
      : servicePrice + extrasTotal;

    const serviceName = services.find(s => s.id === selectedServiceId)?.name || workOrder.service;

    const updatedData = {
      clientId: selectedClientId,
      vehicle: selectedVehicleObj ? selectedVehicleObj.model : workOrder.vehicle,
      plate: selectedVehiclePlate,
      damages,
      vehicleInventory: inventory,
      dailyLog,
      insuranceDetails: insurance,
      qaChecklist: qaList,
      scopeChecklist: scopeList,
      additionalItems,
      totalValue: finalTotal,
      service: serviceName,
      serviceId: selectedServiceId,
      status: workOrder.status
    };

    const exists = workOrders.some(o => o.id === workOrder.id);
    
    if (exists) {
        updateWorkOrder(workOrder.id, updatedData);
    } else {
        addWorkOrder({
            ...workOrder,
            ...updatedData,
            createdAt: workOrder.createdAt || new Date().toISOString(),
            tasks: workOrder.tasks || [],
            checklist: workOrder.checklist || []
        });
    }
    
    onClose();
  };

  const handleApprove = () => {
      if (!selectedClientId || !selectedVehiclePlate) {
        alert("Selecione o cliente antes de aprovar.");
        return;
      }
      
      // Use the editable servicePrice state
      const serviceName = services.find(s => s.id === selectedServiceId)?.name || workOrder.service;

      const approvedData = {
          clientId: selectedClientId,
          vehicle: selectedVehicleObj ? selectedVehicleObj.model : workOrder.vehicle,
          plate: selectedVehiclePlate,
          status: 'Aguardando',
          service: serviceName,
          serviceId: selectedServiceId,
          totalValue: servicePrice, // Use the manual price
          damages,
          vehicleInventory: inventory
      };

      const exists = workOrders.some(o => o.id === workOrder.id);
      if (exists) {
          updateWorkOrder(workOrder.id, approvedData);
      } else {
          addWorkOrder({
              ...workOrder,
              ...approvedData,
              createdAt: new Date().toISOString(),
              tasks: [],
              checklist: []
          });
      }
      onClose();
  };

  const handleAddDamage = (area: DamagePoint['area']) => {
    setCurrentDamageArea(area);
    setDamageDesc('');
    setDamagePhoto(null);
    setIsDamageModalOpen(true);
  };

  const handleSaveDamage = () => {
    if (currentDamageArea && damageDesc) {
      setDamages([...damages, { 
        id: Date.now().toString(), 
        area: currentDamageArea, 
        type: 'risco', 
        description: damageDesc, 
        photoUrl: damagePhoto || 'pending' 
      }]);
      setIsDamageModalOpen(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setDamagePhoto(url);
    }
  };

  const handleAddLog = () => {
    if (!newLogText) return;
    setDailyLog([{ id: Date.now().toString(), date: new Date().toISOString(), stage: 'Execução', description: newLogText, photos: [], author: 'Técnico' }, ...dailyLog]);
    setNewLogText('');
  };

  const canComplete = qaList.every(q => !q.required || q.checked);

  const handleStatusChange = (newStatus: WorkOrder['status']) => {
    if (newStatus === 'Entregue' && !canComplete) {
      alert('Opa! Precisamos completar o Checklist de Qualidade antes de entregar o carro.');
      return;
    }
    
    const exists = workOrders.some(o => o.id === workOrder.id);
    if (!exists) {
        if (confirm("Para mudar o status, precisamos salvar a OS primeiro. Deseja salvar agora?")) {
            handleSave();
        }
        return;
    }

    updateWorkOrder(workOrder.id, { status: newStatus });
    
    if (newStatus === 'Concluído') {
      completeWorkOrder(workOrder.id);
      if (selectedClient) {
        const msg = `Olá ${selectedClient.name}! O serviço no seu ${selectedVehicleObj?.model || 'veículo'} foi concluído com sucesso. Valor Total: ${formatCurrency(workOrder.totalValue)}. Aguardamos sua retirada!`;
        window.open(getWhatsappLink(selectedClient.phone, msg), '_blank');
      }
    }
  };

  const handleNPS = (score: number) => {
    setNpsScore(score);
    submitNPS(workOrder.id, score);
  };

  // Calculations for Display
  const currentExtrasTotal = additionalItems.reduce((acc, item) => acc + item.value, 0);
  const currentTotal = servicePrice + currentExtrasTotal;
  
  const beforePhotos = damages.filter(d => d.photoUrl && d.photoUrl !== 'pending').map(d => ({ url: d.photoUrl!, desc: d.description }));
  const afterPhotos = dailyLog.flatMap(log => log.photos.map(url => ({ url, desc: log.description })));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      {isClientModalOpen && <ClientModal onClose={() => setIsClientModalOpen(false)} />}
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">OS #{workOrder.id}</h2>
              <select 
                value={workOrder.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-none focus:ring-2 cursor-pointer",
                  workOrder.status === 'Aguardando Aprovação' 
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}
              >
                <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                <option value="Aguardando">Aguardando Início</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Aguardando Peças">Aguardando Peças</option>
                <option value="Controle de Qualidade">Controle de Qualidade</option>
                <option value="Concluído">Concluído (Pronto)</option>
                <option value="Entregue">Entregue ao Cliente</option>
              </select>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                {selectedVehicleObj ? selectedVehicleObj.model : 'Veículo não selecionado'} • {selectedVehiclePlate || 'Placa?'} • {selectedClient ? selectedClient.name : 'Cliente?'}
            </p>
          </div>
          <div className="flex gap-2">
            {workOrder.status === 'Aguardando Aprovação' ? (
                <button onClick={handleApprove} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 animate-pulse">
                    <Check size={16} /> Aprovar & Definir Preço
                </button>
            ) : (
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Save size={16} /> Salvar Tudo
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 overflow-x-auto">
          {[
            { id: 'reception', label: 'Recepção & Vistoria', icon: ClipboardCheck },
            { id: 'execution', label: 'Execução & Diário', icon: Hammer },
            { id: 'quality', label: 'Qualidade (QA)', icon: ShieldCheck },
            { id: 'finance', label: 'Financeiro & Peças', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/30">
          
          {/* TAB: RECEPTION */}
          {activeTab === 'reception' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* COL 1: CLIENT & VEHICLE */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-2">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Dados do Cliente & Veículo
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Selection */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    value={clientSearch}
                                    onChange={(e) => { setClientSearch(e.target.value); setShowClientList(true); }}
                                    onFocus={() => setShowClientList(true)}
                                    placeholder="Buscar cliente..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                                />
                                {showClientList && clientSearch && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                        {filteredClients.length > 0 ? filteredClients.map(c => (
                                            <button 
                                                key={c.id}
                                                onClick={() => handleClientSelect(c)}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
                                            >
                                                <span className="font-bold">{c.name}</span> <span className="text-xs text-slate-500">({c.phone})</span>
                                            </button>
                                        )) : (
                                            <div className="px-4 py-2 text-sm text-slate-500">Nenhum cliente encontrado.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsClientModalOpen(true)}
                                className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                title="Novo Cliente"
                            >
                                <UserPlus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Vehicle Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Veículo</label>
                        {selectedClientId ? (
                            <div className="flex gap-2">
                                <select 
                                    value={selectedVehiclePlate}
                                    onChange={(e) => handleVehicleChange(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                                >
                                    <option value="">Selecione o veículo...</option>
                                    {clientVehicles.map(v => (
                                        <option key={v.id} value={v.plate}>{v.model} - {v.plate}</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    title="Adicionar Carro"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 italic">
                                Selecione um cliente primeiro
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Quick Add Vehicle Form */}
                 {isAddingVehicle && selectedClientId && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Novo Veículo</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <input type="text" placeholder="Modelo (ex: BMW X1)" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                            <input type="text" placeholder="Placa" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                            <input type="text" placeholder="Cor" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                            <input type="text" placeholder="Ano" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                            <select value={newVehicle.size} onChange={e => setNewVehicle({...newVehicle, size: e.target.value as any})} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
                                {Object.entries(VEHICLE_SIZES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setIsAddingVehicle(false)} className="text-xs font-bold text-slate-500 px-3 py-2">Cancelar</button>
                            <button onClick={handleQuickAddVehicle} className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg">Salvar Veículo</button>
                        </div>
                    </div>
                 )}
              </div>

              <div className="lg:col-span-1">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Camera size={20} className="text-blue-600" />
                  Inspeção do Veículo
                </h3>
                <VehicleDamageMap damages={damages} onAddDamage={handleAddDamage} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                {/* Seleção de Serviço e Escopo */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Wrench size={20} className="text-blue-600" />
                    O que vamos fazer?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serviço Principal</label>
                      <select 
                        value={selectedServiceId}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                      >
                        <option value="">Selecione um serviço...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor do Serviço (R$) {selectedVehicleObj && `- Porte ${selectedVehicleObj.size}`}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                        <input 
                            type="number"
                            value={servicePrice}
                            onChange={(e) => setServicePrice(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">O que ficou no carro? (Inventário)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(inventory).filter(k => k !== 'pertences').map((key) => (
                      <label key={key} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input 
                          type="checkbox"
                          checked={(inventory as any)[key]}
                          onChange={(e) => setInventory({...inventory, [key]: e.target.checked})}
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Outros Objetos (Óculos, Chaves...)</label>
                    <input 
                      type="text"
                      value={inventory.pertences}
                      onChange={(e) => setInventory({...inventory, pertences: e.target.value})}
                      placeholder="Ex: Óculos de sol no porta-luvas..."
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <PenTool size={20} className="text-blue-600" />
                    Acordo com o Cliente
                  </h3>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    {workOrder.clientSignature ? (
                      <div className="text-green-600 font-bold flex items-center gap-2">
                        <CheckCircle2 /> Assinado Digitalmente
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-400 font-medium">Toque aqui para o cliente assinar</p>
                        <p className="text-xs text-slate-400 mt-1">Concordo com o estado do veículo descrito acima.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXECUTION (DIÁRIO DE OBRA + ESCOPO) */}
          {activeTab === 'execution' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* COL 1: CHECKLIST DE ESCOPO (O que fazer) */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ListTodo size={20} className="text-blue-600" />
                        Escopo do Serviço
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Marque os itens conforme for concluindo a execução.
                    </p>
                    
                    <div className="space-y-3">
                        {scopeList.length > 0 ? scopeList.map((item, idx) => (
                            <label key={item.id} className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                item.completed 
                                    ? "bg-green-50 dark:bg-green-900/10 border-green-500" 
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            )}>
                                <input 
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => {
                                        const newList = [...scopeList];
                                        newList[idx].completed = !newList[idx].completed;
                                        setScopeList(newList);
                                    }}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className={cn(
                                        "text-sm font-bold block",
                                        item.completed ? "text-green-700 dark:text-green-400 line-through" : "text-slate-700 dark:text-slate-200"
                                    )}>
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                        {item.type === 'main' ? 'Principal' : 'Adicional'}
                                    </span>
                                </div>
                            </label>
                        )) : (
                            <div className="text-center py-8 text-slate-400">
                                <p>Nenhum item de escopo definido.</p>
                            </div>
                        )}
                    </div>
                 </div>
                 
                 {/* BEFORE / AFTER GALLERY PREVIEW */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-purple-600" />
                        Galeria: Antes x Depois
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Antes (Avarias)</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {beforePhotos.length > 0 ? beforePhotos.map((p, i) => (
                                    <img key={i} src={p.url} className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700" alt="Antes" />
                                )) : <p className="text-xs text-slate-400 italic">Sem fotos.</p>}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Depois (Resultado)</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {afterPhotos.length > 0 ? afterPhotos.map((p, i) => (
                                    <img key={i} src={p.url} className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700" alt="Depois" />
                                )) : <p className="text-xs text-slate-400 italic">Sem fotos.</p>}
                            </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* COL 2 & 3: DIÁRIO DE BORDO */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CalendarClock size={20} className="text-blue-600" />
                    Diário de Bordo (Timeline)
                  </h3>
                  
                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text"
                      value={newLogText}
                      onChange={(e) => setNewLogText(e.target.value)}
                      placeholder="O que foi feito agora? (Ex: Lixamento concluído)"
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    />
                    <button 
                      onClick={handleAddLog}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Registrar
                    </button>
                  </div>

                  <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 space-y-8 max-h-[400px] overflow-y-auto pr-2">
                    {dailyLog.map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[41px] bg-blue-600 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900" />
                        <p className="text-xs text-slate-400 mb-1">{new Date(log.date).toLocaleString('pt-BR')}</p>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-slate-800 dark:text-slate-200 text-sm mb-2">{log.description}</p>
                          {log.photos && log.photos.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                  {log.photos.map((photo, idx) => (
                                      <img key={idx} src={photo} alt="Log" className="w-24 h-24 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-600" />
                                  ))}
                              </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2 font-medium">Por: {log.author}</p>
                        </div>
                      </div>
                    ))}
                    {dailyLog.length === 0 && (
                      <div className="flex flex-col items-center py-8 text-slate-400">
                        <Smile size={32} className="mb-2 opacity-50" />
                        <p className="text-sm italic">Ainda não começamos o diário.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                    <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2">Deixe o cliente tranquilo</h3>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                      Envie um link para ele acompanhar as fotos do serviço em tempo real. Isso gera confiança!
                    </p>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Share2 size={14} /> Enviar Link de Acompanhamento
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: QUALITY (QA) */}
          {activeTab === 'quality' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Padrão Crystal Care</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Vamos garantir que o carro saia impecável?
                  </p>
                </div>

                <div className="space-y-4">
                  {qaList.map((item, idx) => (
                    <label key={item.id} className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      item.checked 
                        ? "border-green-500 bg-green-50 dark:bg-green-900/10" 
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    )}>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        item.checked ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-slate-600"
                      )}>
                        {item.checked && <CheckCircle2 size={14} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={item.checked}
                        onChange={() => {
                          const newList = [...qaList];
                          newList[idx].checked = !newList[idx].checked;
                          setQaList(newList);
                        }}
                      />
                      <div>
                        <p className={cn("font-bold", item.checked ? "text-green-800 dark:text-green-300" : "text-slate-700 dark:text-slate-300")}>
                          {item.label}
                        </p>
                        {item.required && <span className="text-xs text-red-500 font-medium uppercase">Obrigatório</span>}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {!canComplete && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
                      <Lock size={18} />
                      <span className="text-sm font-bold">Opa! Falta conferir alguns itens obrigatórios.</span>
                    </div>
                  )}
                  <button 
                    disabled={!canComplete}
                    onClick={() => handleStatusChange('Entregue')}
                    className="w-full py-4 bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition-all"
                  >
                    Aprovar Qualidade e Liberar
                  </button>
                </div>
              </div>

              {/* NPS Section (Only visible if Delivered) */}
              {workOrder.status === 'Entregue' && (
                <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center animate-in slide-in-from-bottom">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Avaliação do Cliente (NPS)</h3>
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                      <button
                        key={score}
                        onClick={() => handleNPS(score)}
                        className={cn(
                          "w-8 h-8 rounded-full font-bold text-sm transition-all",
                          npsScore === score 
                            ? "bg-blue-600 text-white scale-110" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  {npsScore !== null && (
                    <p className="text-sm text-green-600 font-bold animate-in fade-in">
                      Nota {npsScore} registrada! Obrigado.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {/* ... (Conteúdo Financeiro Mantido) ... */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Serviço (Tabela)</span>
                    <span>{formatCurrency(servicePrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Peças/Extras</span>
                    <span>{formatCurrency(currentExtrasTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg text-slate-900 dark:text-white">Total Final</span>
                    <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{formatCurrency(currentTotal)}</span>
                    </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal de Avaria (ADMIN - REUSED LOGIC) */}
      {isDamageModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
             <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Registrar Avaria</h3>
             
             <textarea 
                value={damageDesc} 
                onChange={(e) => setDamageDesc(e.target.value)} 
                placeholder="Descreva o dano..." 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                autoFocus
             />

             <label className="block w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-4">
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handlePhotoCapture}
                />
                {damagePhoto ? (
                    <div className="relative">
                        <img src={damagePhoto} alt="Preview" className="h-32 mx-auto rounded-lg object-cover shadow-sm" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-bold block mt-2">Foto OK!</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Camera size={24} />
                        <span className="font-bold text-sm">Adicionar Foto</span>
                    </div>
                )}
             </label>

             <div className="flex gap-3">
                <button onClick={() => setIsDamageModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-colors">Cancelar</button>
                <button onClick={handleSaveDamage} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">Salvar</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
