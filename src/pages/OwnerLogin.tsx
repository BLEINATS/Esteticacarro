import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { Shield, Lock, Mail, User, Store, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle, Wifi, ShieldCheck, ArrowLeft, Wrench, Smartphone, Trash2 } from 'lucide-react';
import { db } from '../lib/db';

export default function OwnerLogin() {
  const { loginOwner, registerOwner, ownerUser, isAppLoading } = useApp();
  const { saasSettings } = useSuperAdmin();
  const platformName = saasSettings?.platformName || 'Cristal Care ERP';

  const navigate = useNavigate();
  const location = useLocation();
  
  const [viewState, setViewState] = useState<'login' | 'register'>('login');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', 
    shopName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (ownerUser && !isAppLoading) {
      navigate(from, { replace: true });
    }
  }, [ownerUser, isAppLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (viewState === 'register') {
        if (formData.password !== formData.confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }
        const result = await registerOwner(formData.name, formData.email, formData.shopName, formData.password);
        if (!result.success) throw new Error(result.error || 'Erro ao registrar');
        
        // Auto login after register
        await loginOwner(formData.email, formData.password);
      } else {
        const result = await loginOwner(formData.email, formData.password);
        if (!result.success) throw new Error(result.error?.message || 'Credenciais inválidas');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHardReset = async () => {
      if (confirm("ATENÇÃO: Isso apagará TODOS os dados locais e permitirá um cadastro do zero sem dados de exemplo. \n\nTem certeza que deseja continuar?")) {
          await db.reset(true);
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/product" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Voltar para o Site
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 mb-4">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{platformName}</h1>
          <p className="text-slate-400">Gestão inteligente (Modo Offline)</p>
          
          <div className="mt-4 flex justify-center">
             <span className="text-xs text-green-500 flex items-center gap-1"><Wifi size={12} /> Banco de Dados Local</span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl transition-all duration-300">
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg mb-6">
                <button
                type="button"
                onClick={() => setViewState('login')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
                    viewState === 'login' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                >
                Entrar
                </button>
                <button
                type="button"
                onClick={() => setViewState('register')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
                    viewState === 'register' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                >
                Criar Conta
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {viewState === 'register' && (
                <div className="space-y-4 animate-in slide-in-from-left duration-300">
                    <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Seu nome"
                        />
                    </div>
                    </div>
                    <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome da Loja</label>
                    <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                        type="text" 
                        required
                        value={formData.shopName}
                        onChange={e => setFormData({...formData, shopName: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Ex: Auto Detail Premium"
                        />
                    </div>
                    </div>
                </div>
                )}

                <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="admin@cristalcare.com"
                    />
                </div>
                </div>

                <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                    tabIndex={-1}
                    >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                </div>

                {viewState === 'register' && (
                    <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Confirmar Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                        type={showPassword ? "text" : "password"} 
                        value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="••••••••"
                        />
                    </div>
                    </div>
                )}

                {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in flex items-center justify-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
                )}

                <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Processando...</span>
                    </>
                ) : (
                    <>
                    {viewState === 'register' ? 'Começar Agora' : 'Acessar Painel'}
                    <ArrowRight size={18} />
                    </>
                )}
                </button>
            </form>
            
            <div className="mt-8 space-y-4">
                {/* Botão de Acesso Técnico Destacado */}
                <Link 
                    to="/tech-portal" 
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700 group"
                >
                    <div className="p-1.5 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                        <Wrench size={16} className="text-blue-400" />
                    </div>
                    <span>Acesso Funcionário / Técnico</span>
                </Link>

                <div className="flex justify-between items-center pt-2">
                    <Link to="/super-admin/login" className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-600 hover:text-indigo-400 transition-colors tracking-wider">
                        <ShieldCheck size={12} /> Super Admin
                    </Link>
                    
                    <button 
                        onClick={handleHardReset}
                        className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-600 hover:text-red-400 transition-colors tracking-wider"
                    >
                        <Trash2 size={12} /> Limpar Dados (Reset)
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
