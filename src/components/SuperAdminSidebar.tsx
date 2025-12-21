import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Settings, LogOut, 
  ShieldCheck, Package, BarChart3, X, DollarSign
} from 'lucide-react';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { cn } from '../lib/utils';

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminSidebar({ isOpen, onClose }: SuperAdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useSuperAdmin();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin/dashboard' },
    { icon: DollarSign, label: 'Financeiro SaaS', path: '/super-admin/finance' },
    { icon: Users, label: 'Tenants (Lojas)', path: '/super-admin/tenants' },
    { icon: Package, label: 'Planos & Pacotes', path: '/super-admin/plans' },
    { icon: BarChart3, label: 'Métricas SaaS', path: '/super-admin/metrics' },
    { icon: Settings, label: 'Configurações', path: '/super-admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/product');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Super Admin</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
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
    </>
  );
}
