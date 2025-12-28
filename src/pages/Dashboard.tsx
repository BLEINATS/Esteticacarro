import React, { useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Plus,
  Users,
  Star,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  Car,
  BrainCircuit,
  Lightbulb,
  X,
  Clock,
  UserMinus,
  BarChart3,
  Trophy,
  Crown,
  Wallet,
  TrendingDown,
  Hammer,
  PauseCircle,
  ShieldCheck,
  MessageSquare,
  Quote,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { formatCurrency, cn, formatId, generateUUID } from '../lib/utils';
import { useApp } from '../context/AppContext';
import WorkOrderModal from '../components/WorkOrderModal';
import ClientDetailsModal from '../components/ClientDetailsModal';
import { WorkOrder, Client, SystemAlert } from '../types';
import { useNavigate } from 'react-router-dom';
import { isSameDay, isSameMonth, isSameWeek, isValid, differenceInDays, addDays, subDays } from 'date-fns';
import { LicensePlate } from '../components/ui/LicensePlate';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const { theme, workOrders, clients, inventory, financialTransactions, employees, services } = useApp();
  const isDark = theme === 'dark';
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const navigate = useNavigate();
  
  const yardScrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // --- REAL-TIME INTELLIGENCE GENERATOR ---
  const realTimeAlerts = useMemo(() => {
    const alerts: SystemAlert[] = [];

    // 1. CHURN RISK (Real Data)
    // Clients active but no visit in > 60 days
    const churnClients = clients.filter(c => {
        if (c.status === 'inactive') return false;
        if (!c.lastVisit) return false;
        const days = differenceInDays(today, new Date(c.lastVisit));
        return days > 60;
    });

    if (churnClients.length > 0) {
        const potentialLoss = churnClients.reduce((acc, c) => {
            const avgTicket = c.visitCount > 0 ? (c.ltv / c.visitCount) : 0;
            return acc + avgTicket;
        }, 0);

        alerts.push({
            id: 'gen-churn',
            type: 'cliente',
            message: `Risco de Churn: ${churnClients.length} clientes não retornam há mais de 60 dias.`,
            level: 'critico',
            resolved: false,
            createdAt: new Date().toISOString(),
            financialImpact: potentialLoss,
            actionLabel: 'Recuperar Clientes',
            actionLink: '/marketing'
        });
    }

    // 2. CRITICAL STOCK (Real Data)
    const criticalItems = inventory.filter(i => i.stock <= i.minStock);
    if (criticalItems.length > 0) {
        const topItem = criticalItems[0];
        const otherCount = criticalItems.length - 1;
        const message = otherCount > 0 
            ? `Estoque Crítico: ${topItem.name} e mais ${otherCount} itens abaixo do mínimo.`
            : `Estoque Crítico: ${topItem.name} está acabando (${topItem.stock} ${topItem.unit}).`;

        alerts.push({
            id: 'gen-stock',
            type: 'estoque',
            message: message,
            level: 'critico',
            resolved: false,
            createdAt: new Date().toISOString(),
            financialImpact: criticalItems.reduce((acc, i) => acc + (i.costPrice * 5), 0), // Est. replacement cost
            actionLabel: 'Repor Estoque',
            actionLink: '/inventory'
        });
    }

    // 3. AGENDA GAPS (Real Data - Tomorrow)
    const tomorrow = addDays(today, 1);
    const ordersTomorrow = workOrders.filter(os => {
        if (os.status === 'Cancelado' || os.status === 'Concluído' || os.status === 'Entregue') return false;
        // Check deadline or creation date
        const dateStr = os.deadline?.includes('/') ? null : os.deadline; // Simple check, ideally parse deadline properly
        // Fallback to createdAt if deadline is text like "Amanhã"
        if (os.deadline?.toLowerCase().includes('amanhã') || os.deadline?.toLowerCase().includes('amanha')) return true;
        
        // Check exact date matches
        return false; // Simplification for demo if no proper date parsing for deadline text
    });
    
    // Simple logic: If < 2 orders for tomorrow (and it's a weekday), flag it
    const isWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;
    if (!isWeekend && ordersTomorrow.length < 2) {
        alerts.push({
            id: 'gen-agenda',
            type: 'agenda',
            message: 'Oportunidade: Agenda de amanhã com alta ociosidade. Que tal uma promoção relâmpago?',
            level: 'info',
            resolved: false,
            createdAt: new Date().toISOString(),
            financialImpact: 1500, // Est. daily revenue loss
            actionLabel: 'Criar Promoção',
            actionLink: '/marketing'
        });
    }

    // 4. FINANCIAL DROP (Real Data - Week over Week)
    const currentWeekRevenue = financialTransactions
        .filter(t => t.type === 'income' && isSameWeek(new Date(t.date), today))
        .reduce((acc, t) => acc + t.amount, 0);
    
    const lastWeekDate = subDays(today, 7);
    const lastWeekRevenue = financialTransactions
        .filter(t => t.type === 'income' && isSameWeek(new Date(t.date), lastWeekDate))
        .reduce((acc, t) => acc + t.amount, 0);

    if (lastWeekRevenue > 0 && currentWeekRevenue < (lastWeekRevenue * 0.8)) {
        const drop = ((lastWeekRevenue - currentWeekRevenue) / lastWeekRevenue) * 100;
        alerts.push({
            id: 'gen-finance',
            type: 'financeiro',
            message: `Alerta: Queda de ${drop.toFixed(0)}% no faturamento comparado à semana anterior.`,
            level: 'atencao',
            resolved: false,
            createdAt: new Date().toISOString(),
            financialImpact: lastWeekRevenue - currentWeekRevenue,
            actionLabel: 'Ver Relatório',
            actionLink: '/finance'
        });
    }

    return alerts.filter(a => !dismissedAlerts.includes(a.id)).sort((a, b) => (b.financialImpact || 0) - (a.financialImpact || 0));
  }, [clients, inventory, workOrders, financialTransactions, today, dismissedAlerts]);

  const markAlertResolved = (id: string) => {
      setDismissedAlerts(prev => [...prev, id]);
  };

  // --- FINANCIAL CALCULATIONS ---
  const paidTransactions = financialTransactions.filter(t => t.status === 'paid');

  const revenueMonth = paidTransactions
    .filter(t => t.type === 'income' && isSameMonth(new Date(t.date), today))
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  const revenueWeek = paidTransactions
    .filter(t => t.type === 'income' && isSameWeek(new Date(t.date), today, { weekStartsOn: 0 }))
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  const revenueTotal = paidTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  const expenseMonth = paidTransactions
    .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), today))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const profitMonth = revenueMonth - expenseMonth;
  const marginMonth = revenueMonth > 0 ? (profitMonth / revenueMonth) * 100 : 0;

  // --- CLIENT METRICS ---
  const totalClients = clients.length;
  const inactiveClients = clients.filter(c => c.status === 'inactive').length;
  const churnRate = totalClients > 0 ? (inactiveClients / totalClients) * 100 : 0;
  
  const newClientsMonth = clients.filter(c => {
      const dateStr = c.created_at || (c as any).createdAt;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return isValid(date) && isSameMonth(date, today);
  }).length;

  // --- WORK ORDER METRICS ---
  const currentMonthOS = useMemo(() => workOrders.filter(os => 
      (os.status === 'Concluído' || os.status === 'Entregue') && isSameMonth(new Date(os.createdAt), today)
  ), [workOrders, today]);

  const revenueServicesMonth = currentMonthOS.reduce((acc, os) => acc + os.totalValue, 0);
  const avgTicket = currentMonthOS.length > 0 ? revenueServicesMonth / currentMonthOS.length : 0;

  const topServiceData = useMemo(() => {
      const serviceStats: Record<string, number> = {};
      currentMonthOS.forEach(os => {
          const name = os.service; 
          serviceStats[name] = (serviceStats[name] || 0) + os.totalValue;
      });
      const top = Object.entries(serviceStats).sort((a, b) => b[1] - a[1])[0];
      return top ? top[0] : 'Nenhum';
  }, [currentMonthOS]);

  // --- CLIENT OF THE MONTH ---
  const clientOfTheMonth = useMemo(() => {
    const clientSpend: Record<string, number> = {};
    currentMonthOS.forEach(os => {
        clientSpend[os.clientId] = (clientSpend[os.clientId] || 0) + os.totalValue;
    });

    const topClientId = Object.keys(clientSpend).reduce((a, b) => clientSpend[a] > clientSpend[b] ? a : b, '');
    
    if (!topClientId) return null;
    
    const client = clients.find(c => c.id === topClientId);
    return client ? { ...client, monthSpend: clientSpend[topClientId] } : null;
  }, [currentMonthOS, clients]);

  // --- TOP 5 CLIENTS ---
  const topClientsAllTime = useMemo(() => {
      return [...clients]
        .sort((a, b) => (b.ltv || 0) - (a.ltv || 0))
        .slice(0, 5);
  }, [clients]);

  // --- REVENUE BY CATEGORY ---
  const revenueByCategory = useMemo(() => {
      const data: Record<string, number> = {};
      workOrders.forEach(os => {
          if (os.status === 'Concluído' || os.status === 'Entregue') {
              const service = services.find(s => s.name === os.service || s.id === os.serviceId);
              const category = service?.category || 'Outros';
              data[category] = (data[category] || 0) + os.totalValue;
          }
      });
      return Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [workOrders, services]);

  // --- YARD STATUS ---
  const activeYardOS = useMemo(() => {
      return workOrders.filter(os => 
        ['Aguardando', 'Em Andamento', 'Aguardando Peças', 'Controle de Qualidade', 'Aguardando Aprovação'].includes(os.status)
      ).sort((a, b) => {
          const priority = { 'Aguardando Aprovação': 0, 'Em Andamento': 1, 'Controle de Qualidade': 2, 'Aguardando Peças': 3, 'Aguardando': 4 };
          return (priority[a.status as keyof typeof priority] || 5) - (priority[b.status as keyof typeof priority] || 5);
      });
  }, [workOrders]);

  const yardStats = {
      total: activeYardOS.length,
      pendingApproval: activeYardOS.filter(os => os.status === 'Aguardando Aprovação').length,
      waitingStart: activeYardOS.filter(os => os.status === 'Aguardando').length,
      inProgress: activeYardOS.filter(os => os.status === 'Em Andamento').length,
      waitingParts: activeYardOS.filter(os => os.status === 'Aguardando Peças').length,
      qa: activeYardOS.filter(os => os.status === 'Controle de Qualidade').length
  };
  
  // --- AGENDA OCCUPANCY ---
  const agendaOccupancy = useMemo(() => {
      const activeTechs = employees.filter(e => e.active).length || 1;
      const minutesPerDayPerTech = 8 * 60;
      const totalCapacityMinutes = activeTechs * minutesPerDayPerTech;

      const osToday = workOrders.filter(os => {
          if (os.status === 'Cancelado') return false;
          if (os.deadline) {
              const dl = os.deadline.toLowerCase();
              return dl.includes('hoje') || dl.includes(today.toLocaleDateString('pt-BR').slice(0, 5));
          }
          const osDate = new Date(os.createdAt);
          return isValid(osDate) && isSameDay(osDate, today);
      });

      const occupiedMinutes = osToday.reduce((acc, os) => {
          let osTime = 0;
          if (os.serviceIds && os.serviceIds.length > 0) {
              os.serviceIds.forEach(id => {
                  const s = services.find(srv => srv.id === id);
                  if (s) osTime += s.standardTimeMinutes;
                  else osTime += 60;
              });
          } else if (os.serviceId) {
              const s = services.find(s => s.id === os.serviceId);
              if (s) osTime = s.standardTimeMinutes;
              else osTime = 60;
          } else {
              const s = services.find(s => s.name === os.service);
              if (s) osTime = s.standardTimeMinutes;
              else osTime = 60;
          }
          return acc + osTime;
      }, 0);

      return Math.min(100, Math.round((occupiedMinutes / totalCapacityMinutes) * 100));
  }, [workOrders, employees, services, today]);

  const criticalAlert = realTimeAlerts.find(a => a.level === 'critico') || realTimeAlerts[0];

  // --- REVIEWS ---
  const recentReviews = useMemo(() => {
      return workOrders
        .filter(os => os.npsScore !== undefined && os.npsScore !== null)
        .sort((a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())
        .slice(0, 5);
  }, [workOrders]);
  
  const npsScoreAvg = workOrders.filter(os => os.npsScore).reduce((acc, os) => acc + (os.npsScore || 0), 0) / (workOrders.filter(os => os.npsScore).length || 1);

  const handleNewOS = () => {
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
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'Aguardando Aprovação': return <AlertCircle size={16} className="text-purple-400" />;
          case 'Aguardando': return <Clock size={16} className="text-amber-400" />;
          case 'Em Andamento': return <Hammer size={16} className="text-blue-400" />;
          case 'Aguardando Peças': return <PauseCircle size={16} className="text-orange-400" />;
          case 'Controle de Qualidade': return <ShieldCheck size={16} className="text-indigo-400" />;
          default: return <Car size={16} className="text-slate-400" />;
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Aguardando Aprovação': return "bg-purple-500/20 text-purple-300 border-purple-500/30";
          case 'Aguardando': return "bg-amber-500/20 text-amber-300 border-amber-500/30";
          case 'Em Andamento': return "bg-blue-500/20 text-blue-300 border-blue-500/30";
          case 'Aguardando Peças': return "bg-orange-500/20 text-orange-300 border-orange-500/30";
          case 'Controle de Qualidade': return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
          default: return "bg-slate-700 text-slate-300 border-slate-600";
      }
  };

  const scrollYard = (direction: 'left' | 'right') => {
    if (yardScrollRef.current) {
        const scrollAmount = 320;
        yardScrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 relative">
      
      {selectedOS && (
        <WorkOrderModal 
          workOrder={selectedOS} 
          onClose={() => setSelectedOS(null)} 
        />
      )}

      {selectedClient && (
        <ClientDetailsModal 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
        />
      )}

      {/* Header & Quick Actions */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Command Center</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Visão estratégica e controle total.</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={() => navigate('/schedule')}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Calendar size={16} />
            <span className="hidden sm:inline">Agenda</span>
          </button>
          <button 
            onClick={handleNewOS}
            className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nova OS</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-6">
          
          {/* --- SECTION 0: PÁTIO AGORA --- */}
          <div className="rounded-2xl overflow-hidden shadow-2xl relative bg-slate-900 border border-slate-800">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                      <div>
                          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                              <Car className="text-blue-500" /> Pátio em Tempo Real
                          </h3>
                          <p className="text-slate-400 text-sm mt-1">
                              Monitoramento ao vivo dos veículos na oficina.
                          </p>
                      </div>
                      
                      <div className="flex gap-3">
                          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                              <p className="text-xs text-slate-400 uppercase font-bold">Total</p>
                              <p className="text-xl font-bold text-white">{yardStats.total}</p>
                          </div>
                          <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                              <p className="text-xs text-blue-300 uppercase font-bold">Execução</p>
                              <p className="text-xl font-bold text-blue-400">{yardStats.inProgress}</p>
                          </div>
                          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                              <p className="text-xs text-amber-300 uppercase font-bold">Fila</p>
                              <p className="text-xl font-bold text-amber-400">{yardStats.waitingStart}</p>
                          </div>
                      </div>
                  </div>

                  {/* Vehicle List - Horizontal Scroll */}
                  <div className="relative group/yard">
                      <button 
                          onClick={(e) => { e.stopPropagation(); scrollYard('left'); }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 p-2 rounded-full text-white hover:bg-blue-600 border border-slate-700 shadow-lg backdrop-blur-sm transition-all -ml-2 md:-ml-4 flex items-center justify-center opacity-70 hover:opacity-100"
                          title="Rolar para esquerda"
                      >
                          <ChevronLeft size={24} />
                      </button>
                      
                      <button 
                          onClick={(e) => { e.stopPropagation(); scrollYard('right'); }}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 p-2 rounded-full text-white hover:bg-blue-600 border border-slate-700 shadow-lg backdrop-blur-sm transition-all -mr-2 md:-mr-4 flex items-center justify-center opacity-70 hover:opacity-100"
                          title="Rolar para direita"
                      >
                          <ChevronRight size={24} />
                      </button>

                      <div 
                          ref={yardScrollRef}
                          className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent snap-x snap-mandatory px-1"
                      >
                          {activeYardOS.length > 0 ? activeYardOS.map(os => (
                              <div 
                                key={os.id}
                                onClick={() => setSelectedOS(os)}
                                className="min-w-[280px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-all group relative overflow-hidden snap-center"
                              >
                                  <div className="flex justify-between items-start mb-3">
                                      <div className={cn("px-2 py-1 rounded-lg text-[10px] font-bold uppercase border flex items-center gap-1.5", getStatusColor(os.status))}>
                                          {getStatusIcon(os.status)}
                                          {os.status === 'Aguardando' ? 'Na Fila' : os.status}
                                      </div>
                                      <LicensePlate plate={os.plate} size="sm" />
                                  </div>
                                  
                                  <h4 className="text-lg font-bold text-white mb-1 truncate">{os.vehicle}</h4>
                                  <p className="text-xs text-slate-400 mb-3 truncate">{os.service}</p>
                                  
                                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                      <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700">
                                              {os.technician.charAt(0)}
                                          </div>
                                          <span className="text-xs text-slate-400 truncate max-w-[80px]">{os.technician}</span>
                                      </div>
                                      {os.deadline && (
                                          <span className={cn(
                                              "text-xs font-bold flex items-center gap-1",
                                              os.deadline.toLowerCase().includes('hoje') ? "text-amber-400" : "text-slate-500"
                                          )}>
                                              <Clock size={12} /> {os.deadline.split(' ')[0]}
                                          </span>
                                      )}
                                  </div>

                                  <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                                      <div 
                                        className={cn("h-full transition-all duration-1000", 
                                            os.status === 'Aguardando Aprovação' ? "w-[5%] bg-purple-500" :
                                            os.status === 'Aguardando' ? "w-[10%] bg-amber-500" :
                                            os.status === 'Em Andamento' ? "w-[50%] bg-blue-500" :
                                            os.status === 'Controle de Qualidade' ? "w-[90%] bg-indigo-500" : "w-full bg-slate-600"
                                        )} 
                                      />
                                  </div>
                              </div>
                          )) : (
                              <div className="w-full py-12 text-center border-2 border-dashed border-white/10 rounded-xl">
                                  <Car size={48} className="mx-auto text-slate-700 mb-3" />
                                  <p className="text-slate-500">Nenhum veículo no pátio agora.</p>
                                  <button onClick={handleNewOS} className="mt-4 text-sm text-blue-400 hover:text-blue-300 font-bold">
                                      + Registrar Entrada
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="mt-2 flex justify-end">
                      <button onClick={() => navigate('/operations')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                          Ver Quadro Completo <ArrowRight size={12} />
                      </button>
                  </div>
              </div>
          </div>

          {/* --- SECTION 1: DAILY PULSE & KPIs --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Agenda Hoje */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                      <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Agenda Hoje</p>
                          <div className="flex items-end gap-2 mt-1">
                              <span className={cn("text-2xl font-bold", agendaOccupancy < 50 ? "text-red-500" : "text-green-500")}>
                                  {agendaOccupancy}%
                              </span>
                              <span className="text-xs text-slate-400 mb-1">ocupada</span>
                          </div>
                      </div>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <Clock size={20} />
                      </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div 
                          className={cn("h-full rounded-full transition-all duration-1000", agendaOccupancy < 50 ? "bg-red-500" : "bg-green-500")} 
                          style={{ width: `${agendaOccupancy}%` }}
                      />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-right">Baseado em horas estimadas</p>
              </div>

              {/* Ticket Médio */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                      <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Ticket Médio</p>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(avgTicket)}</h3>
                      </div>
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                          <Target size={20} />
                      </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Top: <span className="font-bold text-blue-600 dark:text-blue-400">{topServiceData}</span>
                  </p>
              </div>

              {/* Atenção Necessária */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-center">
                  {criticalAlert ? (
                      <>
                          <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-500">
                              <AlertCircle size={16} />
                              <span className="text-xs font-bold uppercase">Atenção</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed line-clamp-2">
                              {criticalAlert.message}
                          </p>
                          {criticalAlert.actionLink && (
                              <button 
                                onClick={() => navigate(criticalAlert.actionLink!)}
                                className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                Resolver <ArrowRight size={10} />
                              </button>
                          )}
                      </>
                  ) : (
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                              <CheckCircle2 size={20} />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">Tudo Certo</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Operação fluindo.</p>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Receita do Mês */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Receita (Mês)</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(revenueMonth)}</h3>
                    </div>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-600 font-bold">
                        {formatCurrency(revenueWeek)}
                    </span>
                    <span className="text-slate-400">nesta semana</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500" style={{ width: '100%' }} />
            </div>

            {/* Card 2: Receita Total (All Time) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Receita Total</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(revenueTotal)}</h3>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Wallet size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <TrendingUp size={14} className="text-blue-500" />
                    <span>Acumulado histórico</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: '100%' }} />
            </div>

            {/* Card 3: Base de Clientes */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Total Clientes</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalClients}</h3>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <Users size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600 font-bold">+{newClientsMonth} novos</span>
                    <span className="text-slate-400">este mês</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all duration-500" style={{ width: '100%' }} />
            </div>

            {/* Card 4: Taxa de Desistência (Churn) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Desistência (Churn)</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{churnRate.toFixed(1)}%</h3>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                        <UserMinus size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-500 font-bold">{inactiveClients} inativos</span>
                    <span className="text-slate-400">total</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-500" style={{ width: `${Math.min(churnRate * 5, 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Destaque: Cliente do Mês */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={120} />
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Crown size={20} className="text-yellow-300" />
                            </div>
                            <h3 className="font-bold text-lg uppercase tracking-wide">Cliente do Mês</h3>
                        </div>

                        {clientOfTheMonth ? (
                            <div 
                                className="animate-in fade-in slide-in-from-bottom-4 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setSelectedClient(clientOfTheMonth as Client)}
                            >
                                <h2 className="text-3xl font-bold mb-1">{clientOfTheMonth.name}</h2>
                                <p className="text-indigo-200 text-sm mb-4">{clientOfTheMonth.vehicles[0]?.model || 'Veículo não cad.'}</p>
                                
                                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                                    <p className="text-xs text-indigo-200 uppercase font-bold mb-1">Investimento em {today.toLocaleDateString('pt-BR', { month: 'long' })}</p>
                                    <p className="text-2xl font-bold text-yellow-300">{formatCurrency(clientOfTheMonth.monthSpend)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-indigo-200">
                                <p>Ainda sem dados para este mês.</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => navigate('/clients')}
                        className="mt-6 w-full py-2 bg-white text-indigo-700 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors"
                    >
                        Ver Todos os Clientes
                    </button>
                </div>

                {/* Ranking: Top 5 Clientes */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="text-yellow-500" size={18} /> Top 5 Clientes (LTV)
                    </h3>
                    <div className="space-y-3">
                        {topClientsAllTime.map((client, idx) => (
                            <div 
                                key={client.id} 
                                className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" 
                                onClick={() => setSelectedClient(client)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        idx === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                        idx === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                                        idx === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{client.name}</p>
                                        <p className="text-[10px] text-slate-500">{client.visitCount} visitas</p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(client.ltv || 0)}</p>
                            </div>
                        ))}
                        {topClientsAllTime.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">Nenhum cliente registrado.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Faturamento por Categoria */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="text-blue-600" size={18} /> Faturamento por Categoria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">De onde vem sua receita?</p>
                
                <div className="flex-1 min-h-[200px] relative">
                    {revenueByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {revenueByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ 
                                        backgroundColor: isDark ? '#1e293b' : '#fff',
                                        borderColor: isDark ? '#334155' : '#e2e8f0',
                                        borderRadius: '8px',
                                        color: isDark ? '#fff' : '#0f172a'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <p className="text-sm">Sem dados de serviços concluídos.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* --- SECTION 4: INTELLIGENCE & OPERATIONS --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Alertas Inteligentes */}
             <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BrainCircuit className="text-purple-600" size={20} /> Inteligência Operacional
                    </h3>
                    {realTimeAlerts.length > 0 && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                            {realTimeAlerts.length} Alertas
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    {realTimeAlerts.length > 0 ? (
                        realTimeAlerts.map(alert => (
                            <div key={alert.id} className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border transition-all",
                                alert.level === 'critico' ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" :
                                alert.level === 'atencao' ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" :
                                "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                            )}>
                                <div className={cn(
                                    "p-2 rounded-lg flex-shrink-0",
                                    alert.level === 'critico' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                                    alert.level === 'atencao' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                                    "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                )}>
                                    <Lightbulb size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.message}</p>
                                    {alert.financialImpact && alert.financialImpact > 0 && (
                                        <p className="text-xs font-bold text-red-500 mt-0.5">Impacto Estimado: {formatCurrency(alert.financialImpact)}</p>
                                    )}
                                    {alert.actionLink && (
                                        <button 
                                            onClick={() => navigate(alert.actionLink!)}
                                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1 flex items-center gap-1"
                                        >
                                            {alert.actionLabel || 'Resolver'} <ArrowRight size={10} />
                                        </button>
                                    )}
                                </div>
                                <button 
                                    onClick={() => markAlertResolved(alert.id)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                                    title="Dispensar"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <CheckCircle2 size={32} className="mb-2 opacity-50 text-green-500" />
                            <p className="text-sm">Tudo certo! Sem alertas pendentes.</p>
                        </div>
                    )}
                </div>
             </div>

             {/* REVIEWS WALL (NEW) */}
             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Star size={20} className="text-yellow-500" /> Mural de Avaliações
                    </h3>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">NPS Médio</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{npsScoreAvg.toFixed(1)}</p>
                    </div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {recentReviews.length > 0 ? recentReviews.map(review => (
                        <div key={review.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{clients.find(c => c.id === review.clientId)?.name || 'Cliente'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{review.vehicle} • {review.service}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">{review.npsScore}</span>
                                </div>
                            </div>
                            {review.npsComment ? (
                                <div className="relative mt-2">
                                    <Quote size={16} className="absolute -top-1 -left-1 text-slate-300 dark:text-slate-600 transform -scale-x-100" />
                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic pl-4 border-l-2 border-slate-200 dark:border-slate-600">
                                        "{review.npsComment}"
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic mt-2">Sem comentário.</p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-3 text-right">
                                {new Date(review.paidAt || review.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-8 text-slate-400">
                            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="mb-4">Nenhuma avaliação recebida ainda.</p>
                        </div>
                    )}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
