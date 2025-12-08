import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Lock, Mail, User, Store, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle, RefreshCw, Wrench, LogOut } from 'lucide-react';
import { cn, withTimeout } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function OwnerLogin() {
  const { loginOwner, registerOwner, ownerUser, isAppLoading, logoutOwner, createTenantViaRPC, reloadUserData } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [viewState, setViewState] = useState<'login' | 'register' | 'forgot_password'>('login');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    shopName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'authenticated' | 'no-session'>('checking');
  const [hasTenant, setHasTenant] = useState<boolean | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  // 1. Diagnóstico de Sessão
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionStatus('authenticated');
          setFormData(prev => ({ ...prev, email: session.user.email || '' }));
          
          if (ownerUser) {
              setHasTenant(true);
          } else {
              // Use limit(1) to avoid single() error on duplicates
              const { data } = await supabase.from('tenants').select('id').eq('owner_id', session.user.id).limit(1);
              setHasTenant(data && data.length > 0);
          }
        } else {
          setSessionStatus('no-session');
          setHasTenant(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setSessionStatus('no-session');
      }
    };
    
    if (!isAppLoading) {
        checkStatus();
    }
  }, [ownerUser, isAppLoading]);

  // 2. Redirecionamento MANUAL (Evita loop)
  const handleEnterPanel = () => {
      if (ownerUser) {
          navigate(from, { replace: true });
      } else {
          // Try to reload data without full page reload first
          setIsLoading(true);
          reloadUserData().then((success) => {
             setIsLoading(false);
             if (success) {
                 navigate(from, { replace: true });
             } else {
                 setError("Não foi possível carregar os dados da loja. Tente criar a loja novamente abaixo.");
                 setHasTenant(false); // Allow creating store
             }
          }).catch(() => {
             setIsLoading(false);
             setError("Erro ao conectar com o servidor.");
          });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (viewState === 'register') {
        if (!formData.name || !formData.email || !formData.password || !formData.shopName) {
          throw new Error('Por favor, preencha todos os campos.');
        }
        if (formData.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }

        // 60s Timeout for Registration (Cold Start)
        const result = await withTimeout(
            registerOwner(formData.name, formData.email, formData.shopName, formData.password),
            60000,
            "O cadastro demorou muito. O banco de dados pode estar inicializando. Tente novamente em alguns segundos."
        );
        
        if (result.success) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
              const success = await reloadUserData();
              if (success) {
                  navigate(from, { replace: true });
              } else {
                  setHasTenant(false);
              }
          } else {
              setSuccessMsg("Cadastro realizado! Verifique seu email para confirmar.");
              setViewState('login');
              setFormData(prev => ({ ...prev, password: '' })); 
          }
        } else {
          if (result.error?.includes('User already registered')) {
             setViewState('login');
             throw new Error('Este email já está cadastrado. Tente fazer login.');
          }
          throw new Error(result.error || 'Não foi possível criar a conta.');
        }

      } else if (viewState === 'login') {
        if (!formData.email || !formData.password) {
            throw new Error('Informe email e senha.');
        }

        let loginError = null;
        
        // Lógica de Retry para Login (3 tentativas para Cold Start)
        // Aumentado para suportar cold starts lentos
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                // 30s -> 60s -> 60s
                const timeoutMs = attempt === 1 ? 30000 : 60000;
                
                const { error } = await withTimeout(
                    supabase.auth.signInWithPassword({ 
                        email: formData.email, 
                        password: formData.password 
                    }),
                    timeoutMs,
                    "O servidor demorou para responder."
                );

                if (error) {
                    // Se for erro de credencial, para imediatamente (não é problema de rede)
                    if (error.message.includes('Invalid login') || error.code === 'invalid_credentials' || error.message.includes('Email not confirmed')) {
                        loginError = error;
                        break;
                    }
                    // Se for outro erro (ex: rede), armazena e tenta novamente se não for a última
                    if (attempt === 3) loginError = error;
                    else await new Promise(r => setTimeout(r, 2000)); // Espera 2s
                } else {
                    // Sucesso! Limpa erro e sai do loop
                    loginError = null;
                    break;
                }
            } catch (err) {
                console.warn(`Login attempt ${attempt} timeout/failed`);
                if (attempt === 3) {
                    loginError = { message: "O servidor demorou muito para responder. Verifique sua conexão e tente novamente." } as any;
                }
            }
        }

        if (loginError) {
            if (loginError.message.includes('Email not confirmed')) {
                 throw new Error('Email não confirmado. Verifique sua caixa de entrada.');
            } else if (loginError.message.includes('Invalid login') || loginError.code === 'invalid_credentials') {
                 throw new Error('Email ou senha incorretos.');
            } else {
                throw new Error(loginError.message);
            }
        }
        
        // Successful login, try loading data
        const success = await reloadUserData();
        if (success) {
             navigate(from, { replace: true });
        } else {
             setHasTenant(false); // Fallback to store creation UI
        }

      } else if (viewState === 'forgot_password') {
        if (!formData.email) throw new Error('Informe seu email.');
        
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        
        setSuccessMsg('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setViewState('login');
      }
    } catch (err: any) {
      console.error("Erro no formulário:", err);
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      // CRITICAL: Always turn off loading, regardless of success or failure
      setIsLoading(false);
    }
  };

  const handleForceCreateStore = async () => {
      setIsLoading(true);
      try {
          const shopName = formData.shopName || "Minha Oficina";
          // 90s Timeout for Store Creation (Includes retries in loadTenantData)
          const success = await withTimeout(
              createTenantViaRPC(shopName),
              90000,
              "A criação da loja demorou muito. Verifique se ela foi criada recarregando a página."
          );

          if (success) {
              navigate(from, { replace: true });
          } else {
              throw new Error("Falha ao criar loja. Tente novamente.");
          }

      } catch (err: any) {
          setError("Erro: " + err.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleFullReset = async () => {
    if (window.confirm('Isso fará logout e limpará dados locais. Continuar?')) {
        await logoutOwner();
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 mb-4">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cristal Care ERP</h1>
          <p className="text-slate-400">Gestão inteligente para sua estética automotiva.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          
          {/* PAINEL DE DIAGNÓSTICO / RECUPERAÇÃO */}
          {sessionStatus === 'authenticated' && hasTenant === false ? (
              <div className="space-y-4 animate-in fade-in">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center">
                      <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                      <h3 className="text-white font-bold text-lg">Falta Pouco!</h3>
                      <p className="text-slate-400 text-sm mt-1">
                          Sua conta foi criada, mas precisamos configurar sua loja no banco de dados.
                      </p>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome da Loja</label>
                      <input 
                          type="text" 
                          value={formData.shopName}
                          onChange={e => setFormData({...formData, shopName: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 outline-none"
                          placeholder="Digite o nome da sua oficina"
                      />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                  )}

                  <button 
                      onClick={handleForceCreateStore}
                      disabled={isLoading || !formData.shopName}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isLoading ? <Loader2 className="animate-spin" /> : <Wrench size={18} />}
                      Criar Loja e Acessar
                  </button>
                  
                  <button onClick={handleFullReset} className="w-full py-2 text-slate-500 hover:text-white text-sm flex items-center justify-center gap-2">
                      <LogOut size={14} /> Sair e tentar outra conta
                  </button>
              </div>
          ) : sessionStatus === 'authenticated' && hasTenant === true ? (
              <div className="text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                      <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-white font-bold text-xl">Você está conectado!</h3>
                  <p className="text-slate-400 text-sm">Seus dados foram carregados com sucesso.</p>
                  
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                  )}

                  <button 
                      onClick={handleEnterPanel}
                      disabled={isLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                      {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={18} />}
                      {isLoading ? 'Carregando...' : 'Entrar no Painel'}
                  </button>

                  <button onClick={handleFullReset} className="text-slate-500 hover:text-red-400 text-sm underline">
                      Não é você? Sair
                  </button>
              </div>
          ) : (
            /* TELA DE LOGIN/REGISTRO NORMAL */
            <>
                {viewState !== 'forgot_password' && (
                    <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg mb-6">
                        <button
                        type="button"
                        onClick={() => { setViewState('login'); setError(''); setSuccessMsg(''); }}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-bold rounded-md transition-all",
                            viewState === 'login' 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                        >
                        Entrar
                        </button>
                        <button
                        type="button"
                        onClick={() => { setViewState('register'); setError(''); setSuccessMsg(''); }}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-bold rounded-md transition-all",
                            viewState === 'register' 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                        >
                        Criar Conta
                        </button>
                    </div>
                )}

                {viewState === 'forgot_password' && (
                    <div className="mb-6 text-center">
                        <h3 className="text-white font-bold text-lg">Recuperar Senha</h3>
                        <p className="text-slate-400 text-sm">Enviaremos um link para você redefinir sua senha.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {viewState === 'register' && (
                    <div className="space-y-4 animate-in slide-in-from-left duration-300">
                        <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome do Responsável</label>
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
                        placeholder="seu@email.com"
                        />
                    </div>
                    </div>

                    {viewState !== 'forgot_password' && (
                        <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                            type={showPassword ? "text" : "password"} 
                            required
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
                    )}

                    {viewState === 'login' && (
                        <div className="flex justify-end">
                            <button 
                                type="button"
                                onClick={() => { setViewState('forgot_password'); setError(''); setSuccessMsg(''); }}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    )}

                    {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>
                    )}

                    {successMsg && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center flex items-center justify-center gap-2 animate-in fade-in">
                        <CheckCircle2 size={16} className="flex-shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                    )}

                    <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                        {viewState === 'register' ? 'Começar Agora' : viewState === 'forgot_password' ? 'Enviar Link' : 'Acessar Painel'}
                        <ArrowRight size={18} />
                        </>
                    )}
                    </button>

                    {viewState === 'forgot_password' && (
                        <button 
                            type="button"
                            onClick={() => { setViewState('login'); setError(''); setSuccessMsg(''); }}
                            className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
                        >
                            Voltar para Login
                        </button>
                    )}
                </form>

                <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                    <p className="text-slate-500 text-xs">
                    Ao continuar, você concorda com nossos <Link to="/terms" className="text-blue-400 hover:underline">Termos de Uso</Link> e <Link to="/privacy" className="text-blue-400 hover:underline">Política de Privacidade</Link>.
                    </p>
                </div>
            </>
          )}
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-slate-500 text-sm">
                É um técnico? <Link to="/tech-portal" className="text-blue-400 font-bold hover:underline">Acesse o Portal do Técnico</Link>
            </p>
            
            {sessionStatus !== 'authenticated' && (
                <button 
                    onClick={handleFullReset}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors mt-2"
                >
                    <RefreshCw size={12} /> Problemas no acesso? Limpar Cache
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
