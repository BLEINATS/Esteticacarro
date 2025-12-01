import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Save, FileText, Car, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { cn } from '../lib/utils';

interface ClientModalProps {
  onClose: () => void;
}

interface VehicleForm {
  brand: string;
  model: string;
  plate: string;
  color: string;
  year: string;
}

export default function ClientModal({ onClose }: ClientModalProps) {
  const { addClient, addWorkOrder } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  
  const [vehicles, setVehicles] = useState<VehicleForm[]>([]);
  const [newVehicle, setNewVehicle] = useState<VehicleForm>({
    brand: '',
    model: '',
    plate: '',
    color: '',
    year: new Date().getFullYear().toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newClient: Client = {
      id: `c-${Date.now()}`,
      ...formData
    };

    addClient(newClient);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof VehicleForm) => {
    setNewVehicle(prev => ({ ...prev, [field]: e.target.value }));
  };

  const addVehicle = () => {
    if (newVehicle.brand && newVehicle.model && newVehicle.plate) {
      setVehicles(prev => [...prev, { ...newVehicle }]);
      setNewVehicle({
        brand: '',
        model: '',
        plate: '',
        color: '',
        year: new Date().getFullYear().toString()
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Cliente</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cadastre os dados para contato e histórico.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="space-y-4">
            {/* DADOS DO CLIENTE */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <User size={16} />
                Dados do Cliente
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
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
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

              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Endereço (Opcional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Rua, Número, Bairro..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                  />
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

            {/* CARROS DO CLIENTE */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Car size={16} />
                Veículos ({vehicles.length})
              </h3>

              {/* Lista de carros adicionados */}
              <div className="space-y-2 mb-4">
                {vehicles.map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{vehicle.plate} • {vehicle.color} • {vehicle.year}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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

                <button
                  type="button"
                  onClick={addVehicle}
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
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Salvar Cliente
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
