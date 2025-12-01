import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
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
  Settings,
  AlertTriangle,
  CheckCircle2,
  Zap
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, reminders, workOrders, inventory, companySettings } = useApp();

  const pendingReminders = reminders.filter(r => r.status === 'pending').length;
  const pendingApprovals = workOrders.filter(o => o.status === 'Aguardando Aprovação').length;
  const criticalStock = inventory.filter(i => i.status === 'critical').length;
  const totalNotifications = pendingReminders + pendingApprovals + criticalStock;

  const handleLogout = () => {
    navigate('/shop');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { icon: Zap, label: 'Gamificação & Fidelidade', path: '/gamification' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  return (
    // FIX: Use 100dvh for mobile browsers to handle address bar correctly
    <div className="h-screen supports-[height:100dvh]:h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors duration-300 overflow-hidden">
      
      {/* Overlay (Visible on ALL screens when menu is open) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar (Fixed Drawer on ALL screens) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <img 
            src={companySettings.logoUrl} 
            alt="Logo" 
            className="w-12 h-12 rounded-full shadow-md border-2 border-slate-100 dark:border-slate-700 object-cover"
          />
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight truncate">{companySettings.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide">Gestão Integrada</p>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-4">Menu Principal</div>
          {navItems.map((item) => (
            <div key={item.path} className="relative">
              <SidebarItem
                {...item}
                isActive={location.pathname === item.path}
                onClick={() => setIsMenuOpen(false)}
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
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair / Ir para Loja</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 transition-colors duration-300 flex-shrink-0">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="text-slate-600 dark:text-slate-300 p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Abrir Menu"
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

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Bell size={20} />
                  {totalNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Notificações</h3>
                            {totalNotifications > 0 && (
                                <span className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                                    {totalNotifications} novas
                                </span>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {pendingApprovals > 0 && (
                                <Link to="/operations" onClick={() => setIsNotificationsOpen(false)} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                                            <Wrench size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{pendingApprovals} OS Aguardando</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Aprovação necessária para iniciar.</p>
                                        </div>
                                    </div>
                                </Link>
                            )}
                            
                            {criticalStock > 0 && (
                                <Link to="/inventory" onClick={() => setIsNotificationsOpen(false)} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{criticalStock} Itens Críticos</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Estoque baixo detectado.</p>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {pendingReminders > 0 && (
                                <Link to="/marketing" onClick={() => setIsNotificationsOpen(false)} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                                            <Bell size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{pendingReminders} Lembretes de Retorno</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Clientes para contatar hoje.</p>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {totalNotifications === 0 && (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center gap-2">
                                    <CheckCircle2 size={24} className="text-green-500 opacity-50" />
                                    <p>Tudo limpo por aqui!</p>
                                </div>
                            )}
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-950/50 text-center">
                            <button onClick={() => setIsNotificationsOpen(false)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                Fechar
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
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

        {/* Page Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
