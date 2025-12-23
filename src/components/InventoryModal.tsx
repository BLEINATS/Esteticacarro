import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertTriangle, DollarSign, Layers, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { useDialog } from '../context/DialogContext';

interface InventoryModalProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

export default function InventoryModal({ item, onClose }: InventoryModalProps) {
  const { addInventoryItem, updateInventoryItem } = useApp();
  const { showAlert } = useDialog();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    stock: 0,
    unit: 'un',
    minStock: 0,
    costPrice: 0
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        if (item) {
          // Edit Mode
          await updateInventoryItem(item.id, formData);
          await showAlert({ title: 'Sucesso', message: 'Item atualizado com sucesso.', type: 'success' });
        } else {
          // Create Mode
          await addInventoryItem(formData as any);
          await showAlert({ title: 'Sucesso', message: 'Novo item adicionado ao estoque.', type: 'success' });
        }
        onClose();
    } catch (error) {
        console.error("Erro ao salvar item:", error);
        await showAlert({ title: 'Erro', message: 'Não foi possível salvar o item. Tente novamente.', type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {item ? 'Editar Item' : 'Novo Item de Estoque'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gerencie os detalhes do produto.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Produto</label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Shampoo Automotivo"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Categoria</label>
              <input 
                type="text" 
                required
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                placeholder="Ex: Lavagem"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Unidade</label>
              <select 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
              >
                <option value="un">Unidade (un)</option>
                <option value="L">Litros (L)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="kg">Quilogramas (kg)</option>
                <option value="g">Gramas (g)</option>
                <option value="cx">Caixa (cx)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Estoque Atual</label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  required
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: parseFloat(e.target.value) || 0})}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Estoque Mínimo</label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  required
                  value={formData.minStock}
                  onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Preço de Custo (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="number" 
                step="0.01"
                value={formData.costPrice}
                onChange={e => {
                    const val = parseFloat(e.target.value);
                    setFormData({...formData, costPrice: isNaN(val) ? 0 : val});
                }}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? 'Salvando...' : 'Salvar Item'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
