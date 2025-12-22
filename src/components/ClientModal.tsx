import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Save, FileText, Car, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, Vehicle, VEHICLE_SIZES, VehicleSize } from '../types';
import { cn } from '../lib/utils';
import { useDialog } from '../context/DialogContext';

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
}

interface VehicleForm {
  brand: string;
  model: string;
  plate: string;
  color: string;
  year: string;
  size: VehicleSize;
}

export default function ClientModal({ client, onClose }: ClientModalProps) {
  const { addClient, updateClient, addVehicle } = useApp();
  const { showAlert } = useDialog();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    // Address fields
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    
    notes: ''
  });
  
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleForm[]>([]);
  const [newVehicle, setNewVehicle] = useState<VehicleForm>({
    brand: '',
    model: '',
    plate: '',
    color: '',
    year: new Date().getFullYear().toString(),
    size: 'medium'
  });

  useEffect(() => {
    if (client) {
        setFormData({
            name: client.name,
            phone: client.phone,
            email: client.email || '',
            cep: client.cep || '',
            street: client.street || '',
            number: client.number || '',
            neighborhood: client.neighborhood || '',
            city: client.city || '',
            state: client.state || '',
            notes: client.notes || ''
        });
    }
  }, [client]);

  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
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

  // Máscara de CEP: 00000-000
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Busca endereço se tiver 8 dígitos (antes de aplicar máscara final se estiver digitando)
    if (value.length === 8) {
        fetchAddress(value);
    }

    // Aplica máscara visual
    value = value.replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
    
    setFormData(prev => ({ ...prev, cep: value }));
  };

  // Máscara de Telefone: (00) 00000-0000
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    value = value
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);

    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Format full address string
    const fullAddress = `${formData.street}, ${formData.number} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, ${formData.cep}`;

    const clientData = {
        ...formData,
        address: fullAddress
    };

    try {
        if (client) {
            // Edit Mode
            await updateClient(client.id, clientData);
            await showAlert({ title: 'Sucesso', message: 'Cliente atualizado!', type: 'success' });
        } else {
            // Create Mode
            const newClient = await addClient({
                ...clientData,
                ltv: 0,
                visitCount: 0,
                status: 'active',
                segment: 'new'
            });

            if (!newClient) {
                throw new Error("Erro ao criar cliente. Verifique sua conexão ou tente recarregar a página.");
            }

            // Add vehicles if any were added in the form AND we have a valid client ID
            if (newClient && newClient.id && vehicles.length > 0) {
                for (const v of vehicles) {
                    await addVehicle(newClient.id, {
                        model: `${v.brand} ${v.model}`,
                        plate: v.plate,
                        color: v.color,
                        year: v.year,
                        size: v.size
                    });
                }
            }
            await showAlert({ title: 'Sucesso', message: 'Cliente e veículos cadastrados com sucesso!', type: 'success' });
        }
        onClose();
    } catch (error: any) {
        console.error("Error saving client:", error);
        await showAlert({ 
            title: 'Erro ao Salvar', 
            message: error.message || 'Não foi possível salvar os dados. Tente novamente.', 
            type: 'error' 
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof VehicleForm) => {
    setNewVehicle(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleAddVehicleToList = () => {
    if (newVehicle.brand && newVehicle.model && newVehicle.plate) {
      setVehicles(prev => [...prev, { ...newVehicle }]);
      setNewVehicle({
        brand: '',
        model: '',
        plate: '',
        color: '',
        year: new Date().getFullYear().toString(),
        size: 'medium'
      });
    }
  };

  const removeVehicle = (index: number) => {
    setVehicles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {client ? 'Atualize os dados de contato.' : 'Cadastre os dados para contato e histórico.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="space-y-4">
            {/* DADOS DO CLIENTE */}
            <div className={cn("pb-4", !client && "border-b border-slate-200 dark:border-slate-700")}>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <User size={16} />
                Dados Pessoais
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: João da Silva"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="cliente@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* ENDEREÇO COMPLETO */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <MapPin size={16} />
                    Endereço
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CEP</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="cep"
                                value={formData.cep}
                                onChange={handleCepChange}
                                placeholder="00000-000"
                                maxLength={9}
                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                            />
                            {isLoadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={16} />}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Rua / Logradouro</label>
                        <input 
                            type="text" 
                            name="street"
                            value={formData.street}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Número</label>
                        <input 
                            type="text" 
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Bairro</label>
                        <input 
                            type="text" 
                            name="neighborhood"
                            value={formData.neighborhood}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cidade</label>
                        <input 
                            type="text" 
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">UF</label>
                        <input 
                            type="text" 
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            maxLength={2}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 uppercase"
                        />
                    </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Observações Internas</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Ex: Cliente exigente com limpeza interna..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* CARROS DO CLIENTE (Apenas na criação) */}
            {!client && (
                <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Car size={16} />
                    Veículos ({vehicles.length})
                </h3>

                {/* Lista de carros adicionados */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                    {vehicles.map((vehicle, index) => (
                    <div key={index} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Car size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{vehicle.brand} {vehicle.model}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                            {vehicle.plate}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                            {VEHICLE_SIZES[vehicle.size]?.split(' ')[0]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeVehicle(index)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remover"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Cor</p>
                                <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{vehicle.color}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Ano</p>
                                <p className="text-xs font-semibold text-slate-900 dark:text-white">{vehicle.year}</p>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Formulário para adicionar novo carro */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Marca</label>
                        <input 
                        type="text" 
                        value={newVehicle.brand}
                        onChange={(e) => handleVehicleChange(e, 'brand')}
                        placeholder="Ex: Toyota"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Modelo</label>
                        <input 
                        type="text" 
                        value={newVehicle.model}
                        onChange={(e) => handleVehicleChange(e, 'model')}
                        placeholder="Ex: Corolla"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white text-sm"
                        />
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Placa</label>
                        <input 
                        type="text" 
                        value={newVehicle.plate}
                        onChange={(e) => handleVehicleChange(e, 'plate')}
                        placeholder="ABC-1234"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white text-sm uppercase"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cor</label>
                        <input 
                        type="text" 
                        value={newVehicle.color}
                        onChange={(e) => handleVehicleChange(e, 'color')}
                        placeholder="Ex: Branco"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white text-sm"
                        />
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ano</label>
                            <input 
                                type="number" 
                                value={newVehicle.year}
                                onChange={(e) => handleVehicleChange(e, 'year')}
                                placeholder="2024"
                                min="1990"
                                max={new Date().getFullYear() + 1}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tamanho</label>
                            <select
                                value={newVehicle.size}
                                onChange={(e) => handleVehicleChange(e, 'size')}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white text-sm"
                            >
                                {Object.entries(VEHICLE_SIZES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                    type="button"
                    onClick={handleAddVehicleToList}
                    disabled={!newVehicle.brand || !newVehicle.model || !newVehicle.plate}
                    className={cn(
                        "w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors",
                        newVehicle.brand && newVehicle.model && newVehicle.plate
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    )}
                    >
                    <Plus size={16} />
                    Adicionar Veículo
                    </button>
                </div>
                </div>
            )}
            
            {client && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <p>Para gerenciar os veículos deste cliente, acesse a tela de detalhes.</p>
                </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
