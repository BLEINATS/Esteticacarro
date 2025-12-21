import React, { useState, useMemo, useEffect } from 'react';
import { Client, VehicleSize, VEHICLE_SIZES } from '../types';
import { Search, Filter, CheckSquare, Square, Users, Car, DollarSign, Clock, Calendar, Star } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

interface RecipientSelectorProps {
  clients: Client[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  preSelectedSegment?: string;
}

type FilterSegment = 'all' | 'vip' | 'recurring' | 'inactive' | 'new' | 'high_ltv' | 'low_ltv' | 'recent' | 'long_time';

export default function RecipientSelector({ clients, selectedIds, onSelectionChange, preSelectedSegment }: RecipientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<FilterSegment>((preSelectedSegment as FilterSegment) || 'all');
  const [activeVehicleSize, setActiveVehicleSize] = useState<VehicleSize | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sync with prop if it changes (Smart Template Selection)
  useEffect(() => {
      if (preSelectedSegment) {
          setActiveSegment(preSelectedSegment as FilterSegment);
      }
  }, [preSelectedSegment]);

  // Auto-select clients when segment changes (Smart Selection)
  useEffect(() => {
      if (preSelectedSegment && preSelectedSegment !== 'all') {
          const ids = filteredClients.map(c => c.id);
          // Avoid infinite loop or overwriting manual selection if user already interacted? 
          // For "Smart" behavior, we usually want to pre-fill.
          // Let's only do it if selection is empty to be safe, or just let the user click "Select All"
          // To be truly "Smart", let's auto-select them if it's a template switch
          onSelectionChange(ids);
      }
  }, [activeSegment]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // 1. Search
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        client.phone.includes(searchTerm) ||
        client.vehicles.some(v => v.model.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Segment Filter
      let matchesSegment = true;
      const daysSinceVisit = client.lastVisit ? differenceInDays(new Date(), new Date(client.lastVisit)) : 999;

      switch (activeSegment) {
        case 'vip': matchesSegment = client.segment === 'vip'; break;
        case 'recurring': matchesSegment = client.segment === 'recurring'; break;
        case 'inactive': matchesSegment = client.status === 'inactive' || daysSinceVisit > 60; break;
        case 'new': matchesSegment = client.segment === 'new'; break;
        case 'high_ltv': matchesSegment = (client.ltv || 0) > 1500; break;
        case 'low_ltv': matchesSegment = (client.ltv || 0) < 500; break;
        case 'recent': matchesSegment = daysSinceVisit <= 30; break;
        case 'long_time': matchesSegment = daysSinceVisit > 90; break;
        case 'all': default: matchesSegment = true;
      }
      if (!matchesSegment) return false;

      // 3. Vehicle Size Filter
      if (activeVehicleSize !== 'all') {
        const hasSize = client.vehicles.some(v => v.size === activeVehicleSize);
        if (!hasSize) return false;
      }

      return true;
    });
  }, [clients, searchTerm, activeSegment, activeVehicleSize]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredClients.length && filteredClients.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredClients.map(c => c.id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const isAllSelected = filteredClients.length > 0 && filteredClients.every(c => selectedIds.includes(c.id));

  // Helper to render contextual info based on segment
  const renderContextInfo = (client: Client) => {
      const daysSince = client.lastVisit ? differenceInDays(new Date(), new Date(client.lastVisit)) : 0;
      
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
      if (activeSegment === 'new') {
          return (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                  <Calendar size={12} /> Novo Cliente
              </span>
          );
      }
      // Default
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

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg space-y-3 animate-in slide-in-from-top-2">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Segmento do Cliente</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'vip', label: 'VIP (Alto Valor)' },
                  { id: 'inactive', label: 'Inativos (+60d)' },
                  { id: 'recurring', label: 'Recorrentes' },
                  { id: 'new', label: 'Novos' },
                  { id: 'long_time', label: 'Sumidos (+90d)' },
                ].map(seg => (
                  <button
                    key={seg.id}
                    onClick={() => setActiveSegment(seg.id as FilterSegment)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                      activeSegment === seg.id 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    )}
                  >
                    {seg.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Porte do Veículo</p>
              <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveVehicleSize('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                      activeVehicleSize === 'all' ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    )}
                >
                    Todos
                </button>
                {Object.entries(VEHICLE_SIZES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveVehicleSize(key as VehicleSize)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                      activeVehicleSize === key 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    )}
                  >
                    {label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selection Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium hover:text-blue-600 transition-colors"
            >
              {isAllSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
              Selecionar Todos
            </button>
            <span className="text-slate-400">|</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {selectedIds.length} <span className="font-normal text-slate-500 dark:text-slate-400">de {filteredClients.length} clientes</span>
            </span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredClients.length > 0 ? filteredClients.map(client => {
          const isSelected = selectedIds.includes(client.id);
          
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
              <div className={cn("text-blue-600", isSelected ? "opacity-100" : "opacity-30")}>
                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{client.name}</p>
                  {renderContextInfo(client)}
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Car size={12} /> {client.vehicles[0]?.model || 'Sem carro'}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} /> LTV: {formatCurrency(client.ltv || 0)}</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Nenhum cliente encontrado com estes filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
