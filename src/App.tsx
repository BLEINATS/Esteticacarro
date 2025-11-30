import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import ShopLanding from './pages/ShopLanding'; // Import new page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública da Loja (Landing Page) */}
        <Route path="/shop" element={<ShopLanding />} />

        {/* Rotas do Sistema (Admin) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="operations" element={<Operations />} />
          <Route path="tech-portal" element={<TechPortal />} />
          <Route path="clients" element={<Clients />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="finance" element={<Finance />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="team" element={<Team />} />
          <Route path="pricing" element={<ServicesPricing />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
