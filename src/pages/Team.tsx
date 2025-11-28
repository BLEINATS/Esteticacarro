import React, { useState } from 'react';
import { Users, Award, TrendingUp, DollarSign, Settings, Plus, Minus } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';

export default function Team() {
  const { employees, employeeTransactions, addEmployeeTransaction } = useApp();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isValeModalOpen, setIsValeModalOpen] = useState(false);
  const [valeAmount, setValeAmount] = useState('');
  const [valeDesc, setValeDesc] = useState('');

  const handleAddVale = () => {
    if (selectedEmployee && valeAmount) {
      addEmployeeTransaction({
        id: `adv-${Date.now()}`,
        employeeId: selectedEmployee.id,
        type: 'advance',
        amount: parseFloat(valeAmount),
        description: valeDesc || 'Vale / Adiantamento',
        date: new Date().toISOString()
      });
      setIsValeModalOpen(false);
      setValeAmount('');
      setValeDesc('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de Vale */}
      {isValeModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
              <button onClick={handleAddVale} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                Confirmar Desconto
              </button>
              <button onClick={() => setIsValeModalOpen(false)} className="w-full py-2 text-slate-500 font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Equipe & RH</h2>
          <p className="text-slate-500 dark:text-slate-400">Produtividade, comissões e fechamento de folha.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {employees.map((member) => (
          <div key={member.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
              </div>
              <button className="ml-auto p-2 text-slate-400 hover:text-blue-600">
                <Settings size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Comissão Config.</span>
                <span className="font-medium text-slate-900 dark:text-white">{member.commissionRate}% ({member.commissionBase === 'gross' ? 'Bruto' : 'Líquido'})</span>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 mt-2">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500 uppercase">Saldo a Receber</span>
                   <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(member.balance)}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => { setSelectedEmployee(member); setIsValeModalOpen(true); }}
                    className="flex-1 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <Minus size={12} /> Vale
                  </button>
                  <button className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                    <DollarSign size={12} /> Pagar
                  </button>
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
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
           <h3 className="font-bold text-slate-900 dark:text-white">Extrato de Comissões e Vales</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Funcionário</th>
              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Tipo</th>
              <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {employeeTransactions.slice().reverse().map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">
                  {employees.find(e => e.id === t.employeeId)?.name}
                </td>
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{t.description}</td>
                <td className="px-6 py-3">
                   <span className={cn(
                     "px-2 py-1 rounded-full text-xs font-bold",
                     t.type === 'commission' ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                   )}>
                     {t.type === 'commission' ? 'Comissão' : 'Vale / Saída'}
                   </span>
                </td>
                <td className={cn("px-6 py-3 text-right font-bold", t.type === 'commission' ? "text-green-600" : "text-red-600")}>
                   {t.type === 'commission' ? '+' : '-'} {formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
            {employeeTransactions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum lançamento registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
