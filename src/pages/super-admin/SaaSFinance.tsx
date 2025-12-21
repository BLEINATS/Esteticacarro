import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, 
  Filter, Calendar, ArrowUpRight, ArrowDownRight, Server, 
  Megaphone, MessageSquare, CreditCard, Wallet
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { formatCurrency, cn } from '../../lib/utils';
import { useDialog } from '../../context/DialogContext';
import { SaaSTransaction } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function SaaSFinance() {
  const { financialMetrics, saasTransactions, addSaaSTransaction, deleteSaaSTransaction, totalMRR } = useSuperAdmin();
  const { showConfirm, showAlert } = useDialog();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<SaaSTransaction>>({
      description: '',
      amount: 0,
      type: 'expense',
      category: 'infrastructure',
      date: new Date().toISOString().split('T')[0]
  });

  const handleAddTransaction = () => {
      if (!newTransaction.description || !newTransaction.amount) return;
      
      addSaaSTransaction({
          id: `saas-tx-${Date.now()}`,
          description: newTransaction.description,
          amount: Number(newTransaction.amount),
          type: newTransaction.type as 'income' | 'expense',
          category: newTransaction.category as any,
          date: newTransaction.date || new Date().toISOString()
      });
      
      setIsModalOpen(false);
      setNewTransaction({
          description: '',
          amount: 0,
          type: 'expense',
          category: 'infrastructure',
          date: new Date().toISOString().split('T')[0]
      });
      showAlert({ title: 'Sucesso', message: 'Transação registrada.', type: 'success' });
  };

  const handleDelete = async (id: string) => {
      const confirm = await showConfirm({
          title: 'Excluir Transação',
          message: 'Tem certeza que deseja excluir este registro?',
          type: 'danger',
          confirmText: 'Excluir'
      });
      if (confirm) {
          deleteSaaSTransaction(id);
      }
  };

  // Chart Data
  const expenseData = [
      { name: 'Infraestrutura', value: saasTransactions.filter(t => t.category === 'infrastructure').reduce((acc, t) => acc + t.amount, 0) },
      { name: 'Marketing', value: saasTransactions.filter(t => t.category === 'marketing').reduce((acc, t) => acc + t.amount, 0) },
      { name: 'API / Tokens', value: saasTransactions.filter(t => t.category === 'api_costs').reduce((acc, t) => acc + t.amount, 0) },
      { name: 'Pessoal', value: saasTransactions.filter(t => t.category === 'personnel').reduce((acc, t) => acc + t.amount, 0) },
      { name: 'Outros', value: saasTransactions.filter(t => t.category === 'other').reduce((acc, t) => acc + t.amount, 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Nova Transação SaaS</h3>
                  <div className="space-y-4">
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          <button 
                            onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                            className={cn("flex-1 py-2 rounded-md text-sm font-bold", newTransaction.type === 'expense' ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : "text-slate-500")}
                          >
                              Despesa
                          </button>
                          <button 
                            onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                            className={cn("flex-1 py-2 rounded-md text-sm font-bold", newTransaction.type === 'income' ? "bg-white dark:bg-slate-700 text-green-600 shadow-sm" : "text-slate-500")}
                          >
                              Receita Extra
                          </button>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                          <input 
                              type="text" 
                              value={newTransaction.description}
                              onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              placeholder="Ex: Servidor AWS"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                              <input 
                                  type="number" 
                                  value={newTransaction.amount}
                                  onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                              <select 
                                  value={newTransaction.category}
                                  onChange={e => setNewTransaction({...newTransaction, category: e.target.value as any})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              >
                                  <option value="infrastructure">Infraestrutura</option>
                                  <option value="marketing">Marketing</option>
                                  <option value="api_costs">Custos API / Tokens</option>
                                  <option value="personnel">Pessoal / Equipe</option>
                                  <option value="other">Outros</option>
                              </select>
                          </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg text-slate-500 font-bold">Cancelar</button>
                          <button onClick={handleAddTransaction} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Salvar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro SaaS</h1>
            <p className="text-slate-500 dark:text-slate-400">Controle de receitas, despesas e lucratividade.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
        >
            <Plus size={18} /> Nova Transação
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><DollarSign size={20} /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Receita Total</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(financialMetrics.revenue)}</p>
              <p className="text-xs text-slate-500 mt-1">MRR + Vendas de Token</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600"><TrendingDown size={20} /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Despesas</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(financialMetrics.expenses)}</p>
              <p className="text-xs text-slate-500 mt-1">Operacional + Marketing</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Wallet size={20} /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Lucro Líquido</p>
              </div>
              <p className={cn("text-2xl font-bold", financialMetrics.profit >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatCurrency(financialMetrics.profit)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Resultado Final</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600"><TrendingUp size={20} /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Margem</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{financialMetrics.margin.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">Eficiência</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expense Breakdown Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Composição de Despesas</h3>
              <div className="h-[250px] w-full">
                  {expenseData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={expenseData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {expenseData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                          Sem despesas registradas.
                      </div>
                  )}
              </div>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">Extrato de Lançamentos Manuais</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[300px]">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                          <tr>
                              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Categoria</th>
                              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Valor</th>
                              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {saasTransactions.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-6 py-3 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{t.description}</td>
                                  <td className="px-6 py-3">
                                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 capitalize">
                                          {t.category === 'api_costs' ? 'API / Tokens' : t.category === 'infrastructure' ? 'Infra' : t.category}
                                      </span>
                                  </td>
                                  <td className={cn("px-6 py-3 text-right font-bold", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                      <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                          <Trash2 size={16} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {saasTransactions.length === 0 && (
                              <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhuma transação manual.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
}
