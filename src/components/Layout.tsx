import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wrench, Calendar, 
  Package, Settings, LogOut, Menu, X, 
  Bell, Search, Globe, UserCircle,
  Megaphone, DollarSign, Trophy, Tags,
  Check, Trash2, Info, AlertTriangle, CheckCircle2, Bot, Store, Save, Loader2, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';
import { cn } from '../lib/utils';
import { checkSupabaseConnection } from '../lib/supabase';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, clearAllNotifications, ownerUser, logoutOwner, subscription, tenantId, createTenant } = useApp();
  const { showConfirm, showAlert } = useDialog();

  // Store Creation State
  const [storeName, setStoreName] = useState(ownerUser?.shopName || '');
  const [storePhone, setStorePhone] = useState('');
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleCheckConnection = async () => {
      setIsCheckingConnection(true);
      const isConnected = await checkSupabaseConnection();
      setIsCheckingConnection(false);
      
      if (isConnected) {
          await showAlert({ title: 'Conexão OK', message: 'O sistema está conectado ao banco de dados.', type: 'success' });
      } else {
          await showAlert({ title: 'Erro de Conexão', message: 'Falha ao conectar com o banco de dados. Verifique sua internet.', type: 'error' });
      }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!storeName) return;
      
      setIsCreatingStore(true);
      try {
          const success = await createTenant(storeName, storePhone);
          if (success) {
              await showAlert({ title: 'Sucesso', message: 'Loja criada com sucesso! Bem-vindo.', type: 'success' });
              // Navigation happens automatically via state change in AppContext (tenantId set)
          } else {
              await showAlert({ title: 'Erro', message: 'Não foi possível criar a loja. Verifique sua conexão e tente novamente.', type: 'error' });
          }
      } catch (error) {
          console.error(error);
          await showAlert({ title: 'Erro', message: 'Erro inesperado.', type: 'error' });
      } finally {
          setIsCreatingStore(false);
      }
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  // --- NO STORE STATE (ONBOARDING) ---
  if (ownerUser && !tenantId) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                          <Store size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo, {ownerUser.name}!</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Para começar a usar o sistema, precisamos configurar sua loja.
                      </p>
                  </div>
                  
                  <form onSubmit={handleCreateStore} className="p-8 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome da Loja</label>
                          <input 
                              type="text" 
                              value={storeName}
                              onChange={e => setStoreName(e.target.value)}
                              placeholder="Ex: Auto Detail Premium"
                              required
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Telefone / WhatsApp</label>
                          <input 
                              type="text" 
                              value={storePhone}
                              onChange={e => setStorePhone(e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      
                      <button 
                          type="submit" 
                          disabled={isCreatingStore || !storeName}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 mt-4"
                      >
                          {isCreatingStore ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                          {isCreatingStore ? 'Criando Loja...' : 'Criar Minha Loja'}
                      </button>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                          <button 
                              type="button"
                              onClick={handleCheckConnection}
                              disabled={isCheckingConnection}
                              className="w-full py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1"
                          >
                              {isCheckingConnection ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                              Testar Conexão
                          </button>
                          
                          <button 
                              type="button"
                              onClick={handleLogout}
                              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                          >
                              Sair
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: Wrench, label: 'Operacional', path: '/operations' },
    { icon: DollarSign, label: 'Financeiro', path: '/finance' },
    { icon: Package, label: 'Produtos - Estoque', path: '/inventory' },
    { icon: Tags, label: 'Catálogo & Preços', path: '/pricing' },
    { icon: Megaphone, label: 'Marketing', path: '/marketing' },
    { icon: Trophy, label: 'Gamificação & Fidelidade', path: '/gamification' },
    { icon: Users, label: 'Equipe', path: '/team' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <Trash2 size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out shadow-2xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
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

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
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

          {/* Token Balance Indicator */}
          <div className="px-4 py-2">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-xl p-3 text-white shadow-lg border border-slate-700">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Bot size={16} className="text-green-400" />
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-300">Tokens Bot</span>
                    </div>
                    <Link to="/settings" state={{ activeTab: 'billing' }} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors">
                        Recarregar
                    </Link>
                </div>
                <p className="text-xl font-bold">{subscription.tokenBalance || 0}</p>
            </div>
          </div>

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
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
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
            
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notificações</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearAllNotifications}
                        className="text-xs text-slate-500 hover:text-red-500 transition-colors"
                      >
                        Limpar tudo
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={cn(
                            "p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3",
                            !notif.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                          )}
                        >
                          <div className={cn(
                            "mt-1 p-1.5 rounded-full flex-shrink-0 h-fit",
                            notif.type === 'success' ? "bg-green-100 dark:bg-green-900/30" :
                            notif.type === 'warning' ? "bg-amber-100 dark:bg-amber-900/30" :
                            notif.type === 'error' ? "bg-red-100 dark:bg-red-900/30" :
                            "bg-blue-100 dark:bg-blue-900/30"
                          )}>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className={cn("text-sm font-bold truncate", !notif.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 bg-slate-50 dark:bg-slate-950/50 text-center border-t border-slate-100 dark:border-slate-800">
                    <Link 
                      to="/settings" 
                      state={{ activeTab: 'preferences' }}
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Configurar alertas
                    </Link>
                  </div>
                </div>
              )}
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

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}
