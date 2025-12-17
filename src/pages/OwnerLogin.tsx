import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Lock, Mail, User, Store, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle, RefreshCw, LogOut, Wifi, WifiOff, Send, HelpCircle } from 'lucide-react';
import { checkSupabaseConnection, supabase } from '../lib/supabase';

interface DataLoadErrorState {
  hasError: boolean;
  message: string;
  technicalDetails?: string;
  retryCount: number;
}

export default function OwnerLogin() {
  const { loginOwner, registerOwner, ownerUser, isAppLoading, reloadUserData, logoutOwner } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const [viewState, setViewState] = useState<'login' | 'register' | 'forgot_password'>('login');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', 
    shopName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [debugError, setDebugError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processando...'); 
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [dataLoadError, setDataLoadError] = useState<DataLoadErrorState>({
    hasError: false,
    message: '',
    retryCount: 0
  });

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    const checkConn = async () => {
        const connected = await checkSupabaseConnection();
        setIsConnected(connected);
        if (!connected) {
            setError('Sem conexão com o servidor. Verifique sua internet.');
        }
    };
    checkConn();
  }, []);

  useEffect(() => {
    if (ownerUser && !isAppLoading && !dataLoadError.hasError) {
      navigate(from, { replace: true });
    }
  }, [ownerUser, isAppLoading, navigate, from, dataLoadError.hasError]);

  const handleRetryLoad = async () => {
    setIsLoading(true);
    setLoadingText('Tentando reconectar...');
    setError('');
    setDebugError('');
    
    try {
      const success = await reloadUserData();
      if (success) {
        setDataLoadError({ hasError: false, message: '', retryCount: 0 });
        navigate(from, { replace: true });
      } else {
        setDataLoadError(prev => ({
          ...prev,
          hasError: true,
          message: 'Não foi possível carregar os dados. O banco de dados pode estar reiniciando.',
          retryCount: prev.retryCount + 1
        }));
      }
    } catch (err: any) {
      console.error("Retry error:", err);
      setDebugError(err.message || JSON.stringify(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAndReset = async () => {
    await logoutOwner();
    setDataLoadError({ hasError: false, message: '', retryCount: 0 });
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    setError('');
    setDebugError('');
  };

  const handleResendEmail = async () => {
    if (!formData.email) return;
    setIsLoading(true);
    setLoadingText('Enviando email...');
    setError('');
    setSuccessMsg('');
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: formData.email.trim(),
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        
        setSuccessMsg(`Email de confirmação reenviado para ${formData.email}. Verifique sua caixa de entrada e SPAM.`);
        setShowResend(false);
    } catch (err: any) {
        setError('Erro ao reenviar: ' + (err.message || 'Tente novamente mais tarde.'));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugError('');
    setSuccessMsg('');
    setShowResend(false);
    setShowForgotPassword(false);
    setIsLoading(true);

    try {
      // Normalize email here instead of onChange
      const normalizedEmail = formData.email.replace(/\s+/g, '').toLowerCase();
      console.log("Submitting with email:", normalizedEmail); // Debug log

      if (viewState === 'register') {
        setLoadingText('Criando sua conta...');
        
        if (!formData.name || !normalizedEmail || !formData.password || !formData.shopName) {
          throw new Error('Por favor, preencha todos os campos.');
        }
        if (formData.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }

        // 1. Tenta Criar o Usuário no Supabase Auth
        const result = await registerOwner(formData.name, normalizedEmail, formData.shopName, formData.password);
        
        if (result.success) {
          setLoadingText('Verificando acesso...');
          
          // 2. Verifica se entrou direto (Email confirm off) ou precisa confirmar
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
              setLoadingText('Preparando seu painel...');
              // Se já tem sessão, tenta carregar (vai falhar pois não tem loja, mas o AppContext lida com isso)
              const loadSuccess = await reloadUserData();
              
              // Se carregou (mesmo sem loja), redireciona
              if (loadSuccess) {
                navigate(from, { replace: true });
              } else {
                // Fallback: Se falhar o load, força a ida para o dashboard onde o Layout vai tratar a falta de loja
                console.warn("Load failed but session exists, forcing navigation.");
                navigate('/', { replace: true });
              }
          } else {
              // Fluxo padrão: Precisa confirmar email
              setSuccessMsg("Cadastro realizado com sucesso! Verifique seu email (e a pasta de SPAM) para confirmar a conta antes de entrar.");
              setViewState('login');
              setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); 
          }
        } else {
          // Tratamento de erros específicos de registro
          // FIX: registerOwner returns error as a string, not an object with message
          const errorMsg = typeof result.error === 'string' ? result.error : (result.error as any)?.message || '';
          
          if (errorMsg.includes('User already registered')) {
             setViewState('login');
             setError('Este email já está cadastrado. Tente fazer login.');
             return;
          }
          throw new Error(errorMsg || 'Não foi possível criar a conta.');
        }

      } else if (viewState === 'login') {
        setLoadingText('Autenticando...');
        if (!normalizedEmail) throw new Error('Informe o email.');
        if (!formData.password) throw new Error('Informe a senha.');

        const result = await loginOwner(normalizedEmail, formData.password);

        if (!result.success) {
            console.error("LOGIN FAILED:", result.error);
            setDebugError(JSON.stringify(result.error, null, 2));

            // Limpa a senha para forçar redigitação correta
            setFormData(prev => ({ ...prev, password: '' }));
            if (passwordInputRef.current) {
                passwordInputRef.current.focus();
            }

            const msg = result.error?.message || '';
            const code = result.error?.code || '';

            if (msg.includes('Email not confirmed') || code === 'email_not_confirmed') {
                 setShowResend(true);
                 throw new Error('Seu email ainda não foi confirmado. Verifique sua caixa de entrada (e SPAM) e clique no link de ativação.');
            } else if (msg.includes('Invalid login') || code === 'invalid_credentials') {
                 setShowForgotPassword(true);
                 throw new Error('Email ou senha incorretos. Verifique se não há espaços em branco ou tente recuperar a senha.');
            } else if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
                 throw new Error('Erro de conexão. Verifique sua internet ou se o servidor está acessível.');
            } else if (msg.includes('Login timed out')) {
                 throw new Error('O servidor demorou para responder. Pode ser uma inicialização a frio. Tente novamente em alguns segundos.');
            } else {
                throw new Error(`Erro ao entrar: ${msg || 'Tente novamente.'}`);
            }
        }
        
        setLoadingText('Carregando seus dados...');
        const loadSuccess = await reloadUserData();
        
        if (loadSuccess) {
             navigate(from, { replace: true });
        } else {
             // Se falhar o load mas logou, pode ser timeout do banco.
             setDataLoadError({
               hasError: true,
               message: 'Login realizado, mas o sistema demorou para responder.',
               technicalDetails: 'Timeout ou falha em reloadUserData().',
               retryCount: 0
             });
        }

      } else if (viewState === 'forgot_password') {
        setLoadingText('Enviando solicitação...');
        if (!normalizedEmail) throw new Error('Informe seu email.');
        
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        
        setSuccessMsg('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setViewState('login');
      }
    } catch (err: any) {
      console.error("Erro no formulário:", err);
      let msg = err.message || 'Ocorreu um erro inesperado.';

      if (msg.includes('Email signups are disabled')) {
        msg = 'O cadastro de novos usuários está desativado nas configurações do sistema. Entre em contato com o suporte.';
      } else if (msg.includes('Signups not allowed')) {
        msg = 'O cadastro não é permitido neste momento.';
      } else if (msg.includes('Email logins are disabled') || msg.includes('email_provider_disabled')) {
        msg = 'O login por email está desativado. Ative o provedor "Email" no painel do Supabase.';
      } else if (msg.includes('Email not confirmed')) {
        setShowResend(true);
        msg = 'Email não confirmado. Verifique sua caixa de entrada.';
      }

      setError(msg);
      if (!debugError) setDebugError(err.message);
    } finally {
      setIsLoading(false);
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
          
          <div className="mt-4 flex justify-center">
            {isConnected === null ? (
                <span className="text-xs text-slate-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Verificando conexão...</span>
            ) : isConnected ? (
                <span className="text-xs text-green-500 flex items-center gap-1"><Wifi size={12} /> Servidor Online</span>
            ) : (
                <span className="text-xs text-red-500 flex items-center gap-1"><WifiOff size={12} /> Servidor Offline</span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl transition-all duration-300">
            
            {dataLoadError.hasError ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-red-400">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Erro de Carregamento</h3>
                  <p className="text-sm text-red-300/80 leading-relaxed">
                    {dataLoadError.message}
                  </p>
                  {dataLoadError.technicalDetails && (
                    <details className="mt-2 text-left">
                        <summary className="text-xs text-red-400/60 cursor-pointer hover:text-red-400">Ver detalhes técnicos</summary>
                        <pre className="mt-2 p-2 bg-black/30 rounded text-[10px] text-red-300 overflow-x-auto">
                            {dataLoadError.technicalDetails}
                        </pre>
                    </details>
                  )}
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleRetryLoad}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                    {isLoading ? loadingText : 'Tentar Novamente'}
                  </button>
                  
                  <button 
                    onClick={handleLogoutAndReset}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Sair e Tentar Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                {viewState !== 'forgot_password' && (
                    <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg mb-6">
                        <button
                        type="button"
                        onClick={() => { setViewState('login'); setError(''); setSuccessMsg(''); setDebugError(''); setShowResend(false); setShowForgotPassword(false); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
                            viewState === 'login' 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                        >
                        Entrar
                        </button>
                        <button
                        type="button"
                        onClick={() => { setViewState('register'); setError(''); setSuccessMsg(''); setDebugError(''); setShowResend(false); setShowForgotPassword(false); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${
                            viewState === 'register' 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
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
                        autoComplete="email"
                        />
                    </div>
                    </div>

                    {viewState !== 'forgot_password' && (
                        <>
                        <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                            ref={passwordInputRef}
                            type={showPassword ? "text" : "password"} 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                            autoComplete="current-password"
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
                                autoComplete="new-password"
                                />
                            </div>
                            </div>
                        )}
                        </>
                    )}

                    {viewState === 'login' && (
                        <div className="flex justify-end">
                            <button 
                                type="button"
                                onClick={() => { setViewState('forgot_password'); setError(''); setSuccessMsg(''); setDebugError(''); setShowResend(false); setShowForgotPassword(false); }}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    )}

                    {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in flex flex-col items-center justify-center gap-2">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span className="text-left">{error}</span>
                        </div>
                        {showResend && (
                            <button
                                type="button"
                                onClick={handleResendEmail}
                                disabled={isLoading}
                                className="mt-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded flex items-center gap-1 transition-colors w-full justify-center font-bold border border-red-500/30"
                            >
                                {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                Reenviar Email de Confirmação
                            </button>
                        )}
                        {showForgotPassword && (
                            <button
                                type="button"
                                onClick={() => { setViewState('forgot_password'); setError(''); setSuccessMsg(''); setDebugError(''); setShowResend(false); setShowForgotPassword(false); }}
                                className="mt-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1.5 rounded flex items-center gap-1 transition-colors w-full justify-center font-bold border border-blue-500/30"
                            >
                                <HelpCircle size={12} />
                                Recuperar Minha Senha
                            </button>
                        )}
                        {debugError && (
                            <details className="w-full text-left mt-2">
                                <summary className="text-xs opacity-70 cursor-pointer">Ver erro técnico</summary>
                                <pre className="text-[10px] bg-black/30 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                                    {debugError}
                                </pre>
                            </details>
                        )}
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
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>{loadingText}</span>
                        </>
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
                            onClick={() => { setViewState('login'); setError(''); setSuccessMsg(''); setDebugError(''); setShowResend(false); setShowForgotPassword(false); }}
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
      </div>
    </div>
  );
}
