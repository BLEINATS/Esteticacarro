import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Beaker, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceCatalogItem, ServiceConsumptionItem } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useDialog } from '../context/DialogContext';

interface ServiceConsumptionModalProps {
  service: ServiceCatalogItem;
  onClose: () => void;
}

export default function ServiceConsumptionModal({ service, onClose }: ServiceConsumptionModalProps) {
  const { inventory, updateServiceConsumption, getServiceConsumption } = useApp();
  const { showAlert } = useDialog();
  
  const [items, setItems] = useState<ServiceConsumptionItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<string>('un');
  const [availableUnits, setAvailableUnits] = useState<{value: string, label: string}[]>([
      { value: 'un', label: 'Unidade (un)' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing consumption on mount ONLY ONCE
  useEffect(() => {
    const existing = getServiceConsumption(service.id);
    if (existing) {
      setItems(existing.items);
    }
  }, []); 

  const getInventoryItem = (id: number | string) => {
    return inventory.find(i => String(i.id) === String(id));
  };

  const handleInventoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setSelectedInventoryId(id);
      setQuantity('');
      
      const item = getInventoryItem(id);
      
      if (item) {
          const u = item.unit.toLowerCase();
          if (u === 'l' || u === 'ml') {
              setAvailableUnits([
                  { value: 'ml', label: 'Mililitros (ml)' },
                  { value: 'L', label: 'Litros (L)' }
              ]);
              setUnit('ml');
          } else if (u === 'kg' || u === 'g') {
              setAvailableUnits([
                  { value: 'g', label: 'Gramas (g)' },
                  { value: 'kg', label: 'Quilos (kg)' }
              ]);
              setUnit('g');
          } else {
              setAvailableUnits([
                  { value: 'un', label: 'Unidade (un)' },
                  { value: 'cx', label: 'Caixa (cx)' }
              ]);
              setUnit('un');
          }
      } else {
          setAvailableUnits([{ value: 'un', label: 'Unidade (un)' }]);
          setUnit('un');
      }
  };

  const handleAddItem = () => {
    if (!selectedInventoryId || !quantity) return;
    
    const inventoryIdToSave = isNaN(Number(selectedInventoryId)) ? selectedInventoryId : Number(selectedInventoryId);

    const newItem: ServiceConsumptionItem = {
      inventoryId: inventoryIdToSave as number, 
      quantity: parseFloat(quantity),
      usageUnit: unit
    };

    const existingIndex = items.findIndex(i => String(i.inventoryId) === String(newItem.inventoryId));
    
    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex] = newItem;
      setItems(updatedItems);
    } else {
      setItems([...items, newItem]);
    }

    setSelectedInventoryId('');
    setQuantity('');
    setAvailableUnits([{ value: 'un', label: 'Unidade (un)' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
        const success = await updateServiceConsumption({
          serviceId: service.id,
          items: items
        });
        
        if (success) {
            await showAlert({ title: 'Sucesso', message: 'Ficha técnica salva com sucesso!', type: 'success' });
            onClose();
        } else {
            throw new Error("Falha ao salvar");
        }
    } catch (error) {
        await showAlert({ title: 'Erro', message: 'Não foi possível salvar a ficha técnica. Tente novamente.', type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const currentCost = items.reduce((total, item) => {
    const invItem = getInventoryItem(item.inventoryId);
    if (!invItem) return total;
    
    let multiplier = 1;
    const invUnit = invItem.unit ? invItem.unit.toLowerCase() : '';
    const usageUnit = item.usageUnit ? item.usageUnit.toLowerCase() : '';

    if (invUnit === 'l' && usageUnit === 'ml') multiplier = 0.001;
    else if (invUnit === 'kg' && usageUnit === 'g') multiplier = 0.001;
    else if (invUnit === 'ml' && usageUnit === 'l') multiplier = 1000;
    else if (invUnit === 'g' && usageUnit === 'kg') multiplier = 1000;
    
    const cost = Number(invItem.costPrice) || 0;
    const qty = Number(item.quantity) || 0;
    
    return total + (cost * qty * multiplier);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh]">
        
        {/* Header (Fixo) */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Beaker className="text-blue-600" size={24} />
              Ficha Técnica
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Defina o consumo de produtos para: <span className="font-bold text-slate-700 dark:text-slate-300">{service.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content (Rolável) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Add Item Form */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Adicionar Insumo</h4>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Produto do Estoque</label>
              <select 
                value={selectedInventoryId}
                onChange={handleInventoryChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              >
                <option value="">Selecione um produto...</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.stock} {item.unit} disp.)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Quantidade</label>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Unidade de Uso</label>
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                  disabled={!selectedInventoryId} 
                >
                  {availableUnits.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleAddItem}
              disabled={!selectedInventoryId || !quantity}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Adicionar à Receita
            </button>
          </div>

          {/* List of Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">Insumos Configurados</h4>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-bold">
                    {items.length} itens
                </span>
            </div>
            
            <div className="space-y-2">
              {items.length > 0 ? (
                items.map((item, index) => {
                  const invItem = getInventoryItem(item.inventoryId);
                  return (
                    <div key={`${item.inventoryId}-${index}`} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        {invItem ? (
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{invItem.name}</p>
                        ) : (
                            <p className="text-sm font-bold text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} /> Item removido do estoque
                            </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Consumo: {item.quantity} {item.usageUnit}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-sm">Nenhum insumo configurado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 flex justify-between items-center">
            <div>
                <p className="text-xs font-bold text-green-800 dark:text-green-300 uppercase">Custo Estimado (CMV)</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Baseado no preço de custo do estoque</p>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(currentCost)}</p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>Estes itens serão descontados automaticamente do estoque sempre que uma Ordem de Serviço com este serviço for concluída.</p>
          </div>

        </div>

        {/* Footer (Fixo) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900 flex-shrink-0">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : 'Salvar Ficha Técnica'}
          </button>
        </div>

      </div>
    </div>
  );
}
