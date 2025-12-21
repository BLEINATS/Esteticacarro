import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Tag, FileText, CheckCircle2, AlertCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialTransaction } from '../types';
import { cn } from '../lib/utils';
import { useDialog } from '../context/DialogContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: FinancialTransaction | null;
}

export default function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const { addFinancialTransaction, updateFinancialTransaction } = useApp();
  const { showAlert } = useDialog();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    status: 'paid' as 'paid' | 'pending',
    method: 'Pix'
  });

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setFormData({
        description: transaction.desc,
        amount: Math.abs(transaction.amount).toString(),
        category: transaction.category,
        date: new Date(transaction.date).toISOString().split('T')[0],
        status: transaction.status,
        method: transaction.method
      });
    } else {
      // Reset form for new transaction
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        method: 'Pix'
      });
      setType('expense'); // Default to expense as it's the most common manual entry
    }
  }, [transaction, isOpen]);

  const categories = type === 'income' 
    ? ['Serviços', 'Venda de Produtos', 'Investimento', 'Outros']
    : ['Aluguel', 'Energia', 'Água', 'Internet', 'Fornecedores', 'Manutenção', 'Marketing', 'Impostos', 'Salários', 'Outros'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
        showAlert({ title: 'Campos Obrigatórios', message: 'Preencha descrição, valor e categoria.', type: 'warning' });
        return;
    }

    const value = parseFloat(formData.amount);
    // Expenses are negative in the backend logic usually, but here we store absolute and use type to distinguish
    // However, looking at AppContext logic, expenses might be stored as negative numbers or just typed.
    // Let's follow the pattern: Amount is stored as is, type defines sign in calculations usually, 
    // BUT in Team.tsx we saw `amount: -amount` for expenses. Let's standardize.
    // Ideally, store positive and let type dictate. But to be safe with existing dashboard logic:
    // Dashboard sums `netAmount ?? amount`. If expense, we usually want to subtract.
    // Let's assume the dashboard logic handles `type === 'expense'` subtraction or expects negative values.
    // Checking Dashboard.tsx: 
    // `totalExpense = ... reduce((acc, t) => acc + Math.abs(t.amount), 0);` -> It uses Math.abs, so sign doesn't matter for display there.
    // `currentBalance = ... + netProfit`.
    // Let's store positive values and let the type define it logically.

    const newTransaction: any = {
        desc: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount), // Store positive, Dashboard handles Math.abs for expenses
        netAmount: parseFloat(formData.amount),
        fee: 0,
        type: type,
        date: new Date(formData.date).toISOString(),
        dueDate: new Date(formData.date).toISOString(),
        method: formData.method,
        status: formData.status
    };

    if (transaction) {
        updateFinancialTransaction(transaction.id, newTransaction);
        showAlert({ title: 'Sucesso', message: 'Lançamento atualizado.', type: 'success' });
    } else {
        addFinancialTransaction({
            ...newTransaction,
            id: Date.now()
        });
        showAlert({ title: 'Sucesso', message: 'Lançamento registrado.', type: 'success' });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {transaction ? 'Editar Lançamento' : 'Nova Transação'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Type Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                    type="button"
                    onClick={() => setType('income')}
                    className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                        type === 'income' 
                            ? "bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    <ArrowUpCircle size={18} /> Receita
                </button>
                <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                        type === 'expense' 
                            ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    <ArrowDownCircle size={18} /> Despesa
                </button>
            </div>

            {/* Amount */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Valor (R$)</label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="number" 
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0,00"
                    />
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Descrição</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        required
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={type === 'income' ? "Ex: Venda de Kit Limpeza" : "Ex: Conta de Luz"}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Categoria</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        >
                            <option value="">Selecione...</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Data</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="date" 
                            required
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            className="w-full pl-9 pr-2 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Method */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Método</label>
                    <select 
                        value={formData.method}
                        onChange={e => setFormData({...formData, method: e.target.value})}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="Pix">Pix</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão Crédito">Cartão Crédito</option>
                        <option value="Cartão Débito">Cartão Débito</option>
                        <option value="Transferência">Transferência</option>
                        <option value="Boleto">Boleto</option>
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Status</label>
                    <div className="flex bg-slate-50 dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, status: 'paid'})}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1",
                                formData.status === 'paid' 
                                    ? "bg-green-500 text-white shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            )}
                        >
                            <CheckCircle2 size={12} /> Pago
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, status: 'pending'})}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1",
                                formData.status === 'pending' 
                                    ? "bg-amber-500 text-white shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            )}
                        >
                            <AlertCircle size={12} /> Pendente
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button 
                    type="submit" 
                    className={cn(
                        "w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2",
                        type === 'income' 
                            ? "bg-green-600 hover:bg-green-700 shadow-green-900/20" 
                            : "bg-red-600 hover:bg-red-700 shadow-red-900/20"
                    )}
                >
                    <Save size={20} />
                    {transaction ? 'Salvar Alterações' : type === 'income' ? 'Registrar Receita' : 'Registrar Despesa'}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}
