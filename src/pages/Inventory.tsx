import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, Plus, Info, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, cn } from '../lib/utils';
import InventoryModal from '../components/InventoryModal';
import { InventoryItem } from '../types';
import { useDialog } from '../context/DialogContext';
import { useLocation } from 'react-router-dom';

export default function Inventory() {
  const { inventory, deleteInventoryItem } = useApp();
  const { showConfirm, showAlert } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'warning'>('all');

  const location = useLocation();

  // Handle navigation from Global Search
  useEffect(() => {
    if (location.state && (location.state as any).searchTerm) {
      setSearchTerm((location.state as any).searchTerm);
    }
  }, [location.state]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Lógica de Inteligência de Estoque (Dados Reais)
  const criticalItem = inventory.find(i => i.status === 'critical');
  const warningItem = inventory.find(i => i.status === 'warning');
  const alertItem = criticalItem || warningItem;

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Excluir Item',
      message: 'Tem certeza que deseja remover este item do estoque? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      await deleteInventoryItem(id);
      await showAlert({
        title: 'Item Removido',
        message: 'O item foi removido do estoque com sucesso.',
        type: 'success'
      });
    }
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <InventoryModal 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Produtos - Estoque</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão de insumos com baixa automática via OS.</p>
        </div>
        <button 
          onClick={handleNewItem}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Novo Item
        </button>
      </div>

      {/* AI Insights / Alerts - DYNAMIC WITH REAL DATA */}
      {alertItem ? (
        <div className={cn(
          "border rounded-xl p-4 flex items-start gap-3 transition-colors",
          alertItem.status === 'critical' 
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        )}>
          <Info className={cn("mt-0.5 flex-shrink-0", alertItem.status === 'critical' ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")} size={20} />
          <div>
            <h4 className={cn("font-bold text-sm", alertItem.status === 'critical' ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300")}>
              Inteligência de Estoque
            </h4>
            <p className={cn("text-sm mt-1", alertItem.status === 'critical' ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
              O sistema detectou um alto consumo de <strong>{alertItem.name}</strong>. 
              Restam apenas <strong>{alertItem.stock} {alertItem.unit}</strong> (Mínimo: {alertItem.minStock}). 
              Considere antecipar a compra para evitar paradas.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-green-800 dark:text-green-300 text-sm">Estoque Saudável</h4>
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              Todos os itens estão com níveis adequados. Nenhuma ação de compra necessária no momento.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setFilterStatus('all')}
                className={cn("px-3 py-2 rounded-lg text-sm font-medium border", filterStatus === 'all' ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white" : "border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
                Todos
            </button>
            <button 
                onClick={() => setFilterStatus('critical')}
                className={cn("px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-2", filterStatus === 'critical' ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" : "border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
                <AlertTriangle size={14} /> Críticos
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Item</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Categoria</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Estoque</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Mínimo</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Custo</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 dark:text-slate-300 text-right text-xs sm:text-sm">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <Package size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <span className="truncate">{item.name}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">{item.category}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{item.stock} {item.unit}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{item.minStock} {item.unit}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">{formatCurrency(item.costPrice)}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    {item.status === 'critical' && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold w-fit animate-pulse">
                        <AlertTriangle size={12} /> Crítico
                        </span>
                    )}
                    {item.status === 'warning' && (
                        <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold w-fit">
                        Atenção
                        </span>
                    )}
                    {item.status === 'ok' && (
                        <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold w-fit">
                        Normal
                        </span>
                    )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                        <button 
                            onClick={() => handleEdit(item)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Pencil size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
                {filteredInventory.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-4 sm:px-6 py-8 text-center text-slate-400">
                            Nenhum item encontrado no estoque.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2 p-3">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              <Package size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum item encontrado</p>
            </div>
          ) : (
            filteredInventory.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  item.status === 'critical' ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" :
                  item.status === 'warning' ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" :
                  "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Package size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Estoque</p>
                    <p className="font-bold text-slate-900 dark:text-white">{item.stock} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Mínimo</p>
                    <p className="font-bold text-slate-900 dark:text-white">{item.minStock} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Custo</p>
                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.costPrice)}</p>
                  </div>
                </div>

                <div>
                  {item.status === 'critical' && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full text-[10px] font-bold w-fit animate-pulse">
                      <AlertTriangle size={12} /> Crítico
                    </span>
                  )}
                  {item.status === 'warning' && (
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full text-[10px] font-bold w-fit">
                      Atenção
                    </span>
                  )}
                  {item.status === 'ok' && (
                    <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full text-[10px] font-bold w-fit">
                      Normal
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
