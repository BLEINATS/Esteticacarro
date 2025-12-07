import React from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, 
  AlertTriangle, CheckCircle2, MessageSquare 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, cn } from '../../lib/utils';

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-lg bg-slate-50 dark:bg-slate-800", color)}>
        <Icon size={24} />
      </div>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
    <p className="text-xs text-slate-400 mt-2">{subtext}</p>
  </div>
);

export default function SaaSDashboard() {
  const { tenants, totalMRR, activeTenantsCount, totalTokensSold } = useSuperAdmin();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const churnedTenants = tenants.filter(t => t.status === 'cancelled').length;
  const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', mrr: 12000 },
    { name: 'Fev', mrr: 13500 },
    { name: 'Mar', mrr: 15200 },
    { name: 'Abr', mrr: 16800 },
    { name: 'Mai', mrr: 18500 },
    { name: 'Jun', mrr: totalMRR * 0.9 }, // Mock proximity
    { name: 'Jul', mrr: totalMRR },
  ];

  const tenantGrowthData = [
    { name: 'Jan', active: 40, new: 5 },
    { name: 'Fev', active: 44, new: 6 },
    { name: 'Mar', active: 49, new: 7 },
    { name: 'Abr', active: 55, new: 8 },
    { name: 'Mai', active: 62, new: 9 },
    { name: 'Jun', active: 70, new: 10 },
    { name: 'Jul', active: activeTenantsCount, new: 4 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Visão Geral do SaaS</h1>
        <p className="text-slate-500 dark:text-slate-400">Acompanhe o desempenho do seu negócio.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="MRR (Receita Recorrente)" 
          value={formatCurrency(totalMRR)} 
          subtext="+12% vs mês anterior"
          icon={DollarSign} 
          color="text-emerald-600 dark:text-emerald-400" 
        />
        <StatCard 
          title="Clientes Ativos" 
          value={activeTenantsCount} 
          subtext={`${trialTenants} em período de teste`}
          icon={Users} 
          color="text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          title="Tokens em Circulação" 
          value={totalTokensSold} 
          subtext="Consumo médio: 45/loja"
          icon={MessageSquare} 
          color="text-purple-600 dark:text-purple-400" 
        />
        <StatCard 
          title="Saúde da Base" 
          value={`${((activeTenantsCount / (activeTenantsCount + suspendedTenants + churnedTenants || 1)) * 100).toFixed(0)}%`} 
          subtext={`${suspendedTenants} suspensos / ${churnedTenants} churn`}
          icon={Activity} 
          color="text-indigo-600 dark:text-indigo-400" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Crescimento de MRR</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      color: isDark ? '#fff' : '#0f172a'
                    }}
                />
                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Evolução da Base</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      color: isDark ? '#fff' : '#0f172a'
                    }}
                />
                <Bar dataKey="active" name="Ativos" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="new" name="Novos" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Alertas e Pendências</h3>
        <div className="space-y-3">
            {tenants.filter(t => t.status === 'suspended').map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                        <div>
                            <p className="font-bold text-red-900 dark:text-red-300">{t.name} está suspenso</p>
                            <p className="text-xs text-red-700 dark:text-red-400">Fatura em atraso desde {new Date(t.nextBilling).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 text-xs font-bold rounded border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30">
                        Ver Detalhes
                    </button>
                </div>
            ))}
            {tenants.filter(t => t.status === 'trial').map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-blue-600 dark:text-blue-400" size={20} />
                        <div>
                            <p className="font-bold text-blue-900 dark:text-blue-300">{t.name} em período de teste</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">Trial encerra em {new Date(t.nextBilling).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                        Oferecer Desconto
                    </button>
                </div>
            ))}
            {tenants.filter(t => t.status === 'suspended' || t.status === 'trial').length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">Nenhum alerta pendente.</p>
            )}
        </div>
      </div>
    </div>
  );
}
