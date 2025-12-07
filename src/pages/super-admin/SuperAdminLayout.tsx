import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import SuperAdminSidebar from '../../components/SuperAdminSidebar';
import { useSuperAdmin } from '../../context/SuperAdminContext';

export default function SuperAdminLayout() {
  const { isAuthenticated } = useSuperAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 ml-64">
        <Outlet />
      </main>
    </div>
  );
}
