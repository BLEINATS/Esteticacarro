import React, { useState, useEffect } from 'react';
import { X, Save, User, Shield, Percent, Hash, DollarSign, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';
import { cn } from '../lib/utils';

interface EmployeeModalProps {
  employee?: Employee | null;
  onClose: () => void;
}

export default function EmployeeModal({ employee, onClose }: EmployeeModalProps) {
  const { addEmployee, updateEmployee } = useApp();
  
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    role: 'Detailer',
    pin: '',
    salaryType: 'commission', // default
    fixedSalary: 0,
    commissionRate: 0,
    commissionBase: 'net',
    active: true
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (employee) {
      updateEmployee(employee.id, formData);
    } else {
      addEmployee(formData as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gerencie acesso e remuneração.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Carlos Souza"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cargo / Função</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as any})}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white appearance-none"
                >
                    <option value="Manager">Gerente</option>
                    <option value="Detailer">Detailer</option>
                    <option value="Funileiro">Funileiro</option>
                    <option value="Pintor">Pintor</option>
                    <option value="Lavador">Lavador</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">PIN de Acesso</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required
                  maxLength={4}
                  value={formData.pin}
                  onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g,'')})}
                  placeholder="0000"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600" /> Modelo de Remuneração
            </h4>
            
            <div className="flex gap-2 mb-4">
                <button 
                    type="button"
                    onClick={() => setFormData({...formData, salaryType: 'commission'})}
                    className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all border",
                        formData.salaryType === 'commission' 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                >
                    Comissão
                </button>
                <button 
                    type="button"
                    onClick={() => setFormData({...formData, salaryType: 'fixed'})}
                    className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all border",
                        formData.salaryType === 'fixed' 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                >
                    Fixo
                </button>
                <button 
                    type="button"
                    onClick={() => setFormData({...formData, salaryType: 'mixed'})}
                    className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all border",
                        formData.salaryType === 'mixed' 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                >
                    Misto
                </button>
            </div>

            <div className="space-y-4 animate-in fade-in">
                {(formData.salaryType === 'commission' || formData.salaryType === 'mixed') && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Taxa (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="number" 
                                    value={formData.commissionRate}
                                    onChange={e => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Base de Cálculo</label>
                            <select 
                                value={formData.commissionBase}
                                onChange={e => setFormData({...formData, commissionBase: e.target.value as any})}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                            >
                                <option value="gross">Valor Bruto</option>
                                <option value="net">Valor Líquido</option>
                            </select>
                        </div>
                    </div>
                )}

                {(formData.salaryType === 'fixed' || formData.salaryType === 'mixed') && (
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Salário Mensal (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="number" 
                                value={formData.fixedSalary}
                                onChange={e => setFormData({...formData, fixedSalary: parseFloat(e.target.value)})}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-bold"
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Salvar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
