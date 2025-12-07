import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar, MessageSquare, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

type TimeRange = 'monthly' | 'quarterly' | 'yearly';
type Tab = 'general' | 'tokenomics';

export default function SaaSMetrics() {
  const { tenants, totalMRR, activeTenantsCount, tokenLedger, totalTokensSold, totalTokensConsumed } = useSuperAdmin();
  const { theme } = useApp();
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  // --- TOKENOMICS DATA ---
  const tokenRevenue = tokenLedger
    .filter(t => t.type === 'purchase')
    .reduce((acc, t) => acc + (t.value || 0), 0);

  const circulatingTokens = totalTokensSold - totalTokensConsumed;

  // Chart Data for Tokenomics (Grouped by Month)
  const tokenFlowData = useMemo(() => {
    const months: Record<string, { name: string; purchased: number; consumed: number }> = {};
    
    tokenLedger.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`; // e.g., "12/2024"
        const name = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        if (!months[key]) months[key] = { name, purchased: 0, consumed: 0 };
        
        if (t.amount > 0) months[key].purchased += t.amount;
        else months[key].consumed += Math.abs(t.amount);
    });

    return Object.values(months).reverse(); // Simple sort
  }, [tokenLedger]);

  // --- GENERAL METRICS DATA ---
  const churnedTenants = tenants.filter(t => t.status === 'cancelled').length;
  const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;

  // Mock data for general charts
  const revenueData = [
    { name: 'Jan', mrr: 12000 },
    { name: 'Fev', mrr: 13500 },
    { name: 'Mar', mrr: 15200 },
    { name: 'Abr', mrr: 16800 },
    { name: 'Mai', mrr: 18500 },
    { name: 'Jun', mrr: totalMRR * 0.9 }, 
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

  const planDistribution = [
    { name: 'Básico', value: tenants.filter(t => t.planId === 'starter').length },
    { name: 'Intermediário', value: tenants.filter(t => t.planId === 'pro').length },
    { name: 'Avançado', value: tenants.filter(t => t.planId === 'enterprise').length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Métricas de Crescimento</h1>
          <p className="text-slate-500 dark:text-slate-400">Análise detalhada da saúde do seu SaaS.</p>
        </div>
        <div className="flex gap-2">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        activeTab === 'general' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                >
                    Geral
                </button>
                <button 
                    onClick={() => setActiveTab('tokenomics')}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                        activeTab === 'tokenomics' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                >
                    <MessageSquare size={16} /> Economia de Tokens
                </button>
            </div>
        </div>
      </div>

      {/* --- TAB: GENERAL METRICS --- */}
      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <DollarSign size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">MRR Atual</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalMRR)}</p>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm mt-1 font-medium">
                        <TrendingUp size={16} /> +15% este mês
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">LTV (Lifetime Value)</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalMRR * 12)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Valor médio por cliente/ano</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <Activity size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Churn Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">1.2%</p>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm mt-1 font-medium">
                        <TrendingDown size={16} /> -0.5% vs mês anterior
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">Evolução da Receita (MRR)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorMrrMetrics" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                                <Area type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMrrMetrics)" />
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">Distribuição de Planos</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={planDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {planDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: 'none', 
                                        backgroundColor: isDark ? '#1e293b' : '#fff',
                                        color: isDark ? '#fff' : '#0f172a'
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB: TOKENOMICS --- */}
      {activeTab === 'tokenomics' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right">
            {/* Token KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <DollarSign size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Receita de Tokens</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(tokenRevenue)}</p>
                    <p className="text-xs text-slate-500 mt-1">Vendas de pacotes avulsos</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <ArrowUpRight size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Tokens Emitidos</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalTokensSold}</p>
                    <p className="text-xs text-slate-500 mt-1">Planos + Pacotes</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <ArrowDownRight size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Tokens Consumidos</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalTokensConsumed}</p>
                    <p className="text-xs text-slate-500 mt-1">Uso em IA e WhatsApp</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <MessageSquare size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Em Circulação</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{circulatingTokens}</p>
                    <p className="text-xs text-slate-500 mt-1">Passivo (Liability)</p>
                </div>
            </div>

            {/* Token Flow Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6">Fluxo de Tokens: Entrada vs Saída</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tokenFlowData}>
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
                            <Legend />
                            <Bar dataKey="purchased" name="Entrada (Compra/Plano)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="consumed" name="Saída (Uso)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Extrato Global de Tokens</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Loja (Tenant)</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Qtd.</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {tokenLedger.slice(0, 10).map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                        {new Date(t.date).toLocaleDateString('pt-BR')} {new Date(t.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{t.tenantName}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                            t.type === 'purchase' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                            t.type === 'plan_credit' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                            t.type === 'bonus' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                                            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                        )}>
                                            {t.type === 'purchase' ? 'Compra' : t.type === 'plan_credit' ? 'Plano' : t.type === 'bonus' ? 'Bônus' : 'Uso'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">{t.description}</td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-bold",
                                        t.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        {t.amount > 0 ? '+' : ''}{t.amount}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                                        {t.value ? formatCurrency(t.value) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
