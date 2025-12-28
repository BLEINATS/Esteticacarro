import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DialogProvider } from './context/DialogContext';
import { SuperAdminProvider } from './context/SuperAdminContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Operations from './pages/Operations';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import Team from './pages/Team';
import Clients from './pages/Clients';
import ServicesPricing from './pages/ServicesPricing';
import TechPortal from './pages/TechPortal';
import Marketing from './pages/Marketing';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import ShopLanding from './pages/ShopLanding';
import SaaSLanding from './pages/SaaSLanding';
import Gamification from './pages/Gamification';
import ClientProfile from './pages/ClientProfile';
import OwnerLogin from './pages/OwnerLogin';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ServiceTracker from './pages/ServiceTracker'; 
import ProtectedRoute from './components/ProtectedRoute';

// Super Admin Pages
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin';
import SuperAdminLayout from './pages/super-admin/SuperAdminLayout';
import SaaSDashboard from './pages/super-admin/SaaSDashboard';
import Tenants from './pages/super-admin/Tenants';
import Plans from './pages/super-admin/Plans';
import SaaSMetrics from './pages/super-admin/SaaSMetrics';
import SuperAdminSettings from './pages/super-admin/SuperAdminSettings';
import SaaSFinance from './pages/super-admin/SaaSFinance';
import SupportTickets from './pages/super-admin/SupportTickets';

function App() {
  return (
    <SuperAdminProvider>
      <AppProvider>
        <DialogProvider>
          <BrowserRouter>
            <Routes>
              {/* Landing Page do Produto (SaaS) */}
              <Route path="/product" element={<SaaSLanding />} />
              
              {/* Rotas Públicas (Acesso sem login) */}
              <Route path="/shop" element={<ShopLanding />} />
              <Route path="/shop/:shopId" element={<ShopLanding />} />
              
              <Route path="/login" element={<OwnerLogin />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              
              {/* ROTA PÚBLICA DO CARTÃO DE FIDELIDADE (WALLET) */}
              <Route path="/client-profile/:clientId" element={<ClientProfile />} />

              {/* ROTA PÚBLICA DE RASTREAMENTO DE SERVIÇO */}
              <Route path="/track/:orderId" element={<ServiceTracker />} />

              {/* Portal do Técnico (Standalone - Sem Sidebar de Admin) */}
              <Route path="/tech-portal" element={<TechPortal />} />
              
              {/* Rotas do Sistema Admin (Protegidas) */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="operations" element={<Operations />} />
                <Route path="clients" element={<Clients />} />
                <Route path="marketing" element={<Marketing />} />
                <Route path="finance" element={<Finance />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="team" element={<Team />} />
                <Route path="pricing" element={<ServicesPricing />} />
                <Route path="settings" element={<Settings />} />
                <Route path="gamification" element={<Gamification />} />
              </Route>

              {/* Rotas do Super Admin (SaaS Owner) */}
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/super-admin" element={<SuperAdminLayout />}>
                <Route path="dashboard" element={<SaaSDashboard />} />
                <Route path="finance" element={<SaaSFinance />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="plans" element={<Plans />} />
                <Route path="metrics" element={<SaaSMetrics />} />
                <Route path="support" element={<SupportTickets />} />
                <Route path="settings" element={<SuperAdminSettings />} />
                <Route index element={<SaaSDashboard />} />
              </Route>

            </Routes>
          </BrowserRouter>
        </DialogProvider>
      </AppProvider>
    </SuperAdminProvider>
  );
}

export default App;
