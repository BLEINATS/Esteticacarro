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
  Zap
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
  Area
} from 'recharts';
import { formatCurrency, cn, formatId } from '../lib/utils';
import { useApp } from '../context/AppContext';
import WorkOrderModal from '../components/WorkOrderModal';
import { WorkOrder } from '../types';
import { useNavigate } from 'react-router-dom';
import { isSameDay, isSameMonth, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import AIAssistant from '../components/AIAssistant';

const StatCard = ({ title, value, subtext, icon: Icon, color, decorationColor, trend, tooltip, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer",
      onClick ? "hover:border-blue-400 dark:hover:border-blue-600" : ""
    )}
  >
    {/* Background Decoration Shape */}
    <div className={cn(
      "absolute right-0 top-0 w-24 h-24 opacity-10 rounded-bl-full transition-transform group-hover:scale-110", 
      decorationColor || color.replace('text-', 'bg-').split(' ')[0] 
    )} />
    
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-lg bg-slate-50 dark:bg-slate-800", color)}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend === 'up' 
            ? "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" 
            : "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
        )}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </div>
      )}
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
    <p className="text-xs text-slate-400 mt-2">{subtext}</p>
    
    {tooltip && (
      <div className="absolute left-0 right-0 bottom-0 px-6 py-3 bg-slate-900 dark:bg-slate-950 text-white text-xs rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        {tooltip}
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const { theme, workOrders, clients, inventory, financialTransactions, companySettings, systemAlerts, markAlertResolved, employees } = useApp();
  const isDark = theme === 'dark';
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const navigate = useNavigate();

  // --- CÁLCULOS REAIS (Real Data) ---
  const today = new Date();

  // 1. Financeiro (Baseado nas transações 'paid')
  const paidTransactions = financialTransactions.filter(t => t.status === 'paid');

  const totalIncome = paidTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  const totalExpense = paidTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const netProfit = totalIncome - totalExpense;
  const currentBalance = (companySettings.initialBalance || 0) + netProfit;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // --- NOVOS CÁLCULOS PARA O RESUMO EXECUTIVO ---
  
  // Faturamento Hoje vs Mês
  const revenueToday = paidTransactions
    .filter(t => t.type === 'income' && isSameDay(new Date(t.date), today))
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  const revenueMonth = paidTransactions
    .filter(t => t.type === 'income' && isSameMonth(new Date(t.date), today))
    .reduce((acc, t) => acc + (t.netAmount ?? t.amount), 0);

  // Agenda Preenchida (%)
  const activeTechs = employees.filter(e => e.active).length || 1;
  const dailyCapacity = activeTechs * 4; // Estimativa: 4 carros por técnico/dia
  const osTodayCount = workOrders.filter(os => {
      if (os.deadline) {
          const dl = os.deadline.toLowerCase();
          return dl.includes('hoje') || dl.includes(today.toLocaleDateString('pt-BR').slice(0, 5));
      }
      return isSameDay(new Date(os.createdAt), today);
  }).length;
  const agendaOccupancy = Math.min(100, Math.round((osTodayCount / dailyCapacity) * 100));

  // Ticket Médio (Mês Atual)
  const completedMonthOS = workOrders.filter(os => 
    os.status === 'Concluído' && isSameMonth(new Date(os.createdAt), today)
  );
  const ticketMedio = completedMonthOS.length > 0 
    ? completedMonthOS.reduce((acc, os) => acc + os.totalValue, 0) / completedMonthOS.length 
    : 0;

  // Serviço Mais Lucrativo (Mês Atual)
  const serviceRevenue: Record<string, number> = {};
  completedMonthOS.forEach(os => {
      const name = os.service;
      serviceRevenue[name] = (serviceRevenue[name] || 0) + os.totalValue;
  });
  const topServiceEntry = Object.entries(serviceRevenue).sort((a, b) => b[1] - a[1])[0];
  const topService = topServiceEntry ? { name: topServiceEntry[0], value: topServiceEntry[1] } : null;

  // Profissional Destaque (Mês Atual)
  const techRevenue: Record<string, number> = {};
  completedMonthOS.forEach(os => {
      const tech = os.technician;
      if (tech && tech !== 'A Definir') {
          techRevenue[tech] = (techRevenue[tech] || 0) + os.totalValue;
      }
  });
  const topTechEntry = Object.entries(techRevenue).sort((a, b) => b[1] - a[1])[0];
  const topTech = topTechEntry ? { name: topTechEntry[0], value: topTechEntry[1] } : null;

  // Alertas Automáticos (Queda/Ociosidade)
  // Sort alerts by financial impact (High to Low)
  const sortedAlerts = [...systemAlerts].sort((a, b) => (b.financialImpact || 0) - (a.financialImpact || 0));

  // --- OUTROS DADOS ---
  const activeOS = workOrders.filter(os => ['Em Andamento', 'Aguardando Peças', 'Controle de Qualidade'].includes(os.status));
  const pendingApproval = workOrders.filter(os => os.status === 'Aguardando Aprovação').length;
  const churnRisk = clients.filter(c => c.status === 'churn_risk').length;
  const newClients = clients.filter(c => c.segment === 'new').length;
  const visitsThisMonth = workOrders.filter(os => isSameMonth(new Date(os.createdAt), today)).length;

  const financialData = [
    { name: 'Receita', value: totalIncome, color: '#10b981' }, 
    { name: 'Despesa', value: totalExpense, color: '#ef4444' }, 
  ];

  const clientSegmentsData = [
    { name: 'VIP', value: clients.filter(c => c.segment === 'vip').length, fill: '#8b5cf6', label: 'VIP' }, 
    { name: 'Recorrente', value: clients.filter(c => c.segment === 'recurring').length, fill: '#3b82f6', label: 'Recorrentes' }, 
    { name: 'Novos', value: newClients, fill: '#10b981', label: 'Novos' }, 
    { name: 'Risco', value: churnRisk, fill: '#f59e0b', label: 'Em Risco' }, 
  ];

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
      <AIAssistant />
      
      {selectedOS && (
        <WorkOrderModal 
          workOrder={selectedOS} 
          onClose={() => setSelectedOS(null)} 
        />
      )}

      {/* Header & Quick Actions */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Command Center</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Visão 360º da Crystal Care Auto Detail.</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={() => navigate('/schedule')}
            className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Calendar size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Agenda</span>
          </button>
          <button 
            onClick={handleNewOS}
            className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Nova OS</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-6">
          
          {/* --- RESUMO EXECUTIVO (30s Overview) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Faturamento Hoje / Mês */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <DollarSign size={48} />
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Faturamento</h3>
                <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(revenueToday)}</span>
                        <span className="text-xs text-green-600 font-bold bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Hoje</span>
                    </div>
                    <div className="flex items-baseline gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>Mês:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(revenueMonth)}</span>
                    </div>
                </div>
            </div>

            {/* Card 2: Agenda & Ociosidade */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Clock size={48} />
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Agenda Hoje</h3>
                <div className="flex items-end gap-2 mb-2">
                    <span className={cn("text-3xl font-bold", agendaOccupancy > 80 ? "text-green-600" : agendaOccupancy < 40 ? "text-red-500" : "text-amber-500")}>
                        {agendaOccupancy}%
                    </span>
                    <span className="text-xs text-slate-400 mb-1">preenchida</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                        className={cn("h-full rounded-full transition-all duration-500", agendaOccupancy > 80 ? "bg-green-500" : agendaOccupancy < 40 ? "bg-red-500" : "bg-amber-500")} 
                        style={{ width: `${agendaOccupancy}%` }}
                    />
                </div>
            </div>

            {/* Card 3: Ticket Médio & Top Serviço */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Target size={48} />
                </div>
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Ticket Médio</h3>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(ticketMedio)}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase mb-1">Top Serviço (Lucro)</h3>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate" title={topService?.name}>
                            {topService ? topService.name : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 4: Destaque & Alertas */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-black p-5 rounded-xl border border-slate-700 shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Award size={48} />
                </div>
                
                {sortedAlerts.length > 0 ? (
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-start gap-2 mb-2">
                            <AlertCircle className="text-amber-400 animate-pulse" size={18} />
                            <div>
                                <h3 className="text-amber-400 text-xs font-bold uppercase">Atenção Necessária</h3>
                                <p className="text-sm font-medium leading-tight mt-1 line-clamp-2">{sortedAlerts[0].message}</p>
                                {sortedAlerts[0].financialImpact && sortedAlerts[0].financialImpact > 0 && (
                                    <p className="text-xs text-red-300 mt-1 font-bold">
                                        Impacto: {formatCurrency(sortedAlerts[0].financialImpact)}
                                    </p>
                                )}
                            </div>
                        </div>
                        {sortedAlerts[0].actionLink && (
                            <button 
                                onClick={() => navigate(sortedAlerts[0].actionLink!)}
                                className="mt-2 text-xs bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded transition-colors w-fit"
                            >
                                {sortedAlerts[0].actionLabel || 'Resolver'}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                                <Award size={12} className="text-yellow-400" /> Profissional Destaque
                            </h3>
                            <p className="text-xl font-bold text-white truncate">{topTech ? topTech.name : '-'}</p>
                            <p className="text-xs text-slate-400">{topTech ? formatCurrency(topTech.value) : 'R$ 0,00'} gerados</p>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-green-400 text-xs font-bold">
                            <CheckCircle2 size={12} /> Operação Saudável
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* --- VISÃO DO DONO (INTELLIGENCE LAYER) - EXPANDED --- */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inteligência Operacional</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Análise de anomalias e oportunidades.</p>
                    </div>
                </div>
                {sortedAlerts.length > 0 && (
                    <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                        {sortedAlerts.length} Alertas
                    </span>
                )}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Alerts List */}
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
                                            {alert.actionLabel || 'Ver Detalhes'} <ArrowRight size={10} />
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
                        <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <CheckCircle2 size={32} className="mb-2 opacity-50 text-green-500" />
                            <p className="text-sm">Tudo certo! Sem alertas pendentes.</p>
                        </div>
                    )}
                </div>

                {/* Quick Stats Summary (Secondary) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Margem de Lucro</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profitMargin.toFixed(1)}%</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Novos Clientes</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{newClients}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Pátio Ativo</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeOS.length}</p>
                        <p className="text-[10px] text-slate-400">{pendingApproval} pendentes</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Risco de Churn</p>
                        <p className="text-2xl font-bold text-red-500">{churnRisk}</p>
                    </div>
                </div>
             </div>
          </div>

          {/* ... (Rest of the dashboard remains the same) ... */}
          {/* Main Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-shrink-0">
        
            {/* 1. Fluxo de Caixa (Rosca Animada) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target size={16} className="text-blue-600" />
                  Saúde Financeira
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">Acumulado</span>
              </div>
              
              <div className="w-full min-h-[250px] h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialData}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="90%"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        color: isDark ? '#fff' : '#0f172a'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Saldo</p>
                  <p className={cn("text-xl font-bold", currentBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600")}>
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
              </div>

              {/* Legenda Financeira Detalhada */}
              <div className="grid grid-cols-2 gap-2 mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                {financialData.map((item) => (
                  <div key={item.name} className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: item.color }} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">{item.name}</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{formatCurrency(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. CRM / Segmentação */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={16} className="text-purple-600" />
                  Perfil de Clientes
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">Total: {clients.length}</span>
              </div>
              
              <div className="w-full min-h-[250px] h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientSegmentsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80} 
                      tick={{fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b'}} 
                      interval={0} 
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        color: isDark ? '#fff' : '#000'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {clientSegmentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda de Clientes Detalhada */}
              <div className="grid grid-cols-2 gap-1.5 mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                {clientSegmentsData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-1.5 rounded text-[10px] bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white ml-1">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Alertas & Operação */}
            <div className="space-y-3">
              {/* Pátio - Carros Visuais */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Car size={16} className="text-amber-500" />
                  Pátio Agora
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {activeOS.slice(0, 3).map((os, idx) => {
                    const colors = [
                      { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', circle: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
                      { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', circle: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                      { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', circle: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' }
                    ];
                    const color = colors[idx];
                    return (
                      <div 
                        key={os.id} 
                        onClick={() => setSelectedOS(os)}
                        className={`flex flex-col items-center justify-center p-3 ${color.bg} rounded-lg border ${color.border} hover:shadow-md transition-all cursor-pointer`}
                      >
                        <div className={`w-10 h-10 rounded-full ${color.circle} flex items-center justify-center text-white mb-1`}>
                          <Car size={20} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-900 dark:text-white text-center line-clamp-1">{os.vehicle}</p>
                        <p className="text-[8px] text-slate-500 dark:text-slate-400 line-clamp-1">{os.service.substring(0, 10)}</p>
                        <p className={`text-[7px] font-bold ${color.text} mt-1`}>{formatId(os.plate || os.id)}</p>
                      </div>
                    );
                  })}
                  {activeOS.length < 3 && Array.from({ length: 3 - activeOS.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 opacity-50">
                      <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-500 mb-1">
                        <Car size={20} />
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Vazio</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/operations')}
                  className="w-full py-1.5 mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center justify-center gap-1"
                >
                  Ver Pátio Completo <ArrowRight size={12} />
                </button>
              </div>

              {/* Critical Alerts */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" />
                  Atenção
                </h3>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                  {inventory.filter(i => i.status === 'critical').slice(0, 2).map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate('/inventory')}
                      className="flex items-start gap-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white">Crítico: {item.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.stock} {item.unit}</p>
                      </div>
                    </div>
                  ))}
                  {pendingApproval > 0 && (
                    <div 
                      onClick={() => navigate('/operations')}
                      className="flex items-start gap-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white">{pendingApproval} OS pendentes</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Ação necessária.</p>
                      </div>
                    </div>
                  )}
                  {inventory.filter(i => i.status === 'critical').length === 0 && pendingApproval === 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> OK
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
