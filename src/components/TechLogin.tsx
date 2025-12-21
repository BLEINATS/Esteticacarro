import React, { useState } from 'react';
import { Lock, ChevronRight, Delete, Store, Search, Loader2, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { db } from '../lib/db';

export default function TechLogin() {
  const { employees, login, reloadUserData, ownerUser, logoutOwner } = useApp();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  // State for "Find Shop" (Kiosk Mode Setup)
  const [shopEmail, setShopEmail] = useState('');
  const [isSearchingShop, setIsSearchingShop] = useState(false);
  const [shopError, setShopError] = useState('');

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

  const handleFindShop = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSearchingShop(true);
      setShopError('');
      
      try {
          // Try to find user by email to get tenant
          const user = await db.findUserByEmail(shopEmail);
          if (user) {
              // Simulate login to load tenant data into context
              // In a real app, we might have a public endpoint to get basic tenant info for kiosk
              // Here we reuse the local storage mechanism for the prototype
              localStorage.setItem('cristal_care_user', JSON.stringify({ id: user.id, name: user.name, email: user.email, shopName: user.shopName }));
              await reloadUserData(); // Force context to reload data
          } else {
              setShopError('Loja não encontrada com este e-mail.');
          }
      } catch (err) {
          setShopError('Erro ao buscar loja.');
      } finally {
          setIsSearchingShop(false);
      }
  };

  const handleDisconnect = async () => {
      await logoutOwner();
      window.location.reload();
  };

  // CASE 0: SHOP CONNECTED BUT NO EMPLOYEES
  if (ownerUser && employees.length === 0) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
                    <Store size={32} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{ownerUser.shopName}</h1>
                <p className="text-slate-400 text-sm mb-6">
                    Loja conectada com sucesso, mas nenhum funcionário foi encontrado.
                </p>
                <div className="bg-slate-800 p-4 rounded-xl text-xs text-slate-300 mb-6">
                    Acesse o painel administrativo para cadastrar sua equipe e gerar os PINs de acesso.
                </div>
                <button 
                    onClick={handleDisconnect}
                    className="flex items-center justify-center gap-2 w-full py-3 border border-red-900/50 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors font-bold"
                >
                    <LogOut size={16} /> Desconectar
                </button>
            </div>
        </div>
      );
  }

  // CASE 1: NO EMPLOYEES LOADED (Fresh Device / Kiosk Setup)
  if (employees.length === 0) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
                        <Store size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Configurar Quiosque</h1>
                    <p className="text-slate-400 text-sm mt-2">
                        Este dispositivo ainda não está vinculado a uma oficina. Digite o e-mail do administrador para conectar.
                    </p>
                </div>

                <form onSubmit={handleFindShop} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">E-mail do Dono</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="email" 
                                value={shopEmail}
                                onChange={e => setShopEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                                placeholder="admin@exemplo.com"
                                required
                            />
                        </div>
                    </div>

                    {shopError && (
                        <p className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded-lg">{shopError}</p>
                    )}

                    <button 
                        type="submit"
                        disabled={isSearchingShop}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSearchingShop ? <Loader2 className="animate-spin" size={20} /> : 'Conectar Oficina'}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <a href="/login" className="text-xs text-slate-500 hover:text-white transition-colors">
                        Voltar para Login Admin
                    </a>
                </div>
            </div>
        </div>
      );
  }

  // CASE 2: SELECT USER PROFILE
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
          
          <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
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
          
          <div className="mt-8 text-center">
             <button onClick={handleDisconnect} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                 Sair do Modo Quiosque
             </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 3: ENTER PIN
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
