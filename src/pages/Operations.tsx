import React, { useState, useRef } from 'react';
import { 
  Search, Filter, Plus, Clock, 
  MoreHorizontal, Car,
  UserPlus, AlertCircle, CheckCircle2, 
  Hammer, ShieldCheck, PackageX
} from 'lucide-react';
import { cn, formatId } from '../lib/utils';
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente Desconhecido';

  const sortedWorkOrders = [...workOrders].sort((a, b) => {
    if (a.status === 'Aguardando Aprovação' && b.status !== 'Aguardando Aprovação') return -1;
    if (a.status !== 'Aguardando Aprovação' && b.status === 'Aguardando Aprovação') return 1;
    return 0;
  });

  const kanbanColumns = [
    { id: 'approval', title: 'Aprovação', statuses: ['Aguardando Aprovação'], color: 'purple', borderColor: 'border-purple-500', bgColor: 'bg-purple-50/50 dark:bg-purple-900/10', icon: AlertCircle },
    { id: 'queue', title: 'Fila de Espera', statuses: ['Aguardando'], color: 'amber', borderColor: 'border-amber-500', bgColor: 'bg-amber-50/50 dark:bg-amber-900/10', icon: Clock },
    { id: 'execution', title: 'Em Execução', statuses: ['Em Andamento', 'Aguardando Peças'], color: 'blue', borderColor: 'border-blue-500', bgColor: 'bg-blue-50/50 dark:bg-blue-900/10', icon: Hammer },
    { id: 'qa', title: 'Qualidade (QA)', statuses: ['Controle de Qualidade'], color: 'indigo', borderColor: 'border-indigo-500', bgColor: 'bg-indigo-50/50 dark:bg-indigo-900/10', icon: ShieldCheck },
    { id: 'done', title: 'Pronto / Entregue', statuses: ['Concluído', 'Entregue'], color: 'green', borderColor: 'border-green-500', bgColor: 'bg-green-50/50 dark:bg-green-900/10', icon: CheckCircle2 }
  ];

  return (
    // FIX: Use h-auto on mobile to allow scrolling the page, h-full on desktop for internal scrolling
    <div className="space-y-6 h-auto md:h-full flex flex-col">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Operações</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Gerencie o fluxo de trabalho da oficina.</p>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 sm:p-1 flex">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors", 
                viewMode === 'list' 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span className="hidden sm:inline">Lista</span>
              <span className="sm:hidden">L</span>
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors", 
                viewMode === 'kanban' 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span className="hidden sm:inline">Kanban</span>
              <span className="sm:hidden">K</span>
            </button>
          </div>
          <button 
            onClick={() => {
                const newOS: WorkOrder = {
                    id: `OS-${Math.floor(Math.random() * 10000)}`,
                    clientId: '',
                    vehicle: 'Veículo Novo',
                    plate: '',
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
            className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Nova OS</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 sm:flex-row sm:gap-4 transition-colors flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} className="sm:w-5 sm:h-5" />
          <input 
            type="text" 
            placeholder="Buscar OS..." 
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm transition-colors"
          />
        </div>
        <button 
          onClick={() => setIsClientModalOpen(true)}
          className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <UserPlus size={14} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors flex-1 overflow-y-auto">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">OS / Veículo</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Serviço</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Técnico</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Prazo</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-right text-xs sm:text-sm">Ações</th>
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
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 sm:p-2 rounded-lg text-blue-600 dark:text-blue-400">
                          <Car size={16} className="sm:w-[20px] sm:h-[20px]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm truncate">{os.vehicle}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{formatId(os.id)} • {getClientName(os.clientId)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-300 text-xs sm:text-sm truncate">{os.service}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <StatusBadge status={os.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                          {os.technician.charAt(0)}
                        </div>
                        <span className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm truncate">{os.technician}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                        <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{os.deadline}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      {os.status === 'Aguardando Aprovação' ? (
                        <button className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 shadow-sm whitespace-nowrap">
                            Aprovar
                        </button>
                      ) : (
                        <button className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                            <MoreHorizontal size={16} className="sm:w-[20px] sm:h-[20px]" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2 p-3">
            {sortedWorkOrders.map((os) => (
              <div
                key={os.id}
                onClick={() => setSelectedOS(os)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  os.status === 'Aguardando Aprovação'
                    ? "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Car size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{os.vehicle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatId(os.id)}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{os.service}</p>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StatusBadge status={os.status} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{getClientName(os.clientId)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {os.technician.charAt(0)}
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 truncate">{os.technician}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <Clock size={12} />
                    <span>{os.deadline}</span>
                  </div>
                </div>
                {os.status === 'Aguardando Aprovação' && (
                  <button className="w-full mt-2 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 shadow-sm">
                    Aprovar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban View (RESPONSIVE) */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto pb-2 flex-1">
            <div className="flex gap-2 min-w-min px-2 sm:px-4 h-full">
              {kanbanColumns.map((column) => {
                const columnWorkOrders = workOrders.filter(os => column.statuses.includes(os.status));
                const Icon = column.icon;
                
                return (
                  <div key={column.id} className="flex-shrink-0 w-64 sm:w-72 lg:w-80 flex flex-col">
                    {/* Column Header */}
                    <div className={cn(
                      "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 rounded-t-lg border-t-4 bg-white dark:bg-slate-900",
                      column.borderColor
                    )}>
                      <Icon size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{column.title}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{columnWorkOrders.length} OS</p>
                      </div>
                    </div>

                    {/* Cards Container */}
                    <div className={cn("flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 p-2", column.bgColor)}>
                      {columnWorkOrders.length > 0 ? (
                        columnWorkOrders.map((os) => (
                          <div
                            key={os.id}
                            onClick={() => setSelectedOS(os)}
                            className="bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all select-none"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{os.vehicle}</p>
                                <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">{formatId(os.id)}</p>
                                <p className="text-[9px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{os.service}</p>
                              </div>
                              <div className="text-[9px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 text-right whitespace-nowrap">
                                R$ {os.totalValue.toFixed(0)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                              <span className="text-[8px] sm:text-[9px] text-slate-600 dark:text-slate-400 truncate">{getClientName(os.clientId)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-24 sm:h-32 text-slate-400 text-[10px] sm:text-xs text-center px-2">
                          Nenhuma OS nesta etapa
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
