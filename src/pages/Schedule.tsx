import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
  addDays,
  subDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Clock, 
  Car,
  Wrench,
  LayoutGrid,
  Info,
  Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn, formatId, generateUUID } from '../lib/utils';
import WorkOrderModal from '../components/WorkOrderModal';
import { WorkOrder } from '../types';

export default function Schedule() {
  const { workOrders, clients, reminders } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  
  const [showScheduleHelp, setShowScheduleHelp] = useState(false);

  const next = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const prev = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  let startDate, endDate;

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  } else {
    startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
  }

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventDate = (os: WorkOrder): Date => {
    if (os.deadline) {
      const lower = os.deadline.toLowerCase();
      const today = new Date();
      
      if (lower.includes('hoje')) return today;
      if (lower.includes('amanhã') || lower.includes('amanha')) return addDays(today, 1);
      if (lower.includes('ontem')) return subDays(today, 1);
      
      if (lower.match(/\d{1,2}\/\d{1,2}/)) {
         const parts = lower.split('/'); 
         const day = parseInt(parts[0]);
         const month = parseInt(parts[1]) - 1; 
         const year = parts.length > 2 ? parseInt(parts[2]) : today.getFullYear();
         const date = new Date(year, month, day);
         if (!isNaN(date.getTime())) return date;
      }
    }
    return parseISO(os.createdAt);
  };

  const getVisualEvents = (date: Date) => {
      const osEvents = workOrders.filter(os => {
          const eventDate = getEventDate(os);
          return isSameDay(eventDate, date);
      }).map(os => ({ type: 'os', data: os }));

      const reminderEvents = reminders.filter(r => {
          return isSameDay(parseISO(r.dueDate), date) && r.status === 'pending';
      }).map(r => ({ type: 'reminder', data: r }));

      return [...osEvents, ...reminderEvents];
  };

  const selectedDayEvents = getVisualEvents(selectedDate);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getHeaderTitle = () => {
    if (viewMode === 'week') {
      return `Semana de ${format(startDate, "d 'de' MMM", { locale: ptBR })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  };

  const handleNewAppointment = () => {
    setShowScheduleHelp(false);
    let deadlineStr = format(selectedDate, "dd/MM", { locale: ptBR });
    if (isToday(selectedDate)) deadlineStr = "Hoje";
    else if (isSameDay(selectedDate, addDays(new Date(), 1))) deadlineStr = "Amanhã";

    const newOS: WorkOrder = {
        id: generateUUID(),
        clientId: '',
        vehicle: 'Veículo Novo',
        plate: '',
        service: 'A Definir',
        status: 'Aguardando',
        technician: 'A Definir',
        deadline: deadlineStr,
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
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Aguardando Aprovação': return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case 'Concluído': return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case 'Entregue': return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
      case 'Aguardando': return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case 'Cancelado': return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case 'Em Andamento': return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 h-auto md:h-full flex flex-col animate-in fade-in duration-500">
      {selectedOS && (
        <WorkOrderModal 
          workOrder={selectedOS} 
          onClose={() => setSelectedOS(null)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Planejamento de serviços e retornos.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex overflow-x-auto max-w-full">
                    <button 
                    onClick={() => setViewMode('week')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap", 
                        viewMode === 'week' 
                        ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                    >
                    <LayoutGrid size={16} /> <span className="hidden sm:inline">Semana</span>
                    </button>
                    <button 
                    onClick={() => setViewMode('month')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap", 
                        viewMode === 'month' 
                        ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                    >
                    <CalendarIcon size={16} /> <span className="hidden sm:inline">Mês</span>
                    </button>
                    <button 
                    onClick={() => setViewMode('list')}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap", 
                        viewMode === 'list' 
                        ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                    >
                    <List size={16} /> <span className="hidden sm:inline">Lista</span>
                    </button>
                </div>
                
                <button 
                    onClick={handleNewAppointment}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Agendar</span>
                </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Calendar Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden order-2 lg:order-1">
          
          {/* Toolbar */}
          <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2 truncate">
              {getHeaderTitle()}
            </h3>
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={prev} className="p-1.5 md:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={goToToday} className="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400 px-2 md:px-3 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors">
                Hoje
              </button>
              <button onClick={next} className="p-1.5 md:p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Grid View (Week or Month) */}
          {(viewMode === 'month' || viewMode === 'week') && (
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <div className="min-w-[700px] lg:min-w-full h-full flex flex-col"> 
                
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                  {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 dark:bg-slate-800 gap-px border-b border-slate-200 dark:border-slate-800">
                  {calendarDays.map((day) => {
                    const events = getVisualEvents(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);

                    return (
                      <div 
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "p-1 md:p-2 transition-colors cursor-pointer relative flex flex-col gap-1",
                          (viewMode === 'week' || isCurrentMonth) ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-950",
                          isSelected && "ring-2 ring-inset ring-blue-500 z-10",
                          !isSelected && (viewMode === 'week' || isCurrentMonth) && "hover:bg-slate-50 dark:hover:bg-slate-800",
                          viewMode === 'week' ? "min-h-[200px] md:min-h-[300px]" : "min-h-[80px] md:min-h-[110px]"
                        )}
                      >
                        <div className="flex justify-between items-start">
                            <span className={cn(
                            "text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full",
                            isTodayDate 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" 
                                : (viewMode === 'week' || isCurrentMonth) ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"
                            )}>
                            {format(day, 'd')}
                            </span>
                            {events.length > 0 && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded-full">
                                    {events.length}
                                </span>
                            )}
                        </div>

                        {/* Event Pills */}
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-hide mt-1">
                          {events.map((ev: any, idx) => {
                            if (ev.type === 'os') {
                                const os = ev.data as WorkOrder;
                                return (
                                    <div 
                                    key={os.id} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOS(os);
                                    }}
                                    className={cn(
                                        "text-[10px] md:text-[11px] px-1.5 py-1 md:px-2 md:py-1.5 rounded-md font-medium flex flex-col gap-0.5 border shadow-sm transition-all hover:scale-[1.02]",
                                        os.status === 'Concluído' ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800" :
                                        os.status === 'Aguardando' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800" :
                                        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                    )}
                                    title={`${os.vehicle} - ${os.service}`}
                                    >
                                    <div className="flex items-center gap-1">
                                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", 
                                            os.status === 'Concluído' ? "bg-green-500" : 
                                            os.status === 'Aguardando' ? "bg-amber-500" : "bg-blue-500"
                                        )} />
                                        <span className="font-bold truncate">{os.vehicle}</span>
                                    </div>
                                    <span className="opacity-80 truncate pl-2.5 hidden md:block">{os.service}</span>
                                    </div>
                                );
                            } else {
                                const rem = ev.data;
                                return (
                                    <div 
                                        key={rem.id}
                                        className="text-[10px] md:text-[11px] px-1.5 py-1 md:px-2 md:py-1.5 rounded-md font-medium flex flex-col gap-0.5 border shadow-sm bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                                    >
                                        <div className="flex items-center gap-1">
                                            <Bell size={10} />
                                            <span className="font-bold truncate">Lembrete</span>
                                        </div>
                                        <span className="opacity-80 truncate pl-2.5 hidden md:block">{rem.serviceType}</span>
                                    </div>
                                );
                            }
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {calendarDays.map(day => {
                    const events = getVisualEvents(day);
                    if (events.length === 0) return null;
                    
                    return (
                        <div key={day.toString()} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <h4 className={cn(
                                "text-sm font-bold px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2",
                                isToday(day) ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                            )}>
                                <CalendarIcon size={14} />
                                {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </h4>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {events.map((ev: any) => {
                                    if (ev.type === 'os') {
                                        const os = ev.data as WorkOrder;
                                        return (
                                            <div key={os.id} onClick={() => setSelectedOS(os)} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                                <div className="text-center min-w-[50px]">
                                                    <span className="block text-xs font-bold text-slate-400">{os.deadline?.split(',')[1] || '08:00'}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">{os.vehicle}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                                        <Wrench size={12} /> {os.service}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap",
                                                    os.status === 'Concluído' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : 
                                                    os.status === 'Aguardando' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                )}>
                                                    {os.status}
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        const rem = ev.data;
                                        return (
                                            <div key={rem.id} className="flex items-center gap-4 p-4 bg-purple-50/30 dark:bg-purple-900/10">
                                                <div className="text-center min-w-[50px]">
                                                    <Bell size={16} className="mx-auto text-purple-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">Lembrete de Retorno</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{rem.serviceType}</p>
                                                </div>
                                                <button className="text-xs font-bold text-purple-600 hover:underline">Agendar</button>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-shrink-0 h-auto max-h-[300px] lg:max-h-none lg:h-auto order-1 lg:order-2">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-t-xl">
            <h3 className="font-bold text-slate-900 dark:text-white capitalize">
              {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={12} /> {selectedDayEvents.length} eventos
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedDayEvents.length > 0 ? selectedDayEvents.map((ev: any) => {
                if (ev.type === 'os') {
                    const os = ev.data as WorkOrder;
                    return (
                        <div 
                            key={os.id} 
                            onClick={() => setSelectedOS(os)}
                            className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all group hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900"
                        >
                            <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                {os.deadline?.split(',')[1] || 'Dia todo'}
                            </span>
                            
                            {/* STATUS BADGE (Replaces Dot) */}
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide",
                                getStatusStyle(os.status)
                            )}>
                                {os.status}
                            </span>
                            </div>
                            
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors truncate">
                            {os.vehicle}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1 line-clamp-1">
                                <Wrench size={10} /> {os.service}
                            </p>
                            
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                            <Car size={12} />
                            <span className="truncate max-w-[80px]">{os.plate}</span>
                            <span className="mx-1">•</span>
                            <span className="truncate">{clients.find(c => c.id === os.clientId)?.name.split(' ')[0]}</span>
                            </div>
                        </div>
                    );
                } else {
                    const rem = ev.data;
                    return (
                        <div key={rem.id} className="p-3 rounded-lg border border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Bell size={14} className="text-purple-500" />
                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Lembrete de Retorno</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{rem.serviceType}</p>
                            <button className="mt-2 w-full py-1 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 text-xs font-bold rounded border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                                Criar Agendamento
                            </button>
                        </div>
                    );
                }
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                    <CalendarIcon size={24} className="opacity-50" />
                </div>
                <p className="text-sm font-medium">Agenda livre.</p>
                <p className="text-xs opacity-70 mt-1">Nenhum serviço para este dia.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
