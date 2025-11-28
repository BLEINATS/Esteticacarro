import React, { useState } from 'react';
import { Lock, ChevronRight, Delete } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

export default function TechLogin() {
  const { employees, login } = useApp();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogin = () => {
    if (login(pin)) {
      // Success handled by context state change
    } else {
      setError(true);
      setPin('');
    }
  };

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quem é você?</h1>
            <p className="text-slate-500 dark:text-slate-400">Selecione seu perfil para acessar.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {employees.filter(e => e.active).map(emp => (
              <button
                key={emp.id}
                onClick={() => setSelectedUser(emp.id)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{emp.role}</p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in slide-in-from-right">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Olá, {employees.find(e => e.id === selectedUser)?.name.split(' ')[0]}</h2>
          <p className="text-slate-500 dark:text-slate-400">Digite seu PIN de 4 dígitos</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "w-4 h-4 rounded-full transition-all",
                i < pin.length 
                  ? error ? "bg-red-500" : "bg-blue-600 scale-110" 
                  : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={() => setSelectedUser(null)}
            className="h-16 rounded-2xl flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-700"
          >
            Voltar
          </button>
          <button
            onClick={() => handleNumClick('0')}
            className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-500 hover:text-red-500"
          >
            <Delete size={24} />
          </button>
        </div>

        <button 
          onClick={handleLogin}
          disabled={pin.length !== 4}
          className="w-full py-4 bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
