import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { ownerUser, isAppLoading, logoutOwner } = useApp();
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

  return <>{children}</>;
}
