import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  Wallet,
  PieChart,
  AlertTriangle,
  Target,
  BarChart3,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format, addWeeks, startOfWeek, endOfWeek, isWithinInterval, parseISO, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Finance() {
  const { financialTransactions, workOrders, companySettings } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast'>('overview');
  const [filterPeriod, setFilterPeriod] = useState('month');

  // --- LÓGICA DE VISÃO GERAL (EXISTENTE) ---
  const metrics = {
    revenue: financialTransactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0),
    expenses: financialTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0),
    pending: financialTransactions
      .filter(t => t.status === 'pending')
      .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)
  };

  const profit = metrics.revenue - metrics.expenses;
  const margin = metrics.revenue > 0 ? (profit / metrics.revenue) * 100 : 0;

  // --- LÓGICA DE PREVISÃO (NOVA) ---
  const forecastMetrics = useMemo(() => {
    const today = startOfDay(new Date());
    const next4Weeks = [0, 1, 2, 3].map(weekOffset => {
      const start = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 }); // Segunda
      const end = endOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 }); // Domingo
      
      // Filtrar OSs para esta semana futura
      const weekOrders = workOrders.filter(os => {
        if (!os.deadline) return false;
        const osDate = parseISO(os.deadline);
        return isWithinInterval(osDate, { start, end });
      });

      // Receita Garantida: Aprovado, Em Andamento, Concluído (mas não pago ainda)
      const guaranteed = weekOrders
        .filter(os => ['Aprovado', 'Em Andamento', 'Concluído'].includes(os.status))
        .reduce((acc, os) => acc + os.totalValue, 0);

      // Receita Potencial: Orçamentos
      const potential = weekOrders
        .filter(os => ['Orçamento', 'Pendente'].includes(os.status))
        .reduce((acc, os) => acc + os.totalValue, 0);

      return {
        label: `Semana ${format(start, 'dd/MM')}`,
        start,
        guaranteed,
        potential,
        total: guaranteed + potential,
        count: weekOrders.length
      };
    });

    const totalGuaranteed = next4Weeks.reduce((acc, w) => acc + w.guaranteed, 0);
    const totalPotential = next4Weeks.reduce((acc, w) => acc + w.potential, 0);
    
    // Meta semanal baseada no histórico (exemplo simples: média das últimas transações ou fixo)
    // Em um cenário real, isso viria de companySettings.monthlyGoal
    const weeklyGoal = 5000; 

    const alerts = next4Weeks
      .filter(w => w.total < weeklyGoal * 0.5) // Alerta se for menos de 50% da meta
      .map(w => ({
        week: w.label,
        gap: weeklyGoal - w.total,
        severity: w.total === 0 ? 'high' : 'medium'
      }));

    return { weeks: next4Weeks, totalGuaranteed, totalPotential, alerts, weeklyGoal };
  }, [workOrders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestão de fluxo de caixa e previsibilidade</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'overview' 
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'forecast' 
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <Target size={16} />
            Previsão Futura
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        // --- CONTEÚDO EXISTENTE (VISÃO GERAL) ---
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <ArrowUpRight size={14} className="mr-1" /> +12%
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Receita Total</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(metrics.revenue)}
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Wallet className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                  <ArrowDownRight size={14} className="mr-1" /> -5%
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Despesas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(metrics.expenses)}
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  {margin.toFixed(1)}% Margem
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Lucro Líquido</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(profit)}
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Calendar className="text-amber-600 dark:text-amber-400" size={24} />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1">
                  A Compensar
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saldo Pendente</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(metrics.pending)}
              </h3>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Transações Recentes</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                  <Filter size={20} />
                </button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                  <Download size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {financialTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-2 h-2 rounded-full mr-3",
                            transaction.type === 'income' ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {transaction.desc}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 text-xs font-bold rounded-full",
                          transaction.status === 'completed' 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        )}>
                          {transaction.status === 'completed' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                        transaction.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // --- NOVA ABA: PREVISÃO FUTURA ---
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          {/* Resumo da Projeção */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Card 1: Receita Garantida */}
             <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <CheckCircle2 size={64} />
                </div>
                <p className="text-emerald-100 font-medium mb-1 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Receita Garantida (30d)
                </p>
                <h3 className="text-3xl font-bold mb-2">{formatCurrency(forecastMetrics.totalGuaranteed)}</h3>
                <p className="text-sm text-emerald-100 opacity-90">
                  OSs Aprovadas e Agendadas
                </p>
             </div>

             {/* Card 2: Potencial de Venda */}
             <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Target size={64} />
                </div>
                <p className="text-blue-100 font-medium mb-1 flex items-center gap-2">
                  <Clock size={16} /> Potencial em Aberto
                </p>
                <h3 className="text-3xl font-bold mb-2">{formatCurrency(forecastMetrics.totalPotential)}</h3>
                <p className="text-sm text-blue-100 opacity-90">
                  Orçamentos aguardando aprovação
                </p>
             </div>

             {/* Card 3: Projeção Total */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative">
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Projeção Total</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {formatCurrency(forecastMetrics.totalGuaranteed + forecastMetrics.totalPotential)}
                </h3>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                   <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(forecastMetrics.totalGuaranteed / (forecastMetrics.totalGuaranteed + forecastMetrics.totalPotential || 1)) * 100}%` }}
                   />
                </div>
                <div className="flex justify-between text-xs mt-2 text-slate-400">
                  <span>Garantido</span>
                  <span>Potencial</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Semanal */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-500" />
                Previsão Próximas 4 Semanas
              </h3>
              
              <div className="space-y-6">
                {forecastMetrics.weeks.map((week, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{week.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">Meta: {formatCurrency(forecastMetrics.weeklyGoal)}</span>
                    </div>
                    
                    <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {/* Barra Garantida */}
                      {week.guaranteed > 0 && (
                        <div 
                          className="bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center text-[10px] text-white font-bold relative group cursor-help"
                          style={{ width: `${Math.min(100, (week.guaranteed / forecastMetrics.weeklyGoal) * 100)}%` }}
                        >
                          <span className="hidden sm:inline">{formatCurrency(week.guaranteed)}</span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                            Garantido: {formatCurrency(week.guaranteed)}
                          </div>
                        </div>
                      )}
                      
                      {/* Barra Potencial */}
                      {week.potential > 0 && (
                        <div 
                          className="bg-blue-400 hover:bg-blue-500 transition-colors flex items-center justify-center text-[10px] text-white font-bold relative group cursor-help opacity-80"
                          style={{ width: `${Math.min(100, (week.potential / forecastMetrics.weeklyGoal) * 100)}%` }}
                        >
                          <span className="hidden sm:inline">{formatCurrency(week.potential)}</span>
                           {/* Tooltip */}
                           <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                            Potencial: {formatCurrency(week.potential)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicador de Meta */}
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {((week.total / forecastMetrics.weeklyGoal) * 100).toFixed(0)}% da meta
                      </span>
                      <span className="text-slate-400">{week.count} agendamentos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas e Insights */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" />
                Alertas de Agenda
              </h3>

              {forecastMetrics.alerts.length > 0 ? (
                <div className="space-y-3">
                  {forecastMetrics.alerts.map((alert, idx) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-xl border-l-4",
                      alert.severity === 'high' 
                        ? "bg-red-50 dark:bg-red-900/20 border-red-500" 
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-500"
                    )}>
                      <h4 className={cn(
                        "font-bold text-sm",
                        alert.severity === 'high' ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                      )}>
                        {alert.week}: Agenda Fraca
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Faltam <strong>{formatCurrency(alert.gap)}</strong> para atingir a meta semanal.
                      </p>
                      <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">
                        Criar Campanha Promocional &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Sua agenda está saudável!</p>
                  <p className="text-xs text-slate-400 mt-1">Todas as semanas estão acima de 50% da meta.</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Dica do Especialista</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  "Semanas com baixa ocupação são ideais para oferecer serviços de ticket menor (lavagens, higienização) para atrair fluxo."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
