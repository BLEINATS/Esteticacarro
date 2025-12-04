import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wrench, Calendar, 
  Package, Settings, LogOut, Menu, X, 
  Bell, Search, Globe, UserCircle,
  Megaphone, DollarSign, GraduationCap, Tags
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';

export default function Layout() {
  // Estado único para controlar a visibilidade do menu (Drawer)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, ownerUser, logoutOwner } = useApp();
  const { showConfirm } = useDialog();

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    const confirm = await showConfirm({
      title: 'Sair do Sistema',
      message: 'Tem certeza que deseja sair?',
      confirmText: 'Sair',
      type: 'info'
    });

    if (confirm) {
      logoutOwner();
      window.location.href = '/shop';
    }
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: Wrench, label: 'Operacional', path: '/operations' },
    { icon: DollarSign, label: 'Financeiro', path: '/finance' },
    { icon: Package, label: 'Produtos - Estoque', path: '/inventory' },
    { icon: Tags, label: 'Catálogo & Preços', path: '/pricing' },
    { icon: Megaphone, label: 'Marketing', path: '/marketing' },
    { icon: GraduationCap, label: 'Treinamento', path: '/gamification' },
    { icon: Users, label: 'Equipe', path: '/team' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar - Agora funciona como Drawer (Gaveta) para todas as telas */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out shadow-2xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo & Close Button */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
              {ownerUser?.storeName || 'Crystal Care'}
            </span>
            <button 
              onClick={closeSidebar}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar} // Fecha o menu ao clicar
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                  `}
                >
                  <item.icon size={20} className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <a
              href="/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              title="Ver Minha Loja (Público)"
            >
              <Globe size={20} className="flex-shrink-0" />
              <span className="font-medium text-sm">Ver Minha Loja</span>
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Sair"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span className="font-medium text-sm">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Botão Hamburguer Principal */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 w-64">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Buscar em todo o sistema..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Notifications */}
            <div className="relative">
              <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-3 sm:pl-6 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{ownerUser?.name || 'Administrador'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ownerUser?.email || 'admin@crystalcare.com'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* Overlay (Fundo escuro quando o menu está aberto) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}
