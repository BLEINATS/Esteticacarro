import React, { useState } from 'react';
import { Users, Award, TrendingUp, DollarSign, Settings, Plus, Minus, Trash2, UserPlus, Filter, Calendar, Pencil, Save, X, Briefcase, Wallet } from 'lucide-react';
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
    addFinancialTransaction // NOVO: Importar função do financeiro
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
      // FIXED: Ensure ID is unique and amount is negative for expense
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
        if (employee.salaryType === 'fixed') {
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
        date: formatDateToLocalInput(trans.date), // CORREÇÃO: Usa a data local para o input
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
      {/* Modal de Vale */}
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Equipe & RH</h2>
          <p className="text-slate-500 dark:text-slate-400">Produtividade, comissões e fechamento de folha.</p>
        </div>
        <button 
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
            <UserPlus size={18} />
            Novo Funcionário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {employees.map((member) => (
          <div key={member.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
              </div>
              <div className="ml-auto flex gap-1">
                <button 
                    onClick={() => openEditModal(member)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar"
                >
                    <Settings size={18} />
                </button>
                <button 
                    onClick={() => handleDeleteEmployee(member.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Excluir"
                >
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Modelo</span>
                <span className="font-medium text-slate-900 dark:text-white">
                    {member.salaryType === 'fixed' 
                        ? `Fixo: ${formatCurrency(member.fixedSalary)}` 
                        : `${member.commissionRate}% (${member.commissionBase === 'gross' ? 'Bruto' : 'Líquido'})`
                    }
                </span>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 mt-2">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500 uppercase">Saldo a Receber</span>
                   <span className={cn("text-lg font-bold", member.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                        {formatCurrency(member.balance)}
                   </span>
                </div>
                
                <div className="flex flex-col gap-2 mt-2">
                    {member.salaryType === 'fixed' && (
                        <button 
                            onClick={() => handleCreditSalary(member)}
                            className="w-full py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1"
                        >
                            <Wallet size={12} /> Lançar Salário
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setSelectedEmployee(member); setIsValeModalOpen(true); }}
                            className="flex-1 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <Minus size={12} /> Vale
                        </button>
                        <button 
                            onClick={() => handlePayBalance(member)}
                            className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                            <DollarSign size={12} /> Pagar
                        </button>
                    </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                    <TrendingUp size={12} /> Eficiência (Tempo)
                  </span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">92%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
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
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Funcionário</th>
                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Valor</th>
                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">
                    {employees.find(e => e.id === t.employeeId)?.name || 'Funcionário Removido'}
                    </td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{t.description}</td>
                    <td className="px-6 py-3">
                    <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        t.type === 'commission' || t.type === 'salary' ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : 
                        t.type === 'payment' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                        {t.type === 'commission' ? 'Comissão' : t.type === 'salary' ? 'Salário' : t.type === 'payment' ? 'Pagamento' : 'Vale / Saída'}
                    </span>
                    </td>
                    <td className={cn("px-6 py-3 text-right font-bold", t.type === 'commission' || t.type === 'salary' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                    {t.type === 'commission' || t.type === 'salary' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleEditTransaction(t)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" 
                                title="Editar"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                                title="Excluir"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
                {filteredTransactions.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum lançamento encontrado para este período.</td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
