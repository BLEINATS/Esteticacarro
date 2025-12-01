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
  AlertCircle
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
import { formatCurrency, cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import WorkOrderModal from '../components/WorkOrderModal';
import { WorkOrder } from '../types';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
    <div className={cn("absolute right-0 top-0 w-24 h-24 opacity-10 rounded-bl-full transition-transform group-hover:scale-110", color.replace('text-', 'bg-'))} />
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
  </div>
);

export default function Dashboard() {
  const { theme, workOrders, clients, employeeTransactions, inventory } = useApp();
  const isDark = theme === 'dark';
  const [selectedOS, setSelectedOS] = useState<WorkOrder | null>(null);
  const navigate = useNavigate();

  // --- CÁLCULOS REAIS ---
  
  // 1. Financeiro
  const totalIncome = 128500.00 + workOrders.filter(os => os.status === 'Concluído').reduce((acc, os) => acc + os.totalValue, 0);
  const totalExpense = 86200.00 + employeeTransactions.filter(t => t.type !== 'commission').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = (netProfit / totalIncome) * 100;

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
    : 'N/A';

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
        <div className="space-y-4">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        <StatCard 
          title="Lucro Líquido Real" 
          value={formatCurrency(netProfit)} 
          subtext={`Margem atual: ${profitMargin.toFixed(1)}%`}
          trend="up" 
          icon={DollarSign} 
          color="text-emerald-600 dark:text-emerald-400" 
        />
        <StatCard 
          title="Pátio Ativo" 
          value={activeOS.length.toString()} 
          subtext={`${pendingApproval} aguardando aprovação`}
          trend={pendingApproval > 0 ? 'down' : 'up'} 
          icon={Activity} 
          color="text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          title="Qualidade (NPS)" 
          value={avgNPS} 
          subtext="Média das últimas avaliações"
          trend="up" 
          icon={Star} 
          color="text-yellow-500 dark:text-yellow-400" 
        />
        <StatCard 
          title="Risco de Churn" 
          value={churnRisk.toString()} 
          subtext="Clientes inativos > 60 dias"
          trend="down" 
          icon={Users} 
          color="text-red-500 dark:text-red-400" 
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
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">Este Mês</span>
              </div>
              
              <div className="flex-1 h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financialData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
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
              <p className={cn("text-xl font-bold", netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600")}>
                {formatCurrency(netProfit)}
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
              
              <div className="flex-1 h-[200px]">
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
              {/* Live Operations */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Wrench size={16} className="text-amber-500" />
                  Pátio Agora
                </h3>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {activeOS.slice(0, 3).map(os => (
                    <div 
                      key={os.id} 
                      onClick={() => setSelectedOS(os)}
                      className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-[10px] flex-shrink-0">
                        {os.technician.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{os.vehicle}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{os.service}</p>
                      </div>
                      <span className="text-[8px] font-bold uppercase bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-700 flex-shrink-0 whitespace-nowrap">
                        {os.status.replace('Em Andamento', 'Exec.')}
                      </span>
                    </div>
                  ))}
                  {activeOS.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">Pátio livre.</p>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/operations')}
                  className="w-full py-1.5 mt-2 text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex items-center justify-center gap-1"
                >
                  Ver todas <ArrowRight size={12} />
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
