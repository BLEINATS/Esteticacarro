import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, MapPin, Calendar, Car, 
  History, TrendingUp, MessageCircle, Plus, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, Vehicle, VEHICLE_SIZES, VehicleSize } from '../types';
import { cn, formatCurrency } from '../lib/utils';

interface ClientDetailsModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientDetailsModal({ client, onClose }: ClientDetailsModalProps) {
  const { workOrders, reminders, addVehicle } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'history' | 'crm'>('overview');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ model: '', plate: '', color: '', year: '', size: 'medium' });

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-600/20">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{client.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold uppercase",
                  client.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  client.status === 'churn_risk' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}>
                  {client.status === 'active' ? 'Cliente Ativo' : client.status === 'churn_risk' ? 'Risco de Churn' : 'Inativo'}
                </span>
                <span className="text-slate-400 text-sm">•</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                  <Calendar size={14} /> Última visita: {new Date(client.lastVisit).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
          {[
            { id: 'overview', label: 'Visão Geral', icon: User },
            { id: 'vehicles', label: 'Garagem (Veículos)', icon: Car },
            { id: 'history', label: 'Histórico de Serviços', icon: History },
            { id: 'crm', label: 'CRM & Retenção', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors",
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Dados de Contato</h3>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Phone size={18} className="text-slate-400" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Mail size={18} className="text-slate-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin size={18} className="text-slate-400" />
                  <span>{client.address || 'Endereço não cadastrado'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Métricas de Valor (LTV)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Gasto</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(client.ltv)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Ticket Médio</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {clientWorkOrders.length > 0 
                        ? formatCurrency(client.ltv / clientWorkOrders.length) 
                        : 'R$ 0,00'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Notas Internas</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    {client.notes || 'Nenhuma observação.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VEHICLES */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Veículos Cadastrados</h3>
                <button 
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={16} /> Adicionar Veículo
                </button>
              </div>

              {showAddVehicle && (
                <form onSubmit={handleAddVehicle} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                    <input 
                      type="text" placeholder="Modelo" required
                      value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                    <input 
                      type="text" placeholder="Placa" required
                      value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                    <input 
                      type="text" placeholder="Cor"
                      value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                    <input 
                      type="text" placeholder="Ano"
                      value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    />
                    <select
                      value={newVehicle.size}
                      onChange={e => setNewVehicle({...newVehicle, size: e.target.value as VehicleSize})}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                    >
                      {Object.entries(VEHICLE_SIZES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddVehicle(false)} className="text-xs font-bold text-slate-500 px-3 py-2">Cancelar</button>
                    <button type="submit" className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg">Salvar</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.vehicles.length > 0 ? client.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Car size={24} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{vehicle.model}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{vehicle.plate} • {vehicle.color}</p>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                        {VEHICLE_SIZES[vehicle.size]}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-8 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    Nenhum veículo cadastrado.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Histórico de Serviços</h3>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(os.createdAt || '').toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{os.service}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{os.vehicle}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white">{formatCurrency(os.totalValue)}</td>
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
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">Nenhum serviço encontrado.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CRM / RETENTION */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl text-white shadow-lg">
                <h3 className="font-bold text-lg mb-2">Gestão de Ciclo de Vida</h3>
                <p className="text-blue-100 text-sm">
                  O sistema monitora automaticamente serviços que requerem manutenção (como Vitrificação e Polimento) 
                  e gera alertas para você contatar o cliente, garantindo a recorrência.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-amber-500" />
                  Lembretes de Manutenção Ativos
                </h3>
                
                <div className="space-y-3">
                  {clientReminders.length > 0 ? clientReminders.map((reminder) => (
                    <div key={reminder.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">{reminder.serviceType}</span>
                          {new Date(reminder.dueDate) < new Date() && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Vencido</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Vencimento: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(reminder.dueDate).toLocaleDateString('pt-BR')}</span>
                        </p>
                      </div>
                      
                      <a 
                        href={`https://wa.me/55${client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(generateReminderMessage(reminder))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        <MessageCircle size={18} />
                        Enviar Lembrete WhatsApp
                      </a>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      Nenhum lembrete de manutenção pendente para este cliente.
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
