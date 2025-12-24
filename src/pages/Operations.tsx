import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Filter, Plus, Clock, 
  MoreHorizontal, Car,
  UserPlus, AlertCircle, CheckCircle2, 
  Hammer, ShieldCheck, PackageX, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn, formatId, generateUUID } from '../lib/utils';
import { useApp } from '../context/AppContext';
import WorkOrderModal from '../components/WorkOrderModal';
import ClientModal from '../components/ClientModal';
import { WorkOrder } from '../types';
import { useLocation } from 'react-router-dom';

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
  const { workOrders, clients, updateWorkOrder } = useApp();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Drag and Drop State
  const [draggedOSId, setDraggedOSId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Scroll Refs & State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Handle navigation from Global Search
  useEffect(() => {
    if (location.state && (location.state as any).selectedOrderId) {
      const orderId = (location.state as any).selectedOrderId;
      const os = workOrders.find(o => o.id === orderId);
      if (os) {
        setSelectedOS(os);
      }
    }
  }, [location.state, workOrders]);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente Desconhecido';

  const sortedWorkOrders = [...workOrders].sort((a, b) => {
    if (a.status === 'Aguardando Aprovação' && b.status !== 'Aguardando Aprovação') return -1;
    if (a.status !== 'Aguardando Aprovação' && b.status === 'Aguardando Aprovação') return 1;
    return 0;
  });

  const kanbanColumns = [
    { id: 'approval', title: 'Aprovação', statuses: ['Aguardando Aprovação'], color: 'purple', borderColor: 'border-purple-500', bgColor: 'bg-purple-50/50 dark:bg-purple-900/10', icon: AlertCircle, targetStatus: 'Aguardando Aprovação' },
    { id: 'queue', title: 'Fila de Espera', statuses: ['Aguardando'], color: 'amber', borderColor: 'border-amber-500', bgColor: 'bg-amber-50/50 dark:bg-amber-900/10', icon: Clock, targetStatus: 'Aguardando' },
    { id: 'execution', title: 'Em Execução', statuses: ['Em Andamento', 'Aguardando Peças'], color: 'blue', borderColor: 'border-blue-500', bgColor: 'bg-blue-50/50 dark:bg-blue-900/10', icon: Hammer, targetStatus: 'Em Andamento' },
    { id: 'qa', title: 'Qualidade (QA)', statuses: ['Controle de Qualidade'], color: 'indigo', borderColor: 'border-indigo-500', bgColor: 'bg-indigo-50/50 dark:bg-indigo-900/10', icon: ShieldCheck, targetStatus: 'Controle de Qualidade' },
    { id: 'done', title: 'Pronto / Entregue', statuses: ['Concluído', 'Entregue'], color: 'green', borderColor: 'border-green-500', bgColor: 'bg-green-50/50 dark:bg-green-900/10', icon: CheckCircle2, targetStatus: 'Concluído' }
  ];

  // --- SCROLL LOGIC ---
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [viewMode]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Drag to Scroll Handlers (Container)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    // Only drag scroll if not dragging a card
    if (draggedOSId) return;
    
    setIsDraggingScroll(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // --- DRAG AND DROP HANDLERS (CARDS) ---
  const handleDragStart = (e: React.DragEvent, osId: string) => {
    setDraggedOSId(osId);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent drag image or custom if needed, default is fine
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
        setDragOverColumn(columnId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: WorkOrder['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedOSId) {
        // Update Status
        await updateWorkOrder(draggedOSId, { status: targetStatus });
        setDraggedOSId(null);
    }
  };

  return (
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
                    id: generateUUID(),
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
                    checklist: [],
                    tasks: []
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:w-5 sm:h-5" size={18} />
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
        <div className="flex-1 overflow-hidden flex flex-col relative group/kanban">
          
          {/* Scroll Buttons (Desktop Only) */}
          {showLeftArrow && (
            <button 
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform opacity-0 group-hover/kanban:opacity-100 duration-300"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          
          {showRightArrow && (
            <button 
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform opacity-0 group-hover/kanban:opacity-100 duration-300"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            className={cn(
              "overflow-x-auto pb-4 flex-1 scrollbar-hide cursor-grab active:cursor-grabbing",
              isDraggingScroll ? "select-none" : ""
            )}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onScroll={checkScroll}
          >
            <div className="flex gap-3 min-w-min px-2 sm:px-4 h-full">
              {kanbanColumns.map((column) => {
                const columnWorkOrders = workOrders.filter(os => column.statuses.includes(os.status));
                const Icon = column.icon;
                const isOver = dragOverColumn === column.id;
                
                return (
                  <div 
                    key={column.id} 
                    className="flex-shrink-0 w-72 sm:w-80 flex flex-col h-full"
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDrop={(e) => handleDrop(e, column.targetStatus as any)}
                  >
                    {/* Column Header */}
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-3 rounded-t-xl border-t-4 bg-white dark:bg-slate-900 shadow-sm transition-colors",
                      column.borderColor,
                      isOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    )}>
                      <Icon size={18} className="flex-shrink-0 text-slate-500 dark:text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{column.title}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{columnWorkOrders.length} OS</p>
                      </div>
                    </div>

                    {/* Cards Container */}
                    <div className={cn(
                        "flex-1 overflow-y-auto space-y-2 p-2 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800/50 transition-colors", 
                        column.bgColor,
                        isOver ? "ring-2 ring-inset ring-blue-500 bg-white/50 dark:bg-slate-800/50" : ""
                    )}>
                      {columnWorkOrders.length > 0 ? (
                        columnWorkOrders.map((os) => (
                          <div
                            key={os.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, os.id)}
                            onClick={() => !isDraggingScroll && setSelectedOS(os)}
                            className={cn(
                                "bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all select-none group",
                                draggedOSId === os.id ? "opacity-50 border-dashed border-blue-500" : ""
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{os.vehicle}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{formatId(os.id)}</p>
                              </div>
                              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                                R$ {os.totalValue.toFixed(0)}
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2 min-h-[2.5em]">{os.service}</p>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                                    {os.technician.charAt(0)}
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{os.technician}</span>
                              </div>
                              {os.deadline && (
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
                                    os.deadline.toLowerCase().includes('hoje') ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    <Clock size={10} /> {os.deadline.split(' ')[0]}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs text-center opacity-60">
                          <div className="p-2 bg-white/50 dark:bg-black/20 rounded-full mb-2">
                             <column.icon size={20} />
                          </div>
                          Arraste para cá
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
