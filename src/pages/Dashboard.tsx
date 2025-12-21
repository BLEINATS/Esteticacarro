import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Calendar,
  Plus,
  Users,
  Star,
  Wrench,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  Car,
  MapPin,
  BrainCircuit,
  Lightbulb,
  X,
  Clock,
  Award,
  Zap,
  Trophy,
  Wallet,
  UserMinus,
  BarChart3,
  Crown
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
  LineChart,
  Line,
  Legend
} from 'recharts';
import { formatCurrency, cn, formatId } from '../lib/utils';
import { useApp } from '../context/AppContext';
import WorkOrderModal from '../components/WorkOrderModal';
import { WorkOrder } from '../types';
import { useNavigate } from 'react-router-dom';
import { isSameDay, isSameMonth, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const { theme, workOrders, clients, inventory, financialTransactions, companySettings, systemAlerts, markAlertResolved, employees, services } = useApp();
  const isDark = theme === 'dark';
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const navigate = useNavigate();

  const today = new Date();

  // --- CÁLCULOS FINANCEIROS ---
  const paidTransactions = financialTransactions.filter(t => t.status === 'paid');

  // Receita do Mês Atual
  const revenueMonth = paidTransactions
    .filter(t => t.type === 'income' && isSameMonth(new Date(t.date), today))
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  // Receita Total (Acumulada)
  const revenueTotal = paidTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  // Despesas do Mês
  const expenseMonth = paidTransactions
    .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), today))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const profitMonth = revenueMonth - expenseMonth;
  const marginMonth = revenueMonth > 0 ? (profitMonth / revenueMonth) * 100 : 0;

  // --- CÁLCULOS DE CLIENTES ---
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const inactiveClients = clients.filter(c => c.status === 'inactive').length;
  const churnRate = totalClients > 0 ? (inactiveClients / totalClients) * 100 : 0;
  const newClientsMonth = clients.filter(c => c.segment === 'new' && isSameMonth(new Date(c.lastVisit), today)).length;

  // --- CÁLCULOS ESPECÍFICOS PARA OS NOVOS CARDS ---
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

  // --- CLIENTE DO MÊS ---
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

  // --- TOP 5 CLIENTES (ALL TIME) ---
  const topClientsAllTime = useMemo(() => {
      return [...clients]
        .sort((a, b) => (b.ltv || 0) - (a.ltv || 0))
        .slice(0, 5);
  }, [clients]);

  // --- FATURAMENTO POR CATEGORIA (Gráfico) ---
  const revenueByCategory = useMemo(() => {
      const data: Record<string, number> = {};
      workOrders.forEach(os => {
          if (os.status === 'Concluído' || os.status === 'Entregue') {
              // Tenta achar a categoria pelo serviço
              const service = services.find(s => s.name === os.service || s.id === os.serviceId);
              const category = service?.category || 'Outros';
              data[category] = (data[category] || 0) + os.totalValue;
          }
      });
      return Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [workOrders, services]);

  // --- OPERACIONAL ---
  const activeOS = workOrders.filter(os => ['Em Andamento', 'Aguardando Peças', 'Controle de Qualidade'].includes(os.status));
  const pendingApproval = workOrders.filter(os => os.status === 'Aguardando Aprovação').length;
  
  // Agenda Occupancy
  const activeTechs = employees.filter(e => e.active).length || 1;
  const dailyCapacity = activeTechs * 4; 
  const osTodayCount = workOrders.filter(os => {
      if (os.deadline) {
          const dl = os.deadline.toLowerCase();
          return dl.includes('hoje') || dl.includes(today.toLocaleDateString('pt-BR').slice(0, 5));
      }
      return isSameDay(new Date(os.createdAt), today);
  }).length;
  const agendaOccupancy = Math.min(100, Math.round((osTodayCount / dailyCapacity) * 100));

  // Alertas
  const sortedAlerts = [...systemAlerts].sort((a, b) => (b.financialImpact || 0) - (a.financialImpact || 0));
  const criticalAlert = sortedAlerts.find(a => a.level === 'critico') || sortedAlerts[0];

  const handleNewOS = () => {
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
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 relative">
      
      {selectedOS && (
        <WorkOrderModal 
          workOrder={selectedOS} 
          onClose={() => setSelectedOS(null)} 
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
          
          {/* --- SECTION 0: DAILY PULSE (Requested Cards) --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              {/* Agenda Hoje */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Clock size={48} className="text-white" />
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">Agenda Hoje</p>
                  <div className="flex items-end gap-2 mb-3">
                      <span className={cn("text-3xl font-bold", agendaOccupancy < 50 ? "text-red-500" : "text-green-500")}>
                          {agendaOccupancy}%
                      </span>
                      <span className="text-sm text-slate-500 mb-1 font-medium">preenchida</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                          className={cn("h-full rounded-full transition-all duration-1000", agendaOccupancy < 50 ? "bg-red-500" : "bg-green-500")} 
                          style={{ width: `${agendaOccupancy}%` }}
                      />
                  </div>
              </div>

              {/* Ticket Médio */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Target size={48} className="text-white" />
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Ticket Médio</p>
                  <h3 className="text-2xl font-bold text-white mb-4">{formatCurrency(avgTicket)}</h3>
                  
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">Top Serviço (Lucro)</p>
                    <p className="text-blue-400 font-bold text-sm truncate">{topServiceData}</p>
                  </div>
              </div>

              {/* Atenção Necessária */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-center group">
                  <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Award size={48} className="text-white" />
                  </div>
                  {criticalAlert ? (
                      <>
                          <div className="flex items-center gap-2 mb-2 text-yellow-500">
                              <AlertCircle size={16} />
                              <span className="text-xs font-bold uppercase">Atenção Necessária</span>
                          </div>
                          <p className="text-white text-sm font-medium leading-relaxed line-clamp-3">
                              {criticalAlert.message}
                          </p>
                          {criticalAlert.actionLink && (
                              <button 
                                onClick={() => navigate(criticalAlert.actionLink!)}
                                className="mt-3 text-xs font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                              >
                                Resolver <ArrowRight size={12} />
                              </button>
                          )}
                      </>
                  ) : (
                      <>
                          <div className="flex items-center gap-2 mb-2 text-green-500">
                              <CheckCircle2 size={16} />
                              <span className="text-xs font-bold uppercase">Tudo Certo</span>
                          </div>
                          <p className="text-slate-400 text-sm">
                              Nenhum alerta crítico no momento. Operação fluindo normalmente.
                          </p>
                      </>
                  )}
              </div>
          </div>

          {/* --- SECTION 1: SUPER KPIs --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Receita do Mês */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Receita (Mês)</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(revenueMonth)}</h3>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className={cn("font-bold", marginMonth > 0 ? "text-green-600" : "text-slate-500")}>
                        {marginMonth.toFixed(1)}% Margem
                    </span>
                    <span className="text-slate-400">• Lucro: {formatCurrency(profitMonth)}</span>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-500" style={{ width: '100%' }} />
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
                <div className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-500" style={{ width: `${Math.min(churnRate, 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* --- SECTION 2: CLIENTE DO MÊS & RANKING --- */}
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
                            <div className="animate-in fade-in slide-in-from-bottom-4">
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
                            <div key={client.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" onClick={() => navigate('/clients')}>
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

            {/* --- SECTION 3: REVENUE BREAKDOWN --- */}
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
                    {sortedAlerts.length > 0 && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                            {sortedAlerts.length} Alertas
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    {sortedAlerts.length > 0 ? (
                        sortedAlerts.map(alert => (
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

             {/* Status do Pátio */}
             <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Car className="text-amber-500" size={20} /> Pátio Agora
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase font-bold">Em Andamento</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeOS.length}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 uppercase font-bold">Pendentes</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{pendingApproval}</p>
                    </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {activeOS.slice(0, 4).map(os => (
                        <div key={os.id} onClick={() => setSelectedOS(os)} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{os.vehicle}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{formatId(os.plate)}</span>
                        </div>
                    ))}
                    {activeOS.length === 0 && (
                        <p className="text-sm text-slate-400 text-center italic">Pátio vazio.</p>
                    )}
                </div>
                
                <button 
                    onClick={() => navigate('/operations')}
                    className="w-full mt-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                >
                    Ver Quadro Completo
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
