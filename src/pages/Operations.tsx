import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Clock, 
  MoreHorizontal, Car,
  UserPlus, AlertCircle, CheckCircle2, 
  Hammer, ShieldCheck, PackageX
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import WorkOrderModal from '../components/WorkOrderModal';
import ClientModal from '../components/ClientModal';
import { WorkOrder } from '../types';

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    'Aguardando Aprovação': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 animate-pulse',
    'Em Andamento': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Aguardando Peças': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-bold',
    'Aguardando': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'Controle de Qualidade': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'Concluído': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Entregue': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 line-through',
    'Cancelado': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", styles)}>
      {status}
    </span>
  );
};

export default function Operations() {
  const { workOrders, clients } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to Kanban for showcase
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente Desconhecido';

  // Sort: Pending Approval first
  const sortedWorkOrders = [...workOrders].sort((a, b) => {
    if (a.status === 'Aguardando Aprovação' && b.status !== 'Aguardando Aprovação') return -1;
    if (a.status !== 'Aguardando Aprovação' && b.status === 'Aguardando Aprovação') return 1;
    return 0;
  });

  // Kanban Configuration
  const kanbanColumns = [
    {
      id: 'approval',
      title: 'Aprovação',
      statuses: ['Aguardando Aprovação'],
      color: 'purple',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50/50 dark:bg-purple-900/10',
      icon: AlertCircle
    },
    {
      id: 'queue',
      title: 'Fila de Espera',
      statuses: ['Aguardando'],
      color: 'amber',
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-50/50 dark:bg-amber-900/10',
      icon: Clock
    },
    {
      id: 'execution',
      title: 'Em Execução',
      statuses: ['Em Andamento', 'Aguardando Peças'],
      color: 'blue',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
      icon: Hammer
    },
    {
      id: 'qa',
      title: 'Qualidade (QA)',
      statuses: ['Controle de Qualidade'],
      color: 'indigo',
      borderColor: 'border-indigo-500',
      bgColor: 'bg-indigo-50/50 dark:bg-indigo-900/10',
      icon: ShieldCheck
    },
    {
      id: 'done',
      title: 'Pronto / Entregue',
      statuses: ['Concluído', 'Entregue'],
      color: 'green',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50/50 dark:bg-green-900/10',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {selectedOS && (
        <WorkOrderModal 
          workOrder={selectedOS} 
          onClose={() => setSelectedOS(null)} 
        />
      )}

      {isClientModalOpen && (
        <ClientModal 
          onClose={() => setIsClientModalOpen(false)} 
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Operações</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie o fluxo de trabalho da oficina.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors", 
                viewMode === 'list' 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors", 
                viewMode === 'kanban' 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Kanban
            </button>
          </div>
          <button 
            onClick={() => {
                const newOS: WorkOrder = {
                    id: `OS-${Math.floor(Math.random() * 10000)}`,
                    clientId: 'c1',
                    vehicle: 'Veículo Novo',
                    plate: 'AAA-0000',
                    service: 'A Definir',
                    status: 'Aguardando',
                    technician: 'A Definir',
                    deadline: 'A Definir',
                    priority: 'medium',
                    totalValue: 0,
                    damages: [],
                    vehicleInventory: { estepe: false, macaco: false, chaveRoda: false, tapetes: false, manual: false, antena: false, pertences: '' },
                    dailyLog: [],
                    qaChecklist: [],
                    createdAt: new Date().toISOString(),
                    checklist: []
                };
                setSelectedOS(newOS);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus size={18} />
            Nova OS
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 transition-colors flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, placa ou OS..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsClientModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <UserPlus size={18} />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">OS / Veículo</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Serviço</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Técnico</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Prazo</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedWorkOrders.map((os) => (
                  <tr 
                    key={os.id} 
                    className={cn(
                        "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer",
                        os.status === 'Aguardando Aprovação' ? "bg-purple-50/50 dark:bg-purple-900/10" : ""
                    )}
                    onClick={() => setSelectedOS(os)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                          <Car size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{os.vehicle}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">#{os.id} • {getClientName(os.clientId)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{os.service}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={os.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {os.technician.charAt(0)}
                        </div>
                        <span className="text-slate-600 dark:text-slate-300">{os.technician}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Clock size={16} />
                        <span>{os.deadline}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {os.status === 'Aguardando Aprovação' ? (
                        <button className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 shadow-sm">
                            Aprovar
                        </button>
                      ) : (
                        <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban View (ENHANCED) */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-6 h-full min-w-[1200px] px-1">
            {kanbanColumns.map((col, index) => {
              const columnItems = workOrders.filter(o => col.statuses.includes(o.status));
              
              return (
                <div 
                  key={col.id} 
                  className={cn(
                    "flex flex-col rounded-xl min-w-[280px] w-full max-w-xs border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
                    col.bgColor,
                    col.borderColor,
                    "border-t-4 border-x border-b border-slate-200 dark:border-slate-800"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Column Header */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-md",
                        `text-${col.color}-600 dark:text-${col.color}-400 bg-white dark:bg-slate-800`
                      )}>
                        <col.icon size={16} />
                      </div>
                      <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{col.title}</h3>
                    </div>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
                      {columnItems.length}
                    </span>
                  </div>

                  {/* Column Content */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    {columnItems.map(os => (
                      <div 
                        key={os.id} 
                        onClick={() => setSelectedOS(os)}
                        className={cn(
                            "bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group relative overflow-hidden",
                            os.status === 'Aguardando Aprovação' ? "ring-1 ring-purple-500" : "",
                            os.status === 'Aguardando Peças' ? "border-l-4 border-l-orange-500" : ""
                        )}
                      >
                        {/* Status Indicator Bar */}
                        <div className={cn("absolute top-0 left-0 w-1 h-full", `bg-${col.color}-500`)} />

                        <div className="flex justify-between items-start mb-2 pl-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">#{os.id}</span>
                          {os.status === 'Aguardando Peças' && (
                             <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                               <PackageX size={10} /> Peças
                             </div>
                          )}
                        </div>
                        
                        <div className="pl-2">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-0.5 truncate">{os.vehicle}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{os.service}</p>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                {os.technician.charAt(0)}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{os.technician.split(' ')[0]}</span>
                            </div>
                            {os.deadline !== 'A Definir' && (
                                <span className={cn(
                                    "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                    os.deadline.includes('Ontem') || os.deadline.includes('Atrasado') 
                                        ? "text-red-600 bg-red-50 dark:bg-red-900/20" 
                                        : "text-slate-400 bg-slate-50 dark:bg-slate-800"
                                )}>
                                    {os.deadline}
                                </span>
                            )}
                            </div>
                        </div>
                      </div>
                    ))}
                    {columnItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 min-h-[100px]">
                            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800/50 mb-2">
                                <col.icon size={20} />
                            </div>
                            <span className="text-xs font-medium">Vazio</span>
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
