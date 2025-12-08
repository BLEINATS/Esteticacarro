import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Loader2, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { ownerUser, isAppLoading, logoutOwner } = useApp();
  const location = useLocation();

  if (isAppLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">Carregando sistema...</p>
        
        {/* Failsafe Logout Button */}
        <button 
            onClick={() => { logoutOwner(); window.location.reload(); }}
            className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 hover:underline"
        >
            <LogOut size={12} /> Está demorando muito? Sair e Reiniciar
        </button>
      </div>
    );
  }

  if (!ownerUser) {
    // Redirect to login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
