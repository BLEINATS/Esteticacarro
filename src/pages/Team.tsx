import React, { useState, useMemo } from 'react';
import { Users, Award, TrendingUp, DollarSign, Settings, Plus, Minus, Trash2, UserPlus, Filter, Calendar, Pencil, Save, X, Briefcase, Wallet, Star, Clock, Lock } from 'lucide-react';
import { formatCurrency, cn, formatDateToLocalInput } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { Employee, EmployeeTransaction } from '../types';
import { useDialog } from '../context/DialogContext';
import EmployeeModal from '../components/EmployeeModal';

export default function Team() {
  const { 
    employees, 
    employeeTransactions, 
    addEmployeeTransaction, 
    updateEmployeeTransaction, 
    deleteEmployeeTransaction, 
    deleteEmployee,
    addFinancialTransaction,
    workOrders,
    services,
    checkLimit,
    planLimits
  } = useApp();
  const { showConfirm, showAlert } = useDialog();
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Modals State
  const [isValeModalOpen, setIsValeModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<EmployeeTransaction | null>(null);
  
  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Vale Form
  const [valeAmount, setValeAmount] = useState('');
  const [valeDesc, setValeDesc] = useState('');

  // Transaction Form
  const [transForm, setTransForm] = useState({
    amount: '',
    description: '',
    date: '',
    type: 'commission' as 'commission' | 'advance' | 'payment' | 'salary'
  });

  // --- ANALYTICS LOGIC ---
  const employeeMetrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return employees.map(emp => {
        // Filter Completed WorkOrders for this employee in current month
        const empWorkOrders = workOrders.filter(os => 
            os.status === 'Concluído' && 
            os.technician === emp.name && 
            new Date(os.createdAt).getMonth() === currentMonth &&
            new Date(os.createdAt).getFullYear() === currentYear
        );

        const totalRevenue = empWorkOrders.reduce((acc, os) => acc + (os.totalValue || 0), 0);
        const completedServices = empWorkOrders.length;
        const averageTicket = completedServices > 0 ? totalRevenue / completedServices : 0;

        // Estimate Hours Worked based on Standard Time of services
        let totalMinutes = 0;
        empWorkOrders.forEach(os => {
            if (os.serviceIds && os.serviceIds.length > 0) {
                os.serviceIds.forEach(id => {
                    const s = services.find(srv => srv.id === id);
                    if (s) totalMinutes += s.standardTimeMinutes;
                });
            } else if (os.serviceId) {
                const s = services.find(srv => srv.id === os.serviceId);
                if (s) totalMinutes += s.standardTimeMinutes;
            } else {
                // Fallback if no ID (legacy)
                totalMinutes += 60; // Assume 1h default
            }
        });
        
        const estimatedHours = totalMinutes / 60;
        const revenuePerHour = estimatedHours > 0 ? totalRevenue / estimatedHours : 0;

        return {
            ...emp,
            metrics: {
                totalRevenue,
                completedServices,
                averageTicket,
                estimatedHours,
                revenuePerHour
            }
        };
    }).sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue); // Sort by Revenue for Ranking
  }, [employees, workOrders, services]);

  const topPerformer = employeeMetrics.length > 0 ? employeeMetrics[0] : null;
  const mostEfficient = [...employeeMetrics].sort((a, b) => b.metrics.revenuePerHour - a.metrics.revenuePerHour)[0];

  // --- ACTIONS ---

  const handleAddVale = () => {
    if (selectedEmployee && valeAmount) {
      const amount = parseFloat(valeAmount);
      const description = valeDesc || 'Vale / Adiantamento';
      const date = new Date().toISOString();

      // 1. Registra no RH
      addEmployeeTransaction({
        id: `adv-${Date.now()}`,
        employeeId: selectedEmployee.id,
        type: 'advance',
        amount: amount,
        description: description,
        date: date
      });

      // 2. Registra no Financeiro (Saída)
      addFinancialTransaction({
        id: Date.now() + Math.floor(Math.random() * 1000), // Avoid collision
        desc: `Vale - ${selectedEmployee.name}: ${description}`,
        category: 'RH',
        amount: -amount, // Saída é negativo
        netAmount: -amount,
        fee: 0,
        type: 'expense',
        date: date.split('T')[0], // Use YYYY-MM-DD
        dueDate: date.split('T')[0],
        method: 'Transferência',
        status: 'paid'
      });

      setIsValeModalOpen(false);
      setValeAmount('');
      setValeDesc('');
      showAlert({ title: 'Sucesso', message: 'Vale lançado no RH e Financeiro.', type: 'success' });
    }
  };

  const handleCreditSalary = async (employee: Employee) => {
    const confirmed = await showConfirm({
        title: 'Lançar Salário Mensal',
        message: `Confirma o crédito do salário fixo de ${formatCurrency(employee.fixedSalary)} para ${employee.name}? Isso aumentará o saldo a receber.`,
        type: 'info',
        confirmText: 'Sim, Lançar'
    });

    if (confirmed) {
        addEmployeeTransaction({
            id: `sal-${Date.now()}`,
            employeeId: employee.id,
            type: 'salary',
            amount: employee.fixedSalary,
            description: 'Salário Mensal',
            date: new Date().toISOString()
        });
        showAlert({ title: 'Sucesso', message: 'Salário creditado no saldo do funcionário.', type: 'success' });
    }
  };

  const handlePayBalance = async (employee: Employee) => {
    if (employee.balance <= 0) {
        if (employee.salaryType === 'fixed' || employee.salaryType === 'mixed') {
             showAlert({ 
                title: 'Saldo Insuficiente', 
                message: `O saldo atual é ${formatCurrency(employee.balance)}. Se você já descontou vales, lembre-se de clicar em "Lançar Salário" primeiro para creditar o valor mensal e regularizar a conta.`, 
                type: 'warning' 
            });
        } else {
            showAlert({ title: 'Saldo Zerado', message: 'Este funcionário não tem saldo positivo a receber.', type: 'info' });
        }
        return;
    }

    const confirmed = await showConfirm({
        title: 'Realizar Pagamento',
        message: `Confirma o pagamento de ${formatCurrency(employee.balance)} para ${employee.name}? Isso zerará o saldo atual e lançará uma despesa no financeiro.`,
        type: 'success',
        confirmText: 'Confirmar Pagamento'
    });

    if (confirmed) {
        const amount = employee.balance;
        const date = new Date().toISOString();

        // 1. Registra no RH
        addEmployeeTransaction({
            id: `pay-${Date.now()}`,
            employeeId: employee.id,
            type: 'payment',
            amount: amount,
            description: 'Pagamento de Saldo / Fechamento',
            date: date
        });

        // 2. Registra no Financeiro (Saída)
        addFinancialTransaction({
            id: Date.now() + Math.floor(Math.random() * 1000), // Avoid collision
            desc: `Pagamento Saldo - ${employee.name}`,
            category: 'RH',
            amount: -amount, // Saída é negativo
            netAmount: -amount,
            fee: 0,
            type: 'expense',
            date: date.split('T')[0],
            dueDate: date.split('T')[0],
            method: 'Transferência',
            status: 'paid'
        });

        showAlert({ title: 'Pago!', message: 'Pagamento registrado no RH e Financeiro.', type: 'success' });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const confirmed = await showConfirm({
        title: 'Excluir Funcionário',
        message: 'Tem certeza? O histórico financeiro será mantido, mas o acesso será revogado.',
        type: 'danger',
        confirmText: 'Sim, Excluir'
    });

    if (confirmed) {
        deleteEmployee(id);
        showAlert({ title: 'Excluído', message: 'Funcionário removido.', type: 'success' });
    }
  };

  // Transaction CRUD
  const handleEditTransaction = (trans: EmployeeTransaction) => {
    setEditingTransaction(trans);
    setTransForm({
        amount: trans.amount.toString(),
        description: trans.description,
        date: formatDateToLocalInput(trans.date),
        type: trans.type
    });
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    const confirmed = await showConfirm({
        title: 'Excluir Lançamento',
        message: 'Tem certeza? O saldo do funcionário será recalculado.',
        type: 'danger',
        confirmText: 'Sim, Excluir'
    });

    if (confirmed) {
        deleteEmployeeTransaction(id);
        showAlert({ title: 'Excluído', message: 'Lançamento removido e saldo atualizado.', type: 'success' });
    }
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
        updateEmployeeTransaction(editingTransaction.id, {
            amount: parseFloat(transForm.amount),
            description: transForm.description,
            date: new Date(transForm.date).toISOString(),
            type: transForm.type
        });
        setIsTransactionModalOpen(false);
        showAlert({ title: 'Atualizado', message: 'Lançamento corrigido com sucesso.', type: 'success' });
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const openNewModal = () => {
    if (!checkLimit('employees', employees.length)) {
        showAlert({ 
            title: 'Limite Atingido', 
            message: `Seu plano atual permite apenas ${planLimits.maxEmployees} funcionários. Faça upgrade para adicionar mais.`, 
            type: 'warning' 
        });
        return;
    }
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  // Filter Logic
  const filteredTransactions = employeeTransactions.filter(t => {
    const matchesEmployee = filterEmployeeId === 'all' || t.employeeId === filterEmployeeId;
    const matchesDate = t.date.startsWith(filterMonth);
    return matchesEmployee && matchesDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* ... (Existing Modals) ... */}
      {isValeModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Lançar Vale para {selectedEmployee.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={valeAmount}
                  onChange={(e) => setValeAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo</label>
                <input 
                  type="text" 
                  value={valeDesc}
                  onChange={(e) => setValeDesc(e.target.value)}
                  placeholder="Ex: Adiantamento quinzenal"
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                />
              </div>
              <button onClick={handleAddVale} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                Confirmar Desconto
              </button>
              <button onClick={() => setIsValeModalOpen(false)} className="w-full py-2 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Transação */}
      {isTransactionModalOpen && editingTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Editar Lançamento</h3>
                <button onClick={() => setIsTransactionModalOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                <select 
                    value={transForm.type}
                    onChange={(e) => setTransForm({...transForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                >
                    <option value="commission">Comissão (+)</option>
                    <option value="salary">Salário (+)</option>
                    <option value="advance">Vale / Adiantamento (-)</option>
                    <option value="payment">Pagamento (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={transForm.amount}
                  onChange={(e) => setTransForm({...transForm, amount: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                <input 
                  type="text" 
                  value={transForm.description}
                  onChange={(e) => setTransForm({...transForm, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                <input 
                  type="date" 
                  value={transForm.date}
                  onChange={(e) => setTransForm({...transForm, date: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Save size={18} /> Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Funcionário (Add/Edit) */}
      {isEmployeeModalOpen && (
        <EmployeeModal 
            employee={editingEmployee} 
            onClose={() => setIsEmployeeModalOpen(false)} 
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Equipe & Performance</h2>
          <p className="text-slate-500 dark:text-slate-400">Acompanhe produtividade, comissões e ranking.</p>
        </div>
        <button 
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
            <UserPlus size={18} />
            Novo Funcionário
        </button>
      </div>

      {/* Limit Warning if applicable */}
      {employees.length >= planLimits.maxEmployees && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg flex items-center gap-3">
              <Lock size={20} className="text-amber-600 dark:text-amber-400" />
              <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Limite de Funcionários Atingido</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Seu plano atual permite no máximo {planLimits.maxEmployees} funcionários. Faça upgrade para adicionar mais.</p>
              </div>
          </div>
      )}

      {/* PERFORMANCE DASHBOARD */}
      {employeeMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performer Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg"><Award size={24} className="text-yellow-300" /></div>
                        <div>
                            <h3 className="font-bold text-lg">Campeão de Vendas</h3>
                            <p className="text-indigo-200 text-xs uppercase font-bold">Destaque do Mês</p>
                        </div>
                    </div>
                    
                    {topPerformer && (
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-bold">{topPerformer.name}</p>
                                <p className="text-indigo-100 text-sm mt-1">{topPerformer.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-yellow-300">{formatCurrency(topPerformer.metrics.totalRevenue)}</p>
                                <p className="text-indigo-200 text-xs">Faturamento Gerado</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Efficiency Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><TrendingUp size={24} /></div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Maior Eficiência</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Receita por Hora</p>
                    </div>
                </div>

                {mostEfficient && (
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{mostEfficient.name}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{mostEfficient.metrics.completedServices} serviços realizados</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(mostEfficient.metrics.revenuePerHour)}/h</p>
                            <p className="text-slate-400 text-xs">Média Estimada</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* EMPLOYEE LIST WITH METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employeeMetrics.map((emp, idx) => (
          <div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative group">
            {/* Rank Badge */}
            <div className={cn(
                "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2",
                idx === 0 ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600" :
                idx === 1 ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600" :
                idx === 2 ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-600" :
                "bg-transparent text-slate-400 border-transparent"
            )}>
                {idx + 1}º
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                {emp.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{emp.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">{emp.role}</p>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Gerado (Mês)</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(emp.metrics.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Ticket Médio</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(emp.metrics.averageTicket)}</p>
                </div>
            </div>

            {/* Balance Section */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 mb-4">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1">
                        <Wallet size={12} /> Saldo a Receber
                   </span>
                   <span className={cn("text-lg font-bold", emp.balance > 0 ? "text-green-600 dark:text-green-400" : "text-slate-500")}>
                        {formatCurrency(emp.balance)}
                   </span>
                </div>
                
                <div className="flex flex-col gap-2 mt-3">
                    {(emp.salaryType === 'fixed' || emp.salaryType === 'mixed') && (
                        <button 
                            onClick={() => handleCreditSalary(emp)}
                            className="w-full py-1.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            Lançar Salário Fixo
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setSelectedEmployee(emp); setIsValeModalOpen(true); }}
                            className="flex-1 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Vale
                        </button>
                        <button 
                            onClick={() => handlePayBalance(emp)}
                            className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                        >
                            Pagar Saldo
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                    onClick={() => openEditModal(emp)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Configurações"
                >
                    <Settings size={16} />
                </button>
                <button 
                    onClick={() => handleDeleteEmployee(emp.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Excluir"
                >
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Lista de Transações Recentes */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
           <h3 className="font-bold text-slate-900 dark:text-white">Extrato de Comissões e Vales</h3>
           
           <div className="flex gap-3">
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="month" 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                    value={filterEmployeeId}
                    onChange={(e) => setFilterEmployeeId(e.target.value)}
                    className="pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                    <option value="all">Todos Funcionários</option>
                    {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                </select>
             </div>
           </div>
        </div>
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                <th className="px-4 sm:px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Data</th>
                <th className="px-4 sm:px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Funcionário</th>
                <th className="px-4 sm:px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Descrição</th>
                <th className="px-4 sm:px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Tipo</th>
                <th className="px-4 sm:px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right text-xs sm:text-sm">Valor</th>
                <th className="px-4 sm:px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right text-xs sm:text-sm">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-900 dark:text-white text-xs sm:text-sm">
                    {employees.find(e => e.id === t.employeeId)?.name || 'Removido'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{t.description}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                    <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold",
                        t.type === 'commission' || t.type === 'salary' ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : 
                        t.type === 'payment' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                        {t.type === 'commission' ? 'Comissão' : t.type === 'salary' ? 'Salário' : t.type === 'payment' ? 'Pagamento' : 'Vale'}
                    </span>
                    </td>
                    <td className={cn("px-4 sm:px-6 py-3 text-right font-bold text-xs sm:text-sm", t.type === 'commission' || t.type === 'salary' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                    {t.type === 'commission' || t.type === 'salary' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                            <button 
                                onClick={() => handleEditTransaction(t)}
                                className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                                title="Editar"
                            >
                                <Pencil size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <button 
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1 sm:p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors" 
                                title="Excluir"
                            >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
                {filteredTransactions.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-slate-400">Nenhum lançamento.</td>
                </tr>
                )}
            </tbody>
            </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2 p-3">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {employees.find(e => e.id === t.employeeId)?.name || 'Removido'}
                  </p>
                </div>
                <p className={cn("text-sm font-bold", t.type === 'commission' || t.type === 'salary' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                  {t.type === 'commission' || t.type === 'salary' ? '+' : '-'} {formatCurrency(t.amount)}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t.description}</p>
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold",
                  t.type === 'commission' || t.type === 'salary' ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : 
                  t.type === 'payment' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                  "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                )}>
                  {t.type === 'commission' ? 'Comissão' : t.type === 'salary' ? 'Salário' : t.type === 'payment' ? 'Pagamento' : 'Vale'}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEditTransaction(t)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteTransaction(t.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-slate-400">Nenhum lançamento encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
