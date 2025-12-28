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
  Clock,
  Plus,
  Pencil,
  Trash2,
  Settings,
  HelpCircle,
  Info,
  X
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format, addWeeks, startOfWeek, endOfWeek, isWithinInterval, parseISO, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TransactionModal from '../components/TransactionModal';
import { FinancialTransaction, PaymentRate } from '../types';
import { useDialog } from '../context/DialogContext';

export default function Finance() {
  const { financialTransactions, workOrders, companySettings, updateCompanySettings, deleteFinancialTransaction } = useApp();
  const { showConfirm, showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'rates'>('overview');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);

  const [rates, setRates] = useState<PaymentRate[]>(companySettings.paymentRates || []);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(companySettings.monthlyGoal || 20000);

  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const handleRateChange = (index: number, field: keyof PaymentRate, value: any) => {
      const newRates = [...rates];
      newRates[index] = { ...newRates[index], [field]: value };
      setRates(newRates);
  };

  const handleSaveRates = () => {
      updateCompanySettings({ paymentRates: rates });
      showAlert({ title: 'Salvo', message: 'Taxas de pagamento atualizadas.', type: 'success' });
  };

  const handleSaveGoal = () => {
      updateCompanySettings({ monthlyGoal: tempGoal });
      setIsEditingGoal(false);
      showAlert({ title: 'Meta Atualizada', message: 'Sua meta mensal foi salva.', type: 'success' });
  };

  const metrics = {
    revenue: financialTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0),
    netRevenue: financialTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + (t.netAmount || t.amount), 0),
    expenses: financialTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    pending: financialTransactions
      .filter(t => t.status === 'pending')
      .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -Math.abs(t.amount)), 0)
  };

  const profit = metrics.netRevenue - metrics.expenses;
  const margin = metrics.netRevenue > 0 ? (profit / metrics.netRevenue) * 100 : 0;
  const totalFees = metrics.revenue - metrics.netRevenue;

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (t: FinancialTransaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    const confirm = await showConfirm({
        title: 'Excluir Transação',
        message: 'Tem certeza que deseja excluir este lançamento? O saldo será recalculado.',
        type: 'danger',
        confirmText: 'Sim, Excluir'
    });

    if (confirm) {
        deleteFinancialTransaction(id);
        showAlert({ title: 'Excluído', message: 'Lançamento removido com sucesso.', type: 'success' });
    }
  };

  const filteredTransactions = useMemo(() => {
    return financialTransactions.filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (filterDateStart && new Date(t.date) < new Date(filterDateStart)) return false;
        if (filterDateEnd && new Date(t.date) > new Date(filterDateEnd)) return false;
        return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [financialTransactions, filterType, filterCategory, filterDateStart, filterDateEnd]);

  const categories = useMemo(() => {
      const cats = new Set(financialTransactions.map(t => t.category));
      return ['all', ...Array.from(cats)];
  }, [financialTransactions]);

  const handleDownload = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Método', 'Tipo', 'Status', 'Valor Bruto', 'Taxa', 'Valor Líquido'];
    const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t => [
            new Date(t.date).toLocaleDateString('pt-BR'),
            `"${t.desc.replace(/"/g, '""')}"`,
            t.category,
            t.method,
            t.type === 'income' ? 'Receita' : 'Despesa',
            t.status === 'paid' ? 'Pago' : 'Pendente',
            t.amount.toFixed(2),
            (t.fee || 0).toFixed(2),
            (t.netAmount || t.amount).toFixed(2)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
      setFilterType('all');
      setFilterCategory('all');
      setFilterDateStart('');
      setFilterDateEnd('');
  };

  const forecastMetrics = useMemo(() => {
    const today = startOfDay(new Date());
    const monthlyGoal = companySettings.monthlyGoal || 20000;
    const weeklyGoal = monthlyGoal / 4;

    const next4Weeks = [0, 1, 2, 3].map(weekOffset => {
      const start = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
      const end = endOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
      
      const weekOrders = workOrders.filter(os => {
        if (!os.deadline) return false;
        const osDate = os.deadline.includes('/') ? parseISO(os.createdAt) : parseISO(os.createdAt); 
        return isWithinInterval(osDate, { start, end });
      });

      const weekManualIncome = financialTransactions.filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'income' && 
                 t.status === 'paid' && 
                 !t.desc.includes('OS #') && 
                 isWithinInterval(tDate, { start, end });
      }).reduce((acc, t) => acc + t.amount, 0);

      const guaranteedOS = weekOrders
        .filter(os => ['Aprovado', 'Em Andamento', 'Concluído', 'Aguardando Peças', 'Controle de Qualidade', 'Entregue'].includes(os.status))
        .reduce((acc, os) => acc + os.totalValue, 0);
      
      const guaranteed = guaranteedOS + weekManualIncome;

      const potential = weekOrders
        .filter(os => ['Orçamento', 'Pendente', 'Aguardando Aprovação', 'Aguardando'].includes(os.status))
        .reduce((acc, os) => acc + os.totalValue, 0);

      return {
        label: `Semana ${format(start, 'dd/MM')}`,
        start,
        guaranteed,
        potential,
        total: guaranteed + potential,
        count: weekOrders.length,
        manual: weekManualIncome
      };
    });

    const totalGuaranteed = next4Weeks.reduce((acc, w) => acc + w.guaranteed, 0);
    const totalPotential = next4Weeks.reduce((acc, w) => acc + w.potential, 0);
    
    const alerts = next4Weeks
      .filter(w => w.total < weeklyGoal * 0.5)
      .map(w => ({
        week: w.label,
        gap: weeklyGoal - w.total,
        severity: w.total === 0 ? 'high' : 'medium'
      }));

    return { weeks: next4Weeks, totalGuaranteed, totalPotential, alerts, weeklyGoal };
  }, [workOrders, financialTransactions, companySettings.monthlyGoal]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isModalOpen && (
        <TransactionModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            transaction={editingTransaction}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestão de fluxo de caixa e previsibilidade</p>
        </div>
        
        <div className="flex gap-3">
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
                Previsão
            </button>
            <button
                onClick={() => setActiveTab('rates')}
                className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'rates' 
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
            >
                <Settings size={16} />
                Taxas
            </button>
            </div>

            <button 
                onClick={handleNewTransaction}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
            >
                <Plus size={18} />
                Nova Transação
            </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <ArrowUpRight size={14} className="mr-1" /> Mês Atual
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Receita Bruta</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(metrics.revenue)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Líquido: {formatCurrency(metrics.netRevenue)}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Wallet className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                  <ArrowDownRight size={14} className="mr-1" /> Saídas
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
                  <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1">
                  Taxas Pagas
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Custo Financeiro</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalFees)}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Transações Recentes</h3>
              <div className="flex gap-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                        showFilters ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    )}
                >
                  <Filter size={20} />
                  <span className="hidden sm:inline">Filtrar</span>
                </button>
                <button 
                    onClick={handleDownload}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Download size={20} />
                  <span className="hidden sm:inline">Baixar CSV</span>
                </button>
              </div>
            </div>

            {showFilters && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Início</label>
                            <input 
                                type="date" 
                                value={filterDateStart}
                                onChange={e => setFilterDateStart(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Fim</label>
                            <input 
                                type="date" 
                                value={filterDateEnd}
                                onChange={e => setFilterDateEnd(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select 
                                value={filterType}
                                onChange={e => setFilterType(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                            >
                                <option value="all">Todos</option>
                                <option value="income">Receita</option>
                                <option value="expense">Despesa</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                            <select 
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                            >
                                <option value="all">Todas</option>
                                {categories.filter(c => c !== 'all').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-3">
                        <button 
                            onClick={clearFilters}
                            className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
                        >
                            <X size={12} /> Limpar Filtros
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor Bruto</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taxa</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Líquido</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-2 h-2 rounded-full mr-3",
                            transaction.type === 'income' ? "bg-green-500" : "bg-red-500"
                          )} />
                          <div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white block">
                                {transaction.desc}
                              </span>
                              <span className="text-xs text-slate-500">{transaction.method}</span>
                          </div>
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
                          transaction.status === 'paid' 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        )}>
                          {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                        transaction.type === 'income' ? "text-slate-700 dark:text-slate-300" : "text-red-600 dark:text-red-400"
                      )}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500 font-medium">
                        {transaction.fee && transaction.fee > 0 ? `-${formatCurrency(transaction.fee)}` : '-'}
                      </td>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                        transaction.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.netAmount || transaction.amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEditTransaction(transaction)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                      <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                              Nenhuma transação encontrada.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <HelpCircle size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Entenda seus Números</h3>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1 max-w-2xl leading-relaxed">
                          <strong>Receita Bruta (Visão Geral):</strong> Soma de tudo que entrou no caixa este mês (inclui serviços passados pagos agora e lançamentos manuais).<br/>
                          <strong>Previsão (Aqui):</strong> Soma apenas o que está agendado para a semana atual (OSs) + Lançamentos manuais desta semana.
                      </p>
                  </div>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase px-2">Meta Mensal:</span>
                  {isEditingGoal ? (
                      <div className="flex items-center gap-2">
                          <input 
                              type="number" 
                              value={tempGoal}
                              onChange={(e) => setTempGoal(Number(e.target.value))}
                              className="w-24 px-2 py-1 text-sm font-bold border rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              autoFocus
                          />
                          <button onClick={handleSaveGoal} className="p-1 bg-green-600 text-white rounded hover:bg-green-700"><CheckCircle2 size={14} /></button>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors" onClick={() => setIsEditingGoal(true)}>
                          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(companySettings.monthlyGoal || 20000)}</span>
                          <Pencil size={12} className="text-slate-400" />
                      </div>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <CheckCircle2 size={64} />
                </div>
                <p className="text-emerald-100 font-medium mb-1 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Garantido (Próx. 4 Semanas)
                </p>
                <h3 className="text-3xl font-bold mb-2">{formatCurrency(forecastMetrics.totalGuaranteed)}</h3>
                <p className="text-sm text-emerald-100 opacity-90">
                  OSs Aprovadas + Receitas Manuais
                </p>
             </div>

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

             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative">
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Projeção Total (30d)</p>
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
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-500" />
                Detalhamento Semanal
              </h3>
              
              <div className="space-y-6">
                {forecastMetrics.weeks.map((week, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{week.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">Meta Semanal: {formatCurrency(forecastMetrics.weeklyGoal)}</span>
                    </div>
                    
                    <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {week.guaranteed > 0 && (
                        <div 
                          className="bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center text-[10px] text-white font-bold relative group cursor-help"
                          style={{ width: `${Math.min(100, (week.guaranteed / forecastMetrics.weeklyGoal) * 100)}%` }}
                        >
                          <span className="hidden sm:inline">{formatCurrency(week.guaranteed)}</span>
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded whitespace-nowrap z-10 shadow-lg">
                            OSs: {formatCurrency(week.guaranteed - week.manual)} <br/>
                            Manuais: {formatCurrency(week.manual)}
                          </div>
                        </div>
                      )}
                      
                      {week.potential > 0 && (
                        <div 
                          className="bg-blue-400 hover:bg-blue-500 transition-colors flex items-center justify-center text-[10px] text-white font-bold relative group cursor-help opacity-80"
                          style={{ width: `${Math.min(100, (week.potential / forecastMetrics.weeklyGoal) * 100)}%` }}
                        >
                          <span className="hidden sm:inline">{formatCurrency(week.potential)}</span>
                           <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded whitespace-nowrap z-10 shadow-lg">
                            Potencial em Aberto: {formatCurrency(week.potential)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-1 text-xs">
                      <span className={cn("font-medium", (week.total / forecastMetrics.weeklyGoal) >= 1 ? "text-green-600" : "text-slate-500")}>
                        {((week.total / forecastMetrics.weeklyGoal) * 100).toFixed(0)}% da meta
                      </span>
                      <span className="text-slate-400">{week.count} agendamentos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rates' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Taxas de Pagamento</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Configure as taxas cobradas por cada método para calcular o valor líquido real.</p>
                      </div>
                      <button 
                          onClick={handleSaveRates}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                          <CheckCircle2 size={18} /> Salvar Taxas
                      </button>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Método</th>
                                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Tipo de Taxa</th>
                                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Valor da Taxa</th>
                                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Prazo Recebimento (Dias)</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {rates.map((rate, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                          {rate.method}
                                      </td>
                                      <td className="px-6 py-4">
                                          <select 
                                              value={rate.type}
                                              onChange={(e) => handleRateChange(idx, 'type', e.target.value)}
                                              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                          >
                                              <option value="percentage">Porcentagem (%)</option>
                                              <option value="fixed">Valor Fixo (R$)</option>
                                          </select>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                              <input 
                                                  type="number" 
                                                  step="0.01"
                                                  value={rate.rate}
                                                  onChange={(e) => handleRateChange(idx, 'rate', parseFloat(e.target.value))}
                                                  className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                              />
                                              <span className="text-slate-500 font-bold">
                                                  {rate.type === 'percentage' ? '%' : 'R$'}
                                              </span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                              <input 
                                                  type="number" 
                                                  value={rate.daysToReceive}
                                                  onChange={(e) => handleRateChange(idx, 'daysToReceive', parseInt(e.target.value))}
                                                  className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                              />
                                              <span className="text-slate-500 text-xs">dias</span>
                                          </div>
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
