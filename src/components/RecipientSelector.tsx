import React, { useState, useMemo, useEffect } from 'react';
import { Client, VehicleSize, VEHICLE_SIZES } from '../types';
import { Search, Filter, CheckSquare, Square, Users, Car, DollarSign, Clock, Calendar, Star, X } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { differenceInDays, isValid } from 'date-fns';

interface RecipientSelectorProps {
  clients: Client[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  preSelectedSegment?: string;
}

type FilterSegment = 'all' | 'vip' | 'recurring' | 'inactive' | 'new' | 'high_ltv' | 'low_ltv' | 'recent' | 'long_time';

export default function RecipientSelector({ clients, selectedIds, onSelectionChange, preSelectedSegment }: RecipientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<FilterSegment>('all');
  const [activeVehicleSize, setActiveVehicleSize] = useState<VehicleSize | 'all'>('all');
  const [showFilters, setShowFilters] = useState(true); // Default to true for better visibility

  // Helper function to check if a client matches a segment
  const checkClientMatchesSegment = (client: Client, segment: string): boolean => {
      let daysSinceVisit = 999;
      if (client.lastVisit) {
          const visitDate = new Date(client.lastVisit);
          if (isValid(visitDate)) {
              daysSinceVisit = differenceInDays(new Date(), visitDate);
          }
      }

      switch (segment) {
        case 'vip': 
            // VIP se tiver a tag OU gastou mais de 2000 OU foi mais de 10 vezes
            return client.segment === 'vip' || (client.ltv || 0) > 2000 || (client.visitCount || 0) > 10;
        case 'recurring': 
            // Recorrente se tiver MAIS DE 1 visita (independente da tag)
            return (client.visitCount || 0) > 1; 
        case 'inactive': 
            // Inativo se status for inativo OU última visita há mais de 60 dias
            return client.status === 'inactive' || daysSinceVisit > 60;
        case 'new': 
            // Novo se tiver 0 ou 1 visita
            return (client.visitCount || 0) <= 1;
        case 'high_ltv': return (client.ltv || 0) > 1500;
        case 'low_ltv': return (client.ltv || 0) < 500;
        case 'recent': return daysSinceVisit <= 30;
        case 'long_time': return daysSinceVisit > 90;
        case 'all': return true;
        default: return true;
      }
  };

  // Smart Selection Effect: Runs only when preSelectedSegment changes (e.g. template selection)
  useEffect(() => {
      if (preSelectedSegment && preSelectedSegment !== 'all' && clients.length > 0) {
          // 1. Calculate which clients match the requested segment
          const matchingIds = clients
              .filter(c => checkClientMatchesSegment(c, preSelectedSegment))
              .map(c => c.id);
          
          // 2. Select them
          onSelectionChange(matchingIds);
          
          // 3. Update the visual filter to match, so the user sees who was selected
          setActiveSegment(preSelectedSegment as FilterSegment);
      } else if (preSelectedSegment === 'all') {
          // If template says 'all', we might want to reset or select all? 
          // Usually safer to just reset view to 'all' and let user decide, 
          // or select none if it's a fresh start.
          setActiveSegment('all');
      }
  }, [preSelectedSegment, clients]); // Removed activeSegment dependency to prevent loops

  // Filtered list for DISPLAY ONLY
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter(client => {
      // 1. Search
      const searchLower = searchTerm.toLowerCase();
      const clientName = client.name || '';
      const clientPhone = client.phone || '';
      const clientVehicles = client.vehicles || [];
      
      const matchesSearch = 
        clientName.toLowerCase().includes(searchLower) || 
        clientPhone.includes(searchTerm) ||
        clientVehicles.some(v => (v.model || '').toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // 2. Segment Filter (Visual)
      const matchesSegment = checkClientMatchesSegment(client, activeSegment);
      if (!matchesSegment) return false;

      // 3. Vehicle Size Filter
      if (activeVehicleSize !== 'all') {
        const hasSize = clientVehicles.some(v => v.size === activeVehicleSize);
        if (!hasSize) return false;
      }

      return true;
    });
  }, [clients, searchTerm, activeSegment, activeVehicleSize]);

