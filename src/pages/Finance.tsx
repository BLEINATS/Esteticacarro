import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  DollarSign,
  Download,
  PieChart,
  Plus,
  X,
  Save
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

const initialTransactions = [
  { id: 1, desc: 'Pagamento OS #4092 - BMW X5', category: 'Serviços', amount: 2500.00, type: 'income', date: 'Hoje, 14:30', method: 'Cartão Crédito (3x)' },
  { id: 2, desc: 'Compra de Insumos - Polimento', category: 'Estoque', amount: -450.00, type: 'expense', date: 'Hoje, 10:15', method: 'Boleto' },
  { id: 3, desc: 'Pagamento Funcionários - Adiantamento', category: 'RH', amount: -3200.00, type: 'expense', date: 'Ontem', method: 'Transferência' },
  { id: 4, desc: 'Serviço Avulso - Higienização', category: 'Serviços', amount: 350.00, type: 'income', date: 'Ontem', method: 'Pix' },
  { id: 5, desc: 'Manutenção Compressores', category: 'Manutenção', amount: -890.00, type: 'expense', date: '12/03/2024', method: 'Cartão Débito' },
];

export default function Finance() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState({
    desc: '',
    amount: '',
    type: 'income',
    category: 'Serviços',
    method: 'Pix'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTrans.amount);
    if (!newTrans.desc || isNaN(amount)) return;

    const transaction = {
      id: Date.now(),
      desc: newTrans.desc,
      category: newTrans.category,
      amount: newTrans.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      type: newTrans.type,
      date: 'Hoje, Agora',
      method: newTrans.method
    };

    setTransactions([transaction, ...transactions]);
    setIsModalOpen(false);
    setNewTrans({ desc: '', amount: '', type: 'income', category: 'Serviços', method: 'Pix' });
  };

  // Calculate totals
  const totalBalance = transactions.reduce((acc, t) => acc + t.amount, 42300.50);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 128500.00);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 86200.00);

  return (
    <div className="space-y-8">
      {/* Modal Nova Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Nova Transação</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setNewTrans({...newTrans, type: 'income'})}
                  className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-colors", newTrans.type === 'income' ? "bg-white dark:bg-slate-700 text-green-600 shadow-sm" : "text-slate-500")}
                >
                  Entrada
                </button>
                <button 
                  type="button"
                  onClick={() => setNewTrans({...newTrans, type: 'expense'})}
                  className={cn("flex-1 py-2 rounded-md text-sm font-bold transition-colors", newTrans.type === 'expense' ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : "text-slate-500")}
                >
                  Saída
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                <input 
                  required
                  type="text" 
                  value={newTrans.desc}
                  onChange={e => setNewTrans({...newTrans, desc: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  placeholder="Ex: Venda de Produto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    value={newTrans.amount}
                    onChange={e => setNewTrans({...newTrans, amount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                  <select 
                    value={newTrans.category}
                    onChange={e => setNewTrans({...newTrans, category: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option>Serviços</option>
                    <option>Estoque</option>
                    <option>RH</option>
                    <option>Manutenção</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                <Save size={18} /> Salvar
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h2>
          <p className="text-slate-500 dark:text-slate-400">Controle de fluxo de caixa, DRE e conciliação bancária.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={18} />
            Exportar DRE
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl text-white shadow-lg shadow-blue-900/20">
          <p className="text-blue-100 text-sm font-medium mb-1">Saldo Atual</p>
          <h3 className="text-3xl font-bold mb-4">{formatCurrency(totalBalance)}</h3>
          <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
            <ArrowUpRight size={16} className="text-green-300" />
            <span>+12% vs mês anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <ArrowUpRight className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Entradas (Mês)</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalIncome)}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Previsão: {formatCurrency(140000)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <ArrowDownRight className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Saídas (Mês)</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpense)}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Custos Fixos: {formatCurrency(45000)}</p>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transações Recentes</h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Categoria</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Método</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{t.desc}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <CreditCard size={14} />
                    {t.method}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{t.date}</td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    t.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {t.type === 'income' ? '+' : ''} {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
