import React, { useState } from 'react';
import { Package, AlertTriangle, Search, Plus, Info, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, cn } from '../lib/utils';
import InventoryModal from '../components/InventoryModal';
import { InventoryItem } from '../types';
import { useDialog } from '../context/DialogContext';

export default function Inventory() {
  const { inventory, deleteInventoryItem } = useApp();
  const { showConfirm, showAlert } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
      deleteInventoryItem(id);
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Estoque</h2>
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

      {/* AI Insights / Alerts */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <Info className="text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Inteligência de Estoque</h4>
          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
            O sistema detectou um alto consumo de <strong>Verniz Alto Sólidos</strong> nesta semana. 
            Considere antecipar a compra para evitar paradas na Funilaria.
          </p>
        </div>
      </div>

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
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Item</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Categoria</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Estoque</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Mínimo</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Custo</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <Package size={18} />
                    </div>
                    {item.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">{item.stock} {item.unit}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.minStock} {item.unit}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatCurrency(item.costPrice)}</td>
                    <td className="px-6 py-4">
                    {item.status === 'critical' && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs font-bold w-fit animate-pulse">
                        <AlertTriangle size={12} /> Crítico
                        </span>
                    )}
                    {item.status === 'warning' && (
                        <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full text-xs font-bold w-fit">
                        Atenção
                        </span>
                    )}
                    {item.status === 'ok' && (
                        <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs font-bold w-fit">
                        Normal
                        </span>
                    )}
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
                {filteredInventory.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                            Nenhum item encontrado no estoque.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
