import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CreditCard, Settings, LogOut, 
  ShieldCheck, Package, BarChart3
} from 'lucide-react';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { cn } from '../lib/utils';

export default function SuperAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useSuperAdmin();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin/dashboard' },
    { icon: Users, label: 'Tenants (Lojas)', path: '/super-admin/tenants' },
    { icon: Package, label: 'Planos & Pacotes', path: '/super-admin/plans' },
    { icon: BarChart3, label: 'Métricas SaaS', path: '/super-admin/metrics' },
    { icon: Settings, label: 'Configurações', path: '/super-admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Super Admin</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                isActive 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn("flex-shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-400 hover:bg-red-900/20 hover:text-red-300"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </div>
    </aside>
  );
}
