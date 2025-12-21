import React, { useState, useMemo } from 'react';
import { 
  Tags, Filter, Plus, ArrowUpRight, Calculator, Info,
  CheckCircle2, Clock, RotateCcw, ToggleLeft, ToggleRight, Image as ImageIcon, Upload,
  Search, Trash2, Beaker, DollarSign, TrendingUp, TrendingDown, BarChart3, AlertTriangle, Timer,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, cn } from '../lib/utils';
import { VehicleSize, VEHICLE_SIZES, ServiceCatalogItem } from '../types';
import ServiceModal from '../components/ServiceModal';
import ServiceConsumptionModal from '../components/ServiceConsumptionModal';
import { useDialog } from '../context/DialogContext';

export default function ServicesPricing() {
  const { services, priceMatrix, updatePrice, bulkUpdatePrices, updateServiceInterval, deleteService, calculateServiceCost, workOrders } = useApp();
  const { showConfirm, showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState<'matrix' | 'catalog' | 'profitability'>('matrix');
  const [bulkPercentage, setBulkPercentage] = useState<number>(10);
  const [bulkTarget, setBulkTarget] = useState<VehicleSize | 'all'>('large');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Shop Hourly Cost State (Local for now, could be in CompanySettings)
  const [shopHourlyCost, setShopHourlyCost] = useState<number>(50); // Default R$ 50/h
  const [isEditingHourlyCost, setIsEditingHourlyCost] = useState(false);

  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);

  const sizes: VehicleSize[] = ['small', 'medium', 'large', 'xl'];

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- PROFITABILITY ANALYSIS LOGIC ---
  const profitabilityData = useMemo(() => {
    return services.map(service => {
        // 1. Revenue (Use Medium size as baseline reference)
        const price = priceMatrix.find(p => p.serviceId === service.id && p.size === 'medium')?.price || 0;
        
        // 2. Cost (CMV from Consumption)
        const cost = calculateServiceCost(service.id);
        
        // 3. Margin Bruta
        const grossMargin = price - cost;
        const marginPercent = price > 0 ? (grossMargin / price) * 100 : 0;
        
        // 4. Efficiency (Profit per Hour)
        const timeHours = (service.standardTimeMinutes || 60) / 60;
        const profitPerHour = timeHours > 0 ? grossMargin / timeHours : 0;

        // 5. Net Profit (Considering Shop Hourly Cost)
        const laborCost = timeHours * shopHourlyCost;
        const netProfit = grossMargin - laborCost;
        const netMarginPercent = price > 0 ? (netProfit / price) * 100 : 0;

        // 6. Volume (Real usage from WorkOrders)
        const usageCount = workOrders.filter(os => 
            os.serviceId === service.id || (os.serviceIds && os.serviceIds.includes(service.id))
        ).length;

        // 7. Classification
        let status: 'star' | 'cash_cow' | 'question' | 'dog' = 'question';
        
        // Simple BCG-like Logic
        if (marginPercent > 50 && usageCount > 5) status = 'star'; // High Margin, High Vol
        else if (marginPercent > 50 && usageCount <= 5) status = 'question'; // High Margin, Low Vol (Potential)
        else if (marginPercent <= 50 && usageCount > 5) status = 'cash_cow'; // Low Margin, High Vol
        else status = 'dog'; // Low Margin, Low Vol

        // Schedule Hog Check (Low Profit/Hour + High Time)
        const isScheduleHog = profitPerHour < shopHourlyCost && service.standardTimeMinutes > 120;

        return {
            ...service,
            metrics: {
                price,
                cost,
                grossMargin,
                marginPercent,
                timeHours,
                profitPerHour,
                usageCount,
                status,
                isScheduleHog,
                netProfit,
                netMarginPercent
            }
        };
    }).sort((a, b) => b.metrics.grossMargin - a.metrics.grossMargin); // Default sort by margin
  }, [services, priceMatrix, workOrders, calculateServiceCost, shopHourlyCost]);

  const topProfitable = [...profitabilityData].sort((a, b) => b.metrics.profitPerHour - a.metrics.profitPerHour).slice(0, 3);
  const scheduleHogs = profitabilityData.filter(s => s.metrics.isScheduleHog).sort((a, b) => a.metrics.profitPerHour - b.metrics.profitPerHour).slice(0, 3);


  const handleBulkUpdate = () => {
    bulkUpdatePrices(bulkTarget, bulkPercentage);
    setShowBulkConfirm(false);
  };

  const handleNewService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service: ServiceCatalogItem) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleConsumption = (service: ServiceCatalogItem) => {
    setSelectedService(service);
    setIsConsumptionModalOpen(true);
  };

  const handleDeleteService = async (id: string) => {
    const confirmed = await showConfirm({
        title: 'Excluir Serviço',
        message: 'Tem certeza que deseja excluir este serviço? Isso removerá também os preços associados.',
        type: 'danger',
        confirmText: 'Sim, Excluir',
        cancelText: 'Cancelar'
    });

    if (confirmed) {
        deleteService(id);
        await showAlert({
            title: 'Excluído',
            message: 'Serviço removido com sucesso.',
            type: 'success'
        });
    }
  };

  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
        'Lavagem': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        'Polimento': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        'Proteção': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
        'Interior': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        'Funilaria': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
        'Acessórios': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
    };
    return styles[category] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-6">
      {isServiceModalOpen && (
        <ServiceModal 
            service={selectedService} 
            onClose={() => setIsServiceModalOpen(false)} 
        />
      )}

      {isConsumptionModalOpen && selectedService && (
        <ServiceConsumptionModal 
            service={selectedService} 
            onClose={() => setIsConsumptionModalOpen(false)} 
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Catálogo & Precificação</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie serviços, preços e análise de lucro.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex">
            <button 
              onClick={() => setActiveTab('matrix')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors", 
                activeTab === 'matrix' 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Matriz de Preços
            </button>
            <button 
              onClick={() => setActiveTab('catalog')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors", 
                activeTab === 'catalog' 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Catálogo
            </button>
            <button 
              onClick={() => setActiveTab('profitability')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1", 
                activeTab === 'profitability' 
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <TrendingUp size={14} />
              Rentabilidade
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar serviço..." 
            className="w-full pl-10 pr-3 sm:pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>
        {activeTab === 'catalog' && (
            <button 
                onClick={handleNewService}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap"
            >
                <Plus size={16} />
                Novo Serviço
            </button>
        )}
      </div>

      {/* TAB: PROFITABILITY ANALYSIS */}
      {activeTab === 'profitability' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            
            {/* Shop Hourly Cost Configuration */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Custo Hora da Oficina</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Quanto custa 1 hora da sua operação (Aluguel + Luz + Salários / Horas Úteis)?
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditingHourlyCost ? (
                        <>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                                <input 
                                    type="number" 
                                    value={shopHourlyCost}
                                    onChange={(e) => setShopHourlyCost(Number(e.target.value))}
                                    className="w-24 pl-6 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-blue-500 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                                    autoFocus
                                />
                            </div>
                            <button 
                                onClick={() => setIsEditingHourlyCost(false)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                            >
                                Salvar
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(shopHourlyCost)}</span>
                            <button 
                                onClick={() => setIsEditingHourlyCost(true)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <Settings size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 mb-4">
                        <TrendingUp size={20} /> Campeões de Lucro (Por Hora)
                    </h3>
                    <div className="space-y-3">
                        {topProfitable.length > 0 ? topProfitable.map((s, idx) => (
                            <div key={s.id} className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.standardTimeMinutes} min • Margem Liq: {s.metrics.netMarginPercent.toFixed(0)}%</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.metrics.profitPerHour)}/h</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-emerald-700/60 italic">Sem dados suficientes.</p>
                        )}
                    </div>
                </div>

                {/* Schedule Hogs */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800">
                    <h3 className="text-red-800 dark:text-red-300 font-bold flex items-center gap-2 mb-4">
                        <Timer size={20} /> Gargalos de Agenda (Baixo Lucro/Hora)
                    </h3>
                    <div className="space-y-3">
                        {scheduleHogs.length > 0 ? scheduleHogs.map((s, idx) => (
                            <div key={s.id} className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded text-red-600 dark:text-red-400">
                                        <AlertTriangle size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.standardTimeMinutes} min • Margem Liq: {s.metrics.netMarginPercent.toFixed(0)}%</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(s.metrics.profitPerHour)}/h</p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle2 size={18} />
                                <p className="text-sm font-medium">Sua agenda está otimizada!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white">Detalhamento Financeiro por Serviço</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Preço Médio - (Custo Produtos + Custo Hora). Lucro Líquido Real.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Serviço</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Preço Médio</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Custo Prod.</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Margem Bruta</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Lucro Liq.</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-center">Margem Liq. %</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {profitabilityData.filter(s => 
                                s.name.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        {s.name}
                                        <div className="flex gap-1 mt-1">
                                            {s.metrics.status === 'star' && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">Estrela</span>}
                                            {s.metrics.status === 'cash_cow' && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Volume</span>}
                                            {s.metrics.isScheduleHog && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Lento</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(s.metrics.price)}</td>
                                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{formatCurrency(s.metrics.cost)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrency(s.metrics.grossMargin)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(s.metrics.netProfit)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn("h-full rounded-full", s.metrics.netMarginPercent > 30 ? "bg-green-500" : s.metrics.netMarginPercent > 15 ? "bg-yellow-500" : "bg-red-500")} 
                                                    style={{ width: `${Math.max(0, Math.min(s.metrics.netMarginPercent, 100))}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.metrics.netMarginPercent.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => handleConsumption(s)}
                                            className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                                        >
                                            Ficha Técnica
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* TAB: MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left duration-300">
          {/* ... (Existing Matrix Content) ... */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 p-6 rounded-xl text-white shadow-lg border border-slate-700">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400">
                  <Calculator size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Reajuste em Massa Inteligente</h3>
                  <p className="text-slate-400 text-sm max-w-lg">
                    Aplique aumentos percentuais em categorias específicas (ex: SUVs) sem afetar o resto da tabela.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3 bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10">
                <div className="flex-1 sm:flex-none">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoria Alvo</label>
                  <select 
                    value={bulkTarget}
                    onChange={(e) => setBulkTarget(e.target.value as any)}
                    className="w-full sm:w-40 bg-slate-800 border border-slate-600 text-white text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 sm:p-2.5"
                  >
                    <option value="all">Todas as Categorias</option>
                    {sizes.map(s => (
                      <option key={s} value={s}>{VEHICLE_SIZES[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 sm:flex-none">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ajuste (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={bulkPercentage}
                      onChange={(e) => setBulkPercentage(Number(e.target.value))}
                      className="w-full sm:w-24 bg-slate-800 border border-slate-600 text-white text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 sm:p-2.5 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBulkConfirm(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Aplicar
                </button>
              </div>
            </div>

            {showBulkConfirm && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <Info size={18} />
                  <span>Confirma o reajuste de <strong>{bulkPercentage}%</strong> para <strong>{bulkTarget === 'all' ? 'Todas as categorias' : VEHICLE_SIZES[bulkTarget]}</strong>?</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowBulkConfirm(false)} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1">Cancelar</button>
                  <button onClick={handleBulkUpdate} className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md">Confirmar</button>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-2 sm:px-6 py-3 sm:py-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider min-w-[140px]">Serviço</th>
                    {sizes.map(size => (
                      <th key={size} className="px-1 sm:px-6 py-3 sm:py-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center whitespace-nowrap min-w-[80px]">
                        {VEHICLE_SIZES[size]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-2 sm:px-6 py-2 sm:py-4 min-w-[140px]">
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{service.name}</p>
                          <span className={cn("text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold border w-fit", getCategoryStyle(service.category))}>
                              {service.category}
                          </span>
                        </div>
                      </td>
                      {sizes.map(size => {
                        const entry = priceMatrix.find(p => p.serviceId === service.id && p.size === size);
                        const price = entry ? entry.price : 0;
                        return (
                          <td key={size} className="px-1 sm:px-6 py-2 sm:py-4 text-center">
                            <div className="relative inline-block">
                              <span className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] sm:text-xs">R$</span>
                              <input 
                                type="number"
                                value={price}
                                onChange={(e) => updatePrice(service.id, size, Number(e.target.value))}
                                className="w-16 sm:w-24 pl-5 sm:pl-8 pr-1 sm:pr-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-right font-medium text-slate-900 dark:text-white transition-all text-xs sm:text-sm"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredServices.length === 0 && (
                      <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                              Nenhum serviço encontrado.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden space-y-2 p-3">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="mb-3">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{service.name}</p>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border w-fit block mt-1", getCategoryStyle(service.category))}>
                      {service.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {sizes.map(size => {
                      const entry = priceMatrix.find(p => p.serviceId === service.id && p.size === size);
                      const price = entry ? entry.price : 0;
                      const sizeLabel = size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : size === 'large' ? 'Grande' : 'Extra G.';
                      return (
                        <div key={size} className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{sizeLabel}</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                            <input 
                              type="number"
                              value={price}
                              onChange={(e) => updatePrice(service.id, size, Number(e.target.value))}
                              className="w-full pl-6 pr-2 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-right font-medium text-slate-900 dark:text-white text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredServices.length === 0 && (
                <div className="text-center py-8 text-slate-400">Nenhum serviço encontrado.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredServices.map(service => {
               // Calculate prices
               const prices = priceMatrix.filter(p => p.serviceId === service.id).map(p => p.price);
               const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
               const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
               const serviceCost = calculateServiceCost(service.id);
               
               return (
               <div key={service.id} className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden hover:-translate-y-1 flex flex-col">
                 {/* Animated Border Effect */}
                 <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/50 rounded-xl transition-colors duration-300 pointer-events-none z-20" />
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-20" />

                 {/* Image Section */}
                 <div className="h-40 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
                    {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <ImageIcon size={48} />
                        </div>
                    )}
                    
                    {/* Active Status Badge Overlay */}
                    <div className="absolute top-3 right-3 z-10">
                         <div className={cn("w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900", service.active ? "bg-green-500" : "bg-slate-300")} />
                    </div>

                    {/* Category Badge Overlay */}
                    <div className="absolute bottom-3 left-3 z-10">
                        <span className={cn("text-[10px] px-2 py-1 rounded-md font-bold uppercase shadow-sm backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-white/20", getCategoryStyle(service.category))}>
                            {service.category}
                        </span>
                    </div>
                 </div>

                 {/* Content Section */}
                 <div className="p-5 flex flex-col flex-1 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1" title={service.name}>{service.name}</h3>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{service.description}</p>
                    
                    {/* Price Display */}
                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Investimento</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {minPrice === 0 ? 'Sob Consulta' : (
                                        minPrice === maxPrice 
                                            ? formatCurrency(minPrice)
                                            : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
                                    )}
                                </p>
                            </div>
                            {serviceCost > 0 && (
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Custo (CMV)</p>
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(serviceCost)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Configuração de Recorrência */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            <RotateCcw size={12} /> Alerta de Retorno (Dias)
                        </label>
                        <input 
                            type="number"
                            value={service.returnIntervalDays || ''}
                            onChange={(e) => updateServiceInterval(service.id, parseInt(e.target.value) || 0)}
                            placeholder="Ex: 30 dias"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            O sistema avisará automaticamente quando vencer.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                        <button 
                            onClick={() => handleConsumption(service)}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                        >
                            <Beaker size={14} /> Ficha Técnica
                        </button>

                        <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEditService(service)}
                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Editar"
                                >
                                    <ArrowUpRight size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteService(service.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                        </div>
                    </div>
                 </div>
               </div>
             )})}
             {filteredServices.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                    <p>Nenhum serviço encontrado para "{searchTerm}".</p>
                </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
