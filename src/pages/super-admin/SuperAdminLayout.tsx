import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import SuperAdminSidebar from '../../components/SuperAdminSidebar';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Menu } from 'lucide-react';

export default function SuperAdminLayout() {
  const { isAuthenticated } = useSuperAdmin();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    // Redireciona para a Landing Page se não estiver autenticado
    return <Navigate to="/product" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-40 shadow-md">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <span className="ml-3 font-bold text-white text-lg">Painel Admin</span>
      </div>

      <SuperAdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 lg:ml-64 pt-20 lg:pt-8 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
