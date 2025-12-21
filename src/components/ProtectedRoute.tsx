import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Loader2, Lock, CreditCard } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { ownerUser, isAppLoading, logoutOwner, subscription } = useApp();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  
  useEffect(() => {
    if (isAppLoading) {
      const timer = setTimeout(() => setShowLogout(true), 5000); 
      return () => clearTimeout(timer);
    }
  }, [isAppLoading]);

  if (isAppLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500">Carregando sistema...</p>
        {showLogout && (
            <button 
                onClick={async () => { 
                    await logoutOwner();
                    window.location.reload(); 
                }} 
                className="text-xs text-red-500 hover:underline mt-4"
            >
                Demorando muito? Sair e Reiniciar
            </button>
        )}
      </div>
    );
  }

  if (!ownerUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Subscription Check
  const isSubscriptionActive = subscription.status === 'active' || subscription.status === 'trial';
  const isSettingsPage = location.pathname === '/settings';

  if (!isSubscriptionActive && !isSettingsPage) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border-4 border-red-900/50">
                  <Lock size={40} className="text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Acesso Bloqueado</h1>
              <p className="text-slate-400 max-w-md mb-8">
                  Sua assinatura está {subscription.status === 'past_due' ? 'vencida' : 'inativa'}. 
                  Para continuar utilizando o sistema, por favor regularize seu plano.
              </p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Link 
                    to="/settings" 
                    state={{ activeTab: 'billing' }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                      <CreditCard size={20} /> Ir para Pagamento
                  </Link>
                  <button 
                    onClick={logoutOwner}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                  >
                      Sair
                  </button>
              </div>
          </div>
      );
  }

  return <>{children}</>;
}
