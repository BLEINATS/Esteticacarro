import React, { useState } from 'react';
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
  X
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
  CartesianGrid
} from 'recharts';
import { formatCurrency, cn, formatId } from '../lib/utils';
import { useApp } from '../context/AppContext';
import WorkOrderModal from '../components/WorkOrderModal';
import { WorkOrder } from '../types';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, subtext, icon: Icon, color, decorationColor, trend, tooltip }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
    {/* Background Decoration Shape */}
    <div className={cn(
      "absolute right-0 top-0 w-24 h-24 opacity-10 rounded-bl-full transition-transform group-hover:scale-110", 
      decorationColor || color.replace('text-', 'bg-').split(' ')[0] // Fallback safe logic or explicit color
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
  const { theme, workOrders, clients, inventory, financialTransactions, companySettings, systemAlerts, markAlertResolved } = useApp();
  const isDark = theme === 'dark';
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const navigate = useNavigate();

  // --- CÁLCULOS REAIS (Real Data) ---
  
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

  const financialData = [
    { name: 'Receita', value: totalIncome, color: '#10b981' }, 
    { name: 'Despesa', value: totalExpense, color: '#ef4444' }, 
  ];

  // 2. Operacional
  const activeOS = workOrders.filter(os => ['Em Andamento', 'Aguardando Peças', 'Controle de Qualidade'].includes(os.status));
  const pendingApproval = workOrders.filter(os => os.status === 'Aguardando Aprovação').length;

  // 3. CRM / Clientes
  const churnRisk = clients.filter(c => c.status === 'churn_risk').length;
  const vipClients = clients.filter(c => c.segment === 'vip').length;
  const recurringClients = clients.filter(c => c.segment === 'recurring').length;
  const newClients = clients.filter(c => c.segment === 'new').length;
  
  const clientSegmentsData = [
    { name: 'VIP', value: vipClients, fill: '#8b5cf6', label: 'VIP' }, 
    { name: 'Recorrente', value: recurringClients, fill: '#3b82f6', label: 'Recorrentes' }, 
    { name: 'Novos', value: newClients, fill: '#10b981', label: 'Novos' }, 
    { name: 'Risco', value: churnRisk, fill: '#f59e0b', label: 'Em Risco' }, 
  ];

  // 4. NPS Médio
  const ratedOS = workOrders.filter(os => os.npsScore !== undefined);
  const avgNPS = ratedOS.length > 0 
    ? (ratedOS.reduce((acc, os) => acc + (os.npsScore || 0), 0) / ratedOS.length).toFixed(1)
    : '0';

  // 5. Visitas do Mês (Novas OS criadas este mês)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const visitsThisMonth = workOrders.filter(os => {
    const date = new Date(os.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const handleNewOS = () => {
    const newOS: WorkOrder = {
        id: `OS-${Math.floor(Math.random() * 10000)}`,
        clientId: '', // Empty to force selection
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
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500">
      {selectedOS && (
        <WorkOrderModal 
          workOrder={selectedOS} 
          onClose={() => setSelectedOS(null)} 
        />
      )}

      {/* Header & Quick Actions - Compact */}
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
          
          {/* --- VISÃO DO DONO (INTELLIGENCE LAYER) --- */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <BrainCircuit size={24} className="text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Visão do Dono</h3>
                    <p className="text-xs text-slate-400">Insights automáticos para decisão rápida.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Alerts List */}
                <div className="space-y-3">
                    {systemAlerts.length > 0 ? (
                        systemAlerts.map(alert => (
                            <div key={alert.id} className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border transition-all",
                                alert.level === 'critico' ? "bg-red-500/10 border-red-500/30" :
                                alert.level === 'atencao' ? "bg-amber-500/10 border-amber-500/30" :
                                "bg-blue-500/10 border-blue-500/30"
                            )}>
                                <div className={cn(
                                    "p-2 rounded-lg flex-shrink-0",
                                    alert.level === 'critico' ? "bg-red-500/20 text-red-400" :
                                    alert.level === 'atencao' ? "bg-amber-500/20 text-amber-400" :
                                    "bg-blue-500/20 text-blue-400"
                                )}>
                                    <Lightbulb size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-200">{alert.message}</p>
                                    {alert.actionLink && (
                                        <button 
                                            onClick={() => navigate(alert.actionLink!)}
                                            className="text-xs font-bold text-white hover:underline mt-1 flex items-center gap-1"
                                        >
                                            {alert.actionLabel || 'Ver Detalhes'} <ArrowRight size={10} />
                                        </button>
                                    )}
                                </div>
                                <button 
                                    onClick={() => markAlertResolved(alert.id)}
                                    className="text-slate-500 hover:text-white transition-colors p-1"
                                    title="Dispensar"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-6 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                            <CheckCircle2 size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">Tudo certo! Sem alertas pendentes.</p>
                        </div>
                    )}
                </div>

                {/* Quick Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Faturamento Mês</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Margem de Lucro</p>
                        <p className="text-2xl font-bold text-blue-400">{profitMargin.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Ticket Médio</p>
                        <p className="text-2xl font-bold text-purple-400">{formatCurrency(totalIncome / (visitsThisMonth || 1))}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Novos Clientes</p>
                        <p className="text-2xl font-bold text-white">{newClients}</p>
                    </div>
                </div>
             </div>
          </div>

          {/* KPI Grid - Updated to 5 columns for large screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-shrink-0">
            <StatCard 
              title="Lucro Líquido Real" 
              value={formatCurrency(netProfit)} 
              subtext={`Margem atual: ${profitMargin.toFixed(1)}%`}
              trend={netProfit >= 0 ? "up" : "down"} 
              icon={DollarSign} 
              color="text-emerald-600 dark:text-emerald-400" 
              decorationColor="bg-emerald-600"
            />
            <StatCard 
              title="Pátio Ativo" 
              value={activeOS.length.toString()} 
              subtext={`${pendingApproval} aguardando aprovação`}
              trend={pendingApproval > 0 ? 'down' : 'up'} 
              icon={Activity} 
              color="text-blue-600 dark:text-blue-400" 
              decorationColor="bg-blue-600"
            />
            <StatCard 
              title="Qualidade (NPS)" 
              value={avgNPS} 
              subtext="Média das últimas avaliações"
              trend="up" 
              icon={Star} 
              color="text-yellow-500 dark:text-yellow-400"
              decorationColor="bg-yellow-500"
              tooltip="NPS (Net Promoter Score) mede a satisfação do cliente."
            />
            <StatCard 
              title="Risco de Churn" 
              value={churnRisk.toString()} 
              subtext="Clientes inativos > 60 dias"
              trend="down" 
              icon={Users} 
              color="text-red-500 dark:text-red-400"
              decorationColor="bg-red-500"
              tooltip="Clientes sem interação recente."
            />
            <StatCard 
              title="Visitas do Mês" 
              value={visitsThisMonth.toString()} 
              subtext="Veículos recebidos"
              trend="up" 
              icon={Car} 
              color="text-indigo-600 dark:text-indigo-400"
              decorationColor="bg-indigo-600"
              tooltip="Total de novas Ordens de Serviço abertas neste mês."
            />
          </div>

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