  // Handlers
  const handleSelectAllVisible = () => {
    // Selects all CURRENTLY VISIBLE clients
    const visibleIds = filteredClients.map(c => c.id);
    // Merge with existing selection to avoid deselecting hidden ones
    const newSelection = Array.from(new Set([...selectedIds, ...visibleIds]));
    onSelectionChange(newSelection);
  };

  const handleDeselectAllVisible = () => {
    // Deselects only CURRENTLY VISIBLE clients
    const visibleIds = filteredClients.map(c => c.id);
    const newSelection = selectedIds.filter(id => !visibleIds.includes(id));
    onSelectionChange(newSelection);
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Check if all visible clients are selected
  const areAllVisibleSelected = filteredClients.length > 0 && filteredClients.every(c => selectedIds.includes(c.id));

  // Render Context Info
  const renderContextInfo = (client: Client) => {
      let daysSince = 0;
      if (client.lastVisit) {
          const d = new Date(client.lastVisit);
          if (isValid(d)) daysSince = differenceInDays(new Date(), d);
      }
      
      if (activeSegment === 'inactive' || activeSegment === 'long_time') {
          return (
              <span className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                  <Clock size={12} /> Ausente há {daysSince} dias
              </span>
          );
      }
      if (activeSegment === 'vip' || activeSegment === 'high_ltv') {
          return (
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                  <Star size={12} /> LTV: {formatCurrency(client.ltv || 0)}
              </span>
          );
      }
      return (
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock size={12} /> Última visita: {daysSince}d atrás
          </span>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header / Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, telefone ou carro..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors",
              showFilters 
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" 
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            )}
          >
            <Filter size={16} /> Filtros
          </button>
        </div>

        {/* Filter Tabs */}
        {showFilters && (
          <div className="space-y-3 animate-in slide-in-from-top-2">
            <div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'vip', label: 'VIP' },
                  { id: 'inactive', label: 'Inativos (+60d)' },
                  { id: 'recurring', label: 'Recorrentes (>1 visita)' },
                  { id: 'new', label: 'Novos' },
                ].map(seg => (
                  <button
                    key={seg.id}
                    onClick={() => setActiveSegment(seg.id as FilterSegment)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-colors border",
                      activeSegment === seg.id 
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    )}
                  >
                    {seg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selection Stats Bar */}
        <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button 
              onClick={areAllVisibleSelected ? handleDeselectAllVisible : handleSelectAllVisible}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold hover:text-blue-600 transition-colors"
            >
              {areAllVisibleSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
              {areAllVisibleSelected ? 'Desmarcar Visíveis' : 'Marcar Visíveis'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="text-slate-400">Total Selecionado:</span>
             <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold text-xs">
                {selectedIds.length} clientes
             </span>
             {selectedIds.length > 0 && (
                 <button onClick={() => onSelectionChange([])} className="ml-2 text-xs text-red-500 hover:underline">
                     Limpar
                 </button>
             )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredClients.length > 0 ? filteredClients.map(client => {
          const isSelected = selectedIds.includes(client.id);
          const vehicleModel = client.vehicles && client.vehicles.length > 0 ? client.vehicles[0].model : 'Sem carro';
          
          return (
            <div 
              key={client.id}
              onClick={() => toggleSelection(client.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                isSelected 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              )}
            >
              <div className={cn("text-blue-600 flex-shrink-0", isSelected ? "opacity-100" : "opacity-30")}>
                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{client.name}</p>
                  {renderContextInfo(client)}
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 truncate"><Car size={12} /> {vehicleModel}</span>
                  <span className="hidden sm:flex items-center gap-1"><DollarSign size={12} /> LTV: {formatCurrency(client.ltv || 0)}</span>
                  <span className="truncate">{client.phone}</span>
                  <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      (client.visitCount || 0) > 1 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                      {(client.visitCount || 0) > 1 ? 'Recorrente' : 'Novo'}
                  </span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Nenhum cliente encontrado com estes filtros.</p>
            {activeSegment !== 'all' && (
                <button 
                    onClick={() => setActiveSegment('all')}
                    className="mt-2 text-xs text-blue-500 hover:underline font-bold"
                >
                    Ver Todos os Clientes
                </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
