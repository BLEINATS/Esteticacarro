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
    <div className="space-y-8 animate-in fade-in duration-500">
      {selectedOS && (
        <WorkOrderModal 
          workOrder={selectedOS} 
          onClose={() => setSelectedOS(null)} 
        />
      )}

      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Command Center</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Visão 360º da Crystal Care Auto Detail.</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/schedule')}
            className="flex items-center justify-center gap-1 sm:gap-2 flex-1 sm:flex-none px-2 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Agenda</span>
          </button>
          <button 
            onClick={handleNewOS}
            className="flex items-center justify-center gap-1 sm:gap-2 flex-1 sm:flex-none px-2 sm:px-5 py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. Fluxo de Caixa (Rosca Animada) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target size={20} className="text-blue-600" />
              Saúde Financeira
            </h3>
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">Este Mês</span>
          </div>
          
          <div className="flex-1 min-h-[250px] relative">
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
          <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            {financialData.map((item) => (
              <div key={item.name} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{item.name}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. CRM / Segmentação */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={20} className="text-purple-600" />
              Perfil de Clientes
            </h3>
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">Total: {clients.length}</span>
          </div>
          
          <div className="flex-1 min-h-[250px]">
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
          <div className="grid grid-cols-2 gap-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
             {clientSegmentsData.map((item) => (
               <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                   <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                 </div>
                 <span className="text-xs font-bold text-slate-900 dark:text-white">{item.value}</span>
               </div>
             ))}
          </div>
        </div>

        {/* 3. Alertas & Operação */}
        <div className="space-y-6">
          {/* Live Operations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-amber-500" />
              Pátio Agora
            </h3>
            <div className="space-y-4">
              {activeOS.slice(0, 3).map(os => (
                <div 
                  key={os.id} 
                  onClick={() => setSelectedOS(os)}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                    {os.technician.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{os.vehicle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{os.service}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-white dark:bg-slate-900 px-2 py-1 rounded text-slate-500 border border-slate-200 dark:border-slate-700">
                    {os.status.replace('Em Andamento', 'Executando')}
                  </span>
                </div>
              ))}
              {activeOS.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Pátio livre.</p>
              )}
              <button 
                onClick={() => navigate('/operations')}
                className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Ver todas <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" />
              Atenção
            </h3>
            <div className="space-y-3">
              {inventory.filter(i => i.status === 'critical').slice(0, 2).map(item => (
                <div 
                  key={item.id} 
                  onClick={() => navigate('/inventory')}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Estoque Crítico: {item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Restam apenas {item.stock} {item.unit}</p>
                  </div>
                </div>
              ))}
              {pendingApproval > 0 && (
                <div 
                  onClick={() => navigate('/operations')}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{pendingApproval} OS aguardando aprovação</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ação necessária do gerente.</p>
                  </div>
                </div>
              )}
              {inventory.filter(i => i.status === 'critical').length === 0 && pendingApproval === 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Tudo operando normalmente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
