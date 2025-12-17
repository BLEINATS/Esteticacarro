import React, { useState, useRef } from 'react';
import { 
  Camera, Search, CheckCircle2, ChevronRight, 
  ArrowLeft, Save, Smile, MapPin, X, ImagePlus,
  Wrench, LogOut, Clock, Play, Pause, CheckSquare, 
  DollarSign, Box, FileText, ShieldCheck, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn, formatCurrency } from '../lib/utils';
import VehicleDamageMap from '../components/VehicleDamageMap';
import { DamagePoint, WorkOrder, VehicleInventory } from '../types';
import TechLogin from '../components/TechLogin';
import WorkOrderModal from '../components/WorkOrderModal';

export default function TechPortal() {
  const { 
    clients, services, addWorkOrder, currentUser, logout, 
    workOrders, startTask, stopTask 
  } = useApp();
  
  // Flow State
  const [view, setView] = useState<'menu' | 'new_os' | 'tasks'>('menu');
  
  // New OS State
  const [step, setStep] = useState<'search' | 'inspection' | 'inventory' | 'service' | 'success'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [damages, setDamages] = useState<DamagePoint[]>([]);
  
  // Multi-Service State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  
  // Inventory State
  const [inventory, setInventory] = useState<VehicleInventory>({
    estepe: false, macaco: false, chaveRoda: false, tapetes: false, manual: false, antena: false, pertences: ''
  });

  const [techNotes, setTechNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Editing Existing OS
  const [selectedOSForModal, setSelectedOSForModal] = useState<WorkOrder | null>(null);

  // Damage Modal State
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [currentDamageArea, setCurrentDamageArea] = useState<DamagePoint['area'] | null>(null);
  const [damageDesc, setDamageDesc] = useState('');
  const [damagePhoto, setDamagePhoto] = useState<string | null>(null);

  // Se não estiver logado, mostra tela de login
  if (!currentUser) {
    return <TechLogin />;
  }

  // --- LOGIC FOR NEW OS ---
  const filteredClients = searchTerm.length > 2 
    ? clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.vehicles.some(v => v.plate.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleClientSelect = (client: any, vehicle: any) => {
    setSelectedClient(client);
    setSelectedVehicle(vehicle);
    setStep('inspection');
  };

  const handleMapClick = (area: DamagePoint['area']) => {
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

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicle || selectedServiceIds.length === 0) return;
    
    setIsSubmitting(true);

    // Combine service names
    const selectedServicesList = services.filter(s => selectedServiceIds.includes(s.id));
    const serviceNameCombined = selectedServicesList.map(s => s.name).join(' + ');
    
    const newOS: WorkOrder = {
      id: `OS-${Math.floor(Math.random() * 10000)}`,
      clientId: selectedClient.id,
      vehicle: selectedVehicle.model,
      plate: selectedVehicle.plate,
      service: serviceNameCombined,
      serviceId: selectedServiceIds[0], // Primary service ID for reference
      serviceIds: selectedServiceIds, // Store all IDs
      status: 'Aguardando Aprovação',
      technician: currentUser.name,
      deadline: 'A definir',
      priority: 'medium',
      totalValue: 0, // Admin defines price
      damages: damages,
      vehicleInventory: { ...inventory, pertences: techNotes },
      dailyLog: [],
      qaChecklist: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      checklist: []
    };

    const success = await addWorkOrder(newOS);
    setIsSubmitting(false);

    if (success) {
        setStep('success');
    } else {
        alert("Erro ao salvar OS. Verifique sua conexão e tente novamente.");
    }
  };

  const reset = () => {
    setStep('search');
    setSearchTerm('');
    setSelectedClient(null);
    setSelectedVehicle(null);
    setDamages([]);
    setSelectedServiceIds([]);
    setInventory({ estepe: false, macaco: false, chaveRoda: false, tapetes: false, manual: false, antena: false, pertences: '' });
    setTechNotes('');
    setView('menu');
  };

  // --- MY TASKS LOGIC ---
  const activeWorkOrders = workOrders.filter(os => 
    os.status !== 'Concluído' && os.status !== 'Entregue' && os.status !== 'Cancelado'
  );

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 min-h-screen sm:min-h-[85vh] sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative">
      
      {/* Modal Completo de OS (Reutilizado) */}
      {selectedOSForModal && (
        <WorkOrderModal 
          workOrder={selectedOSForModal} 
          onClose={() => setSelectedOSForModal(null)} 
        />
      )}

      {/* Header Mobile-First */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          {view !== 'menu' && (
            <button onClick={() => setView('menu')} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft size={22} />
            </button>
          )}
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              {currentUser.name.split(' ')[0]} <Wrench size={16} className="opacity-70" />
            </h1>
            <p className="text-xs text-blue-100 opacity-90">Portal do Técnico</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {/* MENU VIEW */}
      {view === 'menu' && (
        <div className="flex-1 p-6 flex flex-col gap-4 animate-in slide-in-from-left">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-2">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Saldo de Comissões</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(currentUser.balance)}</p>
          </div>

          <button 
            onClick={() => setView('new_os')}
            className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
              <Camera size={32} />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Nova Vistoria (Entrada)</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 text-center">Chegou carro novo? Registre avarias, inventário e serviços.</span>
          </button>

          <button 
            onClick={() => setView('tasks')}
            className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group relative"
          >
            {activeWorkOrders.length > 0 && (
              <span className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {activeWorkOrders.length} Ativas
              </span>
            )}
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <CheckSquare size={32} />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Execução & Diário</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 text-center">Atualizar status, fotos do processo e checklist de qualidade.</span>
          </button>
        </div>
      )}

      {/* TASKS VIEW (EXECUTION) */}
      {view === 'tasks' && (
        <div className="flex-1 p-5 overflow-y-auto bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-right">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pátio de Serviços</h2>
          
          <div className="space-y-4">
            {activeWorkOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Smile size={48} className="mx-auto mb-3 opacity-50" />
                <p>Tudo limpo por aqui! Nenhum carro no pátio.</p>
              </div>
            ) : (
              activeWorkOrders.map(os => (
                <div key={os.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{os.vehicle}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{os.plate}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded",
                      os.status === 'Aguardando Aprovação' ? "bg-purple-100 text-purple-700" :
                      os.status === 'Concluído' ? "bg-green-100 text-green-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {os.status}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">{os.service}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Botão Principal: Abrir Detalhes (Modal) */}
                    <button 
                      onClick={() => setSelectedOSForModal(os)}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <FileText size={18} /> Abrir OS Completa
                    </button>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1"><ShieldCheck size={12} /> QA: {os.qaChecklist?.filter(q => q.checked).length || 0}/{os.qaChecklist?.length || 0}</span>
                    <span>Técnico: {os.technician}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* NEW OS VIEW (WIZARD) */}
      {view === 'new_os' && (
        <div className="flex-1 p-5 overflow-y-auto bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-right">
          
          {/* Step 1: Search */}
          {step === 'search' && (
            <div className="space-y-6">
               <div className="relative group">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite a PLACA..."
                  className="w-full pl-4 pr-4 py-4 text-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-center font-bold uppercase tracking-widest shadow-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600"
                  autoFocus
                />
              </div>
              <div className="space-y-3">
              {filteredClients.map(client => (
                client.vehicles.map(vehicle => (
                  <button 
                    key={vehicle.id}
                    onClick={() => handleClientSelect(client, vehicle)}
                    className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-blue-500 transition-all text-left"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{vehicle.plate}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{vehicle.model}</p>
                    </div>
                    <ChevronRight className="text-slate-300" />
                  </button>
                ))
              ))}
            </div>
            </div>
          )}
          
          {/* Step 2: Inspection */}
          {step === 'inspection' && (
            <div className="space-y-4">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-bold">1. Marque as avarias no mapa</p>
               </div>
               <VehicleDamageMap damages={damages} onAddDamage={handleMapClick} />
               <button onClick={() => setStep('inventory')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20">
                 Próximo: Inventário
               </button>
            </div>
          )}

          {/* Step 3: Inventory */}
          {step === 'inventory' && (
            <div className="space-y-6">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-bold">2. O que ficou no carro?</p>
               </div>
               
               <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(inventory).filter(k => k !== 'pertences').map((key) => (
                      <label key={key} className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                        (inventory as any)[key] 
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" 
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}>
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações / Pertences</label>
                    <textarea 
                      value={techNotes}
                      onChange={(e) => setTechNotes(e.target.value)}
                      placeholder="Ex: Óculos Rayban no porta-luvas, Cadeira de bebê..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                      rows={3}
                    />
                  </div>
               </div>

               <div className="flex gap-3">
                 <button onClick={() => setStep('inspection')} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Voltar</button>
                 <button onClick={() => setStep('service')} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20">
                   Próximo: Serviços
                 </button>
               </div>
            </div>
          )}

          {/* Step 4: Service Selection (Multi) */}
          {step === 'service' && (
             <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-bold">3. O que vamos fazer? (Multi-seleção)</p>
               </div>

                {services.map(service => (
                <label key={service.id} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all", selectedServiceIds.includes(service.id) ? "border-blue-600 bg-white dark:bg-slate-900 shadow-md" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900")}>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={selectedServiceIds.includes(service.id)} 
                    onChange={() => toggleService(service.id)} 
                  />
                  <div className={cn("w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors", selectedServiceIds.includes(service.id) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-600")}>
                    {selectedServiceIds.includes(service.id) && <CheckSquare size={14} />}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 dark:text-white block">{service.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{service.category}</span>
                  </div>
                </label>
              ))}
              
              <div className="flex gap-3 pt-4">
                 <button onClick={() => setStep('inventory')} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Voltar</button>
                 <button 
                    onClick={handleSubmit} 
                    disabled={selectedServiceIds.length === 0 || isSubmitting} 
                    className="flex-[2] py-4 bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                 >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Vistoria'}
                 </button>
              </div>
             </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="text-center py-10">
              <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sucesso!</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">A OS foi criada e enviada para aprovação.</p>
              <button onClick={reset} className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">Voltar ao Menu</button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Avaria (FIXED DARK MODE & CAMERA) */}
      {isDamageModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full sm:w-[90%] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Registrar Avaria</h3>
                <button onClick={() => setIsDamageModalOpen(false)} className="p-1 text-slate-400"><X size={20} /></button>
             </div>
             
             <textarea 
                value={damageDesc} 
                onChange={(e) => setDamageDesc(e.target.value)} 
                placeholder="Descreva o dano (ex: Risco profundo, amassado...)" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                rows={3}
             />

             {/* Camera Input */}
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
                        <div className="flex items-center justify-center gap-2 mt-2 text-green-600 dark:text-green-400 font-bold text-sm">
                            <CheckCircle2 size={16} /> Foto Anexada
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                            <Camera size={24} />
                        </div>
                        <span className="font-bold text-sm">Tirar Foto da Avaria</span>
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
