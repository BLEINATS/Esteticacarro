import React, { useMemo } from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, 
  MessageSquare, ArrowUpRight, ArrowDownRight, Crown,
  UserPlus, UserMinus, BarChart3, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, cn } from '../../lib/utils';
import { isSameMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function SaaSDashboard() {
  const { tenants, totalMRR, tokenLedger, saasTransactions } = useSuperAdmin();
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const today = new Date();

  // --- CÁLCULOS FINANCEIROS ---
  
  // 1. Receita de Tokens (Mês Atual)
  const monthlyTokenRevenue = useMemo(() => {
    return tokenLedger
      .filter(t => t.type === 'purchase' && isSameMonth(new Date(t.date), today))
      .reduce((acc, t) => acc + (t.value || 0), 0);
  }, [tokenLedger]);

  // 2. Receita Manual Extra (Mês Atual)
  const monthlyManualRevenue = useMemo(() => {
    return saasTransactions
      .filter(t => t.type === 'income' && isSameMonth(new Date(t.date), today))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [saasTransactions]);

  // 3. Receita Total do Mês (MRR + Tokens + Extras)
  const totalMonthlyRevenue = totalMRR + monthlyTokenRevenue + monthlyManualRevenue;

  // 4. Receita Total Acumulada (Histórico Simplificado)
  // Nota: Em um sistema real, somaríamos histórico de faturas. Aqui usamos uma aproximação baseada no MRR atual * meses + tokens.
  const totalLifetimeRevenue = useMemo(() => {
      const historicalTokens = tokenLedger.filter(t => t.type === 'purchase').reduce((acc, t) => acc + (t.value || 0), 0);
      const historicalManual = saasTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      // Estimativa simples: MRR * 6 meses (mock) + histórico real de tokens
      return (totalMRR * 6) + historicalTokens + historicalManual;
  }, [totalMRR, tokenLedger, saasTransactions]);

  // --- CÁLCULOS DE CLIENTES (TENANTS) ---
  const activeTenants = tenants.filter(t => t.status === 'active' || t.status === 'trial');
  const churnedTenants = tenants.filter(t => t.status === 'cancelled');
  const newTenantsMonth = tenants.filter(t => isSameMonth(new Date(t.joinedAt), today)).length;
  
  const churnRate = tenants.length > 0 ? (churnedTenants.length / tenants.length) * 100 : 0;

  // --- TENANT DO MÊS ---
  const topTenant = useMemo(() => {
      const tenantSpend = tenants.map(t => {
          const tokenSpend = tokenLedger
            .filter(tx => tx.tenantId === t.id && tx.type === 'purchase' && isSameMonth(new Date(tx.date), today))
            .reduce((acc, tx) => acc + (tx.value || 0), 0);
          
          return {
              ...t,
              monthTotal: (t.status === 'active' ? t.mrr : 0) + tokenSpend,
              tokenSpend
          };
      }).sort((a, b) => b.monthTotal - a.monthTotal);

      return tenantSpend.length > 0 ? tenantSpend[0] : null;
  }, [tenants, tokenLedger]);

  // --- TOP 5 TENANTS (Ranking) ---
  const topTenantsList = useMemo(() => {
      return tenants
        .filter(t => t.status === 'active')
        .sort((a, b) => b.mrr - a.mrr)
        .slice(0, 5);
  }, [tenants]);

  // --- GRÁFICOS ---
  
  // 1. Composição de Receita (Histórico 6 meses)
  const revenueHistoryData = useMemo(() => {
      return Array.from({ length: 6 }).map((_, i) => {
          const date = subMonths(today, 5 - i);
          const monthLabel = format(date, 'MMM', { locale: ptBR });
          
          // Mock variation for MRR history
          const mrrValue = totalMRR * (0.8 + (i * 0.04)); 
          
          const tokenValue = tokenLedger
            .filter(t => t.type === 'purchase' && isSameMonth(new Date(t.date), date))
            .reduce((acc, t) => acc + (t.value || 0), 0);

          return {
              name: monthLabel,
              mrr: mrrValue,
              tokens: tokenValue
          };
      });
  }, [totalMRR, tokenLedger]);

  // 2. Distribuição de Planos
  const planData = useMemo(() => {
      const counts: Record<string, number> = { starter: 0, pro: 0, enterprise: 0 };
      activeTenants.forEach(t => {
          if (counts[t.planId] !== undefined) counts[t.planId]++;
      });
      return [
          { name: 'Básico', value: counts.starter },
          { name: 'Intermediário', value: counts.pro },
          { name: 'Avançado', value: counts.enterprise }
      ].filter(d => d.value > 0);
  }, [activeTenants]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard SaaS</h1>
          <p className="text-slate-500 dark:text-slate-400">Visão estratégica do seu negócio de software.</p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-sm text-slate-500 dark:text-slate-400">Receita Mensal Atual</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalMonthlyRevenue)}</p>
        </div>
      </div>

      {/* --- SECTION 1: HIGH LEVEL KPIs --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receita Mensal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Receita (Mês)</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(totalMonthlyRevenue)}</h3>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <DollarSign size={24} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-600 font-bold flex items-center"><ArrowUpRight size={14} /> +{monthlyTokenRevenue > 0 ? '12%' : '0%'}</span>
                <span className="text-slate-400">vs. mês anterior</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>MRR: {formatCurrency(totalMRR)}</span>
                <span>Tokens: {formatCurrency(monthlyTokenRevenue)}</span>
            </div>
        </div>

        {/* Base de Clientes */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Total Clientes</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{tenants.length}</h3>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Users size={24} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-600 font-bold flex items-center"><UserPlus size={14} className="mr-1" /> +{newTenantsMonth}</span>
                <span className="text-slate-400">novos este mês</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                {activeTenants.length} ativos • {churnedTenants.length} cancelados
            </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Taxa de Churn</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{churnRate.toFixed(1)}%</h3>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                    <UserMinus size={24} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <span className={cn("font-bold flex items-center", churnRate > 5 ? "text-red-600" : "text-green-600")}>
                    {churnRate > 5 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} 
                    {churnRate > 5 ? 'Alerta' : 'Saudável'}
                </span>
                <span className="text-slate-400">taxa de cancelamento</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${Math.min(churnRate * 5, 100)}%` }} />
            </div>
        </div>

        {/* Receita Total (Lifetime) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Receita Total (LTV)</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(totalLifetimeRevenue)}</h3>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Wallet size={24} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Activity size={14} />
                <span>Acumulado histórico estimado</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- SECTION 2: HIGHLIGHTS (Tenant of the Month & Ranking) --- */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tenant of the Month Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Crown size={140} />
                </div>
                
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TrendingUp size={20} className="text-yellow-300" />
                        </div>
                        <h3 className="font-bold text-lg uppercase tracking-wide">Loja do Mês</h3>
                    </div>

                    {topTenant ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-3xl font-bold mb-1 truncate">{topTenant.name}</h2>
                            <p className="text-indigo-200 text-sm mb-4">{topTenant.responsibleName}</p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1">Faturamento Gerado</p>
                                    <p className="text-xl font-bold text-yellow-300">{formatCurrency(topTenant.monthTotal)}</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                    <p className="text-[10px] text-indigo-200 uppercase font-bold mb-1">Tokens Extras</p>
                                    <p className="text-xl font-bold text-white">{formatCurrency(topTenant.tokenSpend)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-indigo-200">
                            <p>Ainda sem dados para este mês.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top 5 Ranking */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="text-blue-500" size={18} /> Top 5 Lojas (MRR)
                </h3>
                <div className="space-y-3">
                    {topTenantsList.map((tenant, idx) => (
                        <div key={tenant.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                    idx === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                    idx === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                                    idx === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    {idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{tenant.name}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{tenant.responsibleName}</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrency(tenant.mrr)}</p>
                        </div>
                    ))}
                    {topTenantsList.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhuma loja ativa.</p>
                    )}
                </div>
            </div>
        </div>

        {/* --- SECTION 3: PLAN DISTRIBUTION --- */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Distribuição de Planos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Base ativa por categoria.</p>
            
            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={planData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {planData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
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
            </div>
        </div>
      </div>

      {/* --- SECTION 4: REVENUE TREND --- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Evolução da Receita (6 Meses)</h3>
              <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-slate-600 dark:text-slate-300">Recorrente (MRR)</span>
                  </div>
                  <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-slate-600 dark:text-slate-300">Tokens & Extras</span>
                  </div>
              </div>
          </div>
          
          <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueHistoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
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
                      <Area type="monotone" dataKey="mrr" stackId="1" stroke="#3b82f6" fill="url(#colorMrr)" />
                      <Area type="monotone" dataKey="tokens" stackId="1" stroke="#8b5cf6" fill="url(#colorTokens)" />
                  </AreaChart>
              </ResponsiveContainer>
          </div>
      </div>

    </div>
  );
}
