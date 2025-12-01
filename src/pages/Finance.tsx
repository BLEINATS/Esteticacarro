import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  DollarSign,
  Download,
  Plus,
  X,
  Save,
  Pencil,
  Trash2,
  Filter,
  Search,
  Wallet,
  Calculator,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Landmark,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, cn, displayDate } from '../lib/utils';
import { useDialog } from '../context/DialogContext';
import { useApp } from '../context/AppContext';
import { FinancialTransaction } from '../types';

export default function Finance() {
  const { financialTransactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction } = useApp();
  const { showConfirm, showAlert } = useDialog();
  
  const [activeTab, setActiveTab] = useState<'cashflow' | 'payable' | 'receivable'>('cashflow');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  
  // Filtros de Data (Padrão: Mês atual para Extrato ficar mais limpo, ou vazio para tudo)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estado do Formulário
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    desc: '',
    amount: '',
    type: 'income' as 'income' | 'expense',
    category: 'Serviços',
    method: 'Pix',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    status: 'paid' as 'paid' | 'pending',
    feeRate: '0',
    installments: '1'
  });

  // --- CÁLCULO DE SALDOS PARA EXTRATO ESTILO BANCO ---
  const balanceData = useMemo(() => {
    const paid = financialTransactions.filter(t => t.status === 'paid');
    
    let initialBalance = 0;
    let transactions = paid;
    
    // Se há filtro de data, calcular saldo inicial
    if (startDate) {
      const startDate_obj = new Date(startDate);
      const beforeStart = paid.filter(t => new Date(t.date) < startDate_obj);
      initialBalance = beforeStart.reduce((acc, t) => acc + t.netAmount, 0);
      
      const endStr = endDate || '2100-01-01';
      transactions = paid.filter(t => t.date >= startDate && t.date <= endStr);
    } else {
      // Sem filtro: saldo inicial é a primeira transação
      if (paid.length > 0) {
        initialBalance = paid[0].netAmount || 15000.00;
        transactions = paid.slice(1);
      }
    }
    
    const totalMovement = transactions.reduce((acc, t) => acc + t.netAmount, 0);
    const finalBalance = initialBalance + totalMovement;
    
    return { initialBalance, transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), totalMovement, finalBalance };
  }, [financialTransactions, startDate, endDate]);

  // --- LÓGICA DE EXTRATO (LISTA PLANA) ---
  const visibleTransactions = useMemo(() => {
    // 1. Começar com transações do balanceData (já filtradas por data)
    let filtered = balanceData.transactions;

    // 2. Filtro de Texto
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(t => t.desc.toLowerCase().includes(lowerTerm));
    }

    // 3. Filtro de Categoria
    if (categoryFilter !== 'Todas') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }

    return filtered;
  }, [balanceData, searchTerm, categoryFilter]);

  // --- LÓGICA PARA CONTAS A PAGAR/RECEBER ---
  const pendingData = useMemo(() => {
    const list = financialTransactions.filter(t => t.status === 'pending');
    const payable = list.filter(t => t.type === 'expense');
    const receivable = list.filter(t => t.type === 'income');
    
    const totalPayable = payable.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const totalReceivable = receivable.reduce((acc, t) => acc + t.amount, 0);

    return { payable, receivable, totalPayable, totalReceivable };
  }, [financialTransactions]);


  // --- AÇÕES ---

  const handleEdit = (t: FinancialTransaction) => {
    const feeRate = t.amount !== 0 ? ((t.fee / t.amount) * 100).toFixed(2) : '0';
    setFormData({
      desc: t.desc,
      amount: Math.abs(t.amount).toString(),
      type: t.type,
      category: t.category,
      method: t.method,
      date: t.date,
      dueDate: t.dueDate,
      status: t.status,
      feeRate: feeRate,
      installments: t.installments ? t.installments.toString() : '1'
    });
    setEditingId(t.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Excluir Transação',
      message: 'Tem certeza que deseja excluir este lançamento?',
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      deleteFinancialTransaction(id);
      await showAlert({
        title: 'Excluído',
        message: 'Transação removida com sucesso.',
        type: 'success'
      });
    }
  };

  const handleSettle = async (id: number) => {
    const confirmed = await showConfirm({
        title: 'Confirmar Pagamento/Recebimento',
        message: 'Deseja marcar este lançamento como realizado?',
        type: 'info',
        confirmText: 'Sim, Confirmar',
        cancelText: 'Cancelar'
    });

    if (confirmed) {
        updateFinancialTransaction(id, { status: 'paid', date: new Date().toISOString().split('T')[0] });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    const feeRateVal = parseFloat(formData.feeRate) || 0;
    
    if (!formData.desc || isNaN(amountVal)) return;

    const feeValue = (amountVal * feeRateVal) / 100;
    const netVal = amountVal - feeValue;

    const newTransaction: FinancialTransaction = {
      id: editingId || Date.now(),
      desc: formData.desc,
      category: formData.category,
      amount: formData.type === 'expense' ? -amountVal : amountVal,
      netAmount: formData.type === 'expense' ? -amountVal : netVal,
      fee: formData.type === 'expense' ? 0 : feeValue,
      type: formData.type,
      date: formData.date,
      dueDate: formData.dueDate,
      method: formData.method,
      installments: parseInt(formData.installments) || 1,
      status: formData.status
    };

    if (editingId) {
      updateFinancialTransaction(editingId, newTransaction);
    } else {
      addFinancialTransaction(newTransaction);
    }

    closeModal();
    await showAlert({
        title: 'Sucesso',
        message: editingId ? 'Transação atualizada.' : 'Nova transação registrada.',
        type: 'success'
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      desc: '', amount: '', type: 'income', category: 'Serviços', 
      method: 'Pix', date: new Date().toISOString().split('T')[0], 
      dueDate: new Date().toISOString().split('T')[0],
      status: 'paid', feeRate: '0', installments: '1'
    });
  };

  return (
    <div className="space-y-8">
      {/* --- MODAL DE TRANSAÇÃO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingId ? 'Editar Lançamento' : 'Nova Transação'}
              </h3>
              <button onClick={closeModal}><X className="text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {/* Tipo de Transação */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-colors", formData.type === 'income' ? "bg-white dark:bg-slate-700 text-green-600 shadow-sm" : "text-slate-500")}
                >
                  Receita (Entrada)
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-colors", formData.type === 'expense' ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : "text-slate-500")}
                >
                  Despesa (Saída)
                </button>
              </div>

              {/* Status */}
              <div className="flex gap-4 items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Situação:</span>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="status" 
                        checked={formData.status === 'paid'} 
                        onChange={() => setFormData({...formData, status: 'paid'})}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Pago / Recebido</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="status" 
                        checked={formData.status === 'pending'} 
                        onChange={() => setFormData({...formData, status: 'pending'})}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Pendente (Agendar)</span>
                 </label>
              </div>

              {/* Descrição e Valor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                  <input 
                    required
                    type="text" 
                    value={formData.desc}
                    onChange={e => setFormData({...formData, desc: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    placeholder="Ex: Pagamento OS #123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Bruto (R$)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      {formData.status === 'pending' ? 'Vencimento' : 'Data Pagto'}
                  </label>
                  <input 
                    type="date" 
                    value={formData.status === 'pending' ? formData.dueDate : formData.date}
                    onChange={e => formData.status === 'pending' ? setFormData({...formData, dueDate: e.target.value}) : setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Categoria e Método */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option>Serviços</option>
                    <option>Produtos</option>
                    <option>Estoque</option>
                    <option>Comissões</option>
                    <option>RH</option>
                    <option>Aluguel/Fixo</option>
                    <option>Marketing</option>
                    <option>Manutenção</option>
                    <option>Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Método Pagto</label>
                  <select 
                    value={formData.method}
                    onChange={e => setFormData({...formData, method: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option>Pix</option>
                    <option>Dinheiro</option>
                    <option>Cartão Crédito</option>
                    <option>Cartão Débito</option>
                    <option>Boleto</option>
                    <option>Transferência</option>
                  </select>
                </div>
              </div>

              {/* Área de Taxas e Parcelas (Apenas se for Receita) */}
              {formData.type === 'income' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Calculator size={16} className="text-blue-600" />
                    Cálculo de Taxas (MDR)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Taxa Maquininha (%)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01"
                          value={formData.feeRate}
                          onChange={e => setFormData({...formData, feeRate: e.target.value})}
                          className="w-full pl-3 pr-6 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 text-xs">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Parcelas</label>
                      <select 
                        value={formData.installments}
                        onChange={e => setFormData({...formData, installments: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                      >
                        {[1,2,3,4,5,6,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                      </select>
                    </div>
                  </div>
                  {parseFloat(formData.feeRate) > 0 && formData.amount && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600 text-sm">
                      <span className="text-slate-500">Valor Líquido Estimado:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(parseFloat(formData.amount) * (1 - parseFloat(formData.feeRate)/100))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
                <Save size={18} /> {editingId ? 'Salvar Alterações' : 'Lançar Transação'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão de fluxo de caixa, contas a pagar e receber.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={18} />
            Relatório
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* --- ABAS DE NAVEGAÇÃO --- */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
            { id: 'cashflow', label: 'Extrato (Realizado)', icon: Landmark },
            { id: 'payable', label: 'A Pagar', icon: ArrowDownRight },
            { id: 'receivable', label: 'A Receber', icon: ArrowUpRight }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                    activeTab === tab.id 
                        ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
            >
                <tab.icon size={18} />
                {tab.label}
            </button>
        ))}
      </div>

      {/* --- CONTEÚDO DA ABA --- */}
      {activeTab === 'cashflow' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* EXTRATO ESTILO BANCO COM SALDO INICIAL E FINAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Saldo Inicial */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Saldo Inicial</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(balanceData.initialBalance)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Período anterior</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                    <Landmark size={24} />
                  </div>
                </div>
              </div>

              {/* Movimento do Período */}
              <div className={cn("bg-gradient-to-br rounded-xl border p-6 shadow-sm", 
                balanceData.totalMovement >= 0 
                  ? "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800" 
                  : "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Movimento</p>
                    <p className={cn("text-2xl font-bold", balanceData.totalMovement >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                      {formatCurrency(balanceData.totalMovement)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{visibleTransactions.length} transações</p>
                  </div>
                  <div className={cn("p-3 rounded-full", balanceData.totalMovement >= 0 ? "bg-green-200 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-200 dark:bg-red-900/30 text-red-600 dark:text-red-400")}>
                    {balanceData.totalMovement >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                  </div>
                </div>
              </div>

              {/* Saldo Final */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 rounded-xl border border-slate-700 dark:border-slate-800 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Saldo Final</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(balanceData.finalBalance)}</p>
                    <p className="text-xs text-slate-400 mt-2">Saldo Atual</p>
                  </div>
                  <div className="p-3 bg-slate-700 dark:bg-slate-800 rounded-full text-slate-300">
                    <Wallet size={24} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* FILTROS E TABELA */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                        type="text" 
                        placeholder="Buscar no extrato..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 transition-colors text-sm"
                        />
                    </div>
                    
                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 px-2">
                            <Calendar size={16} className="text-slate-400" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none w-32"
                                title="Data Inicial"
                            />
                        </div>
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                        <div className="flex items-center gap-2 px-2">
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-600 dark:text-slate-300 focus:outline-none w-32"
                                title="Data Final"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                                title="Limpar Filtro de Data"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                        {['Todas', 'Serviços', 'Estoque', 'Comissões', 'RH', 'Manutenção', 'Aluguel/Fixo'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border",
                            categoryFilter === cat 
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" 
                                : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            {cat}
                        </button>
                        ))}
                    </div>
                </div>

                {/* EXTRATO SIMPLIFICADO (SEM AGRUPAMENTO) */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-32">Data</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Categoria</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Valor</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {visibleTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <DollarSign size={32} className="opacity-50" />
                                            <p>Nenhuma transação no período</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                visibleTransactions.map((t, idx) => {
                                    // Calcular saldo acumulado até esta transação
                                    const accumulatedBalance = balanceData.initialBalance + 
                                      visibleTransactions.slice(0, idx + 1).reduce((acc, tx) => acc + tx.netAmount, 0);
                                    
                                    return (
                                    <tr key={t.id} className={cn(
                                        "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group",
                                        t.type === 'income' ? "bg-green-50/30 dark:bg-green-900/5" : ""
                                    )}>
                                        <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-medium">
                                            {displayDate(t.date)}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <span>{t.desc}</span>
                                                <span className="text-[10px] text-slate-400 font-normal px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                                    {t.method} {t.installments && t.installments > 1 && `• ${t.installments}x`}
                                                </span>
                                            </div>
                                        </td>
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className={cn(
                                        "px-6 py-3 text-right font-bold",
                                        t.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        <div>
                                            {t.type === 'income' ? '+' : ''} {formatCurrency(t.type === 'income' ? (t.netAmount ?? t.amount) : Math.abs(t.amount))}
                                        </div>
                                        {t.type === 'income' && t.fee > 0 && (
                                            <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                                                Bruto: {formatCurrency(t.amount)} (-{formatCurrency(t.fee)})
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEdit(t)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                                                title="Editar"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(t.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {visibleTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Nenhuma transação encontrada para este período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      ) : (
        // --- ABAS DE CONTAS A PAGAR / RECEBER (Mantido layout anterior simplificado) ---
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={cn("p-6 rounded-xl text-white shadow-lg", activeTab === 'payable' ? "bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/20" : "bg-gradient-to-br from-green-600 to-green-800 shadow-green-900/20")}>
                    <p className={cn("text-sm font-medium mb-1 flex items-center gap-2", activeTab === 'payable' ? "text-red-100" : "text-green-100")}>
                        {activeTab === 'payable' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                        Total {activeTab === 'payable' ? 'a Pagar' : 'a Receber'}
                    </p>
                    <h3 className="text-3xl font-bold mb-2">
                        {formatCurrency(activeTab === 'payable' ? pendingData.totalPayable : pendingData.totalReceivable)}
                    </h3>
                    <p className={cn("text-xs opacity-80", activeTab === 'payable' ? "text-red-200" : "text-green-200")}>
                        {activeTab === 'payable' ? 'Contas pendentes' : 'Previsão de entrada'}
                    </p>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Vencimento</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Categoria</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Valor</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(activeTab === 'payable' ? pendingData.payable : pendingData.receivable).map(t => {
                            const isLate = new Date(t.dueDate) < new Date() && new Date(t.dueDate).toDateString() !== new Date().toDateString();
                            return (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <CalendarClock size={14} className={isLate ? "text-red-500" : "text-slate-400"} />
                                            <span className={cn(isLate ? "text-red-600 font-bold" : "")}>
                                                {displayDate(t.dueDate)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{t.desc}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className={cn("px-6 py-4 text-right font-bold", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                                        {formatCurrency(Math.abs(t.amount))}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleSettle(t.id)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors" 
                                                title={t.type === 'income' ? "Receber" : "Pagar"}
                                            >
                                                <CheckCircle2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(t)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(t.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {(activeTab === 'payable' ? pendingData.payable : pendingData.receivable).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    Nenhuma conta pendente.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
      )}
    </div>
  );
}
