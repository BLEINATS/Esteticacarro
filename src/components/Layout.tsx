import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  Wallet, 
  Package, 
  Users, 
  Menu, 
  X, 
  Bell,
  LogOut,
  Moon,
  Sun,
  UserCircle,
  Tags,
  Smartphone,
  Megaphone,
  Calendar,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';

const SidebarItem = ({ icon: Icon, label, path, isActive, onClick }: any) => (
  <Link
    to={path}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      isActive 
        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
        : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
    )}
  >
    <Icon size={20} className={cn("transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400")} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme, reminders, workOrders, companySettings } = useApp(); // Added companySettings

  const pendingReminders = reminders.filter(r => r.status === 'pending').length;
  const pendingApprovals = workOrders.filter(o => o.status === 'Aguardando Aprovação').length;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
    { icon: Wrench, label: 'Operações (Admin)', path: '/operations' },
    { icon: Smartphone, label: 'Portal do Técnico', path: '/tech-portal' },
    { icon: UserCircle, label: 'Clientes', path: '/clients' },
    { icon: Megaphone, label: 'Marketing & CRM', path: '/marketing' },
    { icon: Wallet, label: 'Financeiro', path: '/finance' },
    { icon: Package, label: 'Estoque', path: '/inventory' },
    { icon: Tags, label: 'Catálogo & Preços', path: '/pricing' },
    { icon: Users, label: 'Equipe & RH', path: '/team' },
    { icon: Settings, label: 'Configurações', path: '/settings' }, // Added Settings
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-300">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out lg:transform-none flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <img 
            src={companySettings.logoUrl} // Dynamic Logo
            alt="Logo" 
            className="w-12 h-12 rounded-full shadow-md border-2 border-slate-100 dark:border-slate-700 object-cover"
          />
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight truncate">{companySettings.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">Gestão Integrada</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-4">Menu Principal</div>
          {navItems.map((item) => (
            <div key={item.path} className="relative">
              <SidebarItem
                {...item}
                isActive={location.pathname === item.path}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              {item.path === '/operations' && pendingApprovals > 0 && (
                <span className="absolute right-3 top-3 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingApprovals}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 transition-colors duration-300">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-slate-600 dark:text-slate-300 p-2 -ml-2"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="relative p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Bell size={20} />
              {(pendingReminders > 0 || pendingApprovals > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Admin Gerente</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unidade Matriz</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                AG
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
