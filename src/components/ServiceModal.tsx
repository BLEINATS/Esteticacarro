import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Clock, FileText, RotateCcw, ToggleLeft, ToggleRight, Image as ImageIcon, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceCatalogItem } from '../types';

interface ServiceModalProps {
  service?: ServiceCatalogItem | null;
  onClose: () => void;
}

export default function ServiceModal({ service, onClose }: ServiceModalProps) {
  const { addService, updateService } = useApp();
  
  const [formData, setFormData] = useState<Partial<ServiceCatalogItem>>({
    name: '',
    category: '',
    description: '',
    standardTimeMinutes: 60,
    returnIntervalDays: 0,
    active: true,
    imageUrl: ''
  });

  useEffect(() => {
    if (service) {
      setFormData(service);
    }
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (service) {
      // Edit Mode
      updateService(service.id, formData);
    } else {
      // Create Mode
      const newService: ServiceCatalogItem = {
        id: `srv-${Date.now()}`,
        name: formData.name || 'Novo Serviço',
        category: formData.category || 'Geral',
        description: formData.description || '',
        standardTimeMinutes: formData.standardTimeMinutes || 60,
        returnIntervalDays: formData.returnIntervalDays || 0,
        active: formData.active !== undefined ? formData.active : true,
        imageUrl: formData.imageUrl || ''
      };
      addService(newService);
    }
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {service ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Defina os detalhes técnicos e operacionais.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Serviço</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Polimento Técnico 3 Etapas"
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
                placeholder="Ex: Estética"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Tempo Padrão (min)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="number" 
                  required
                  value={formData.standardTimeMinutes}
                  onChange={e => setFormData({...formData, standardTimeMinutes: parseInt(e.target.value)})}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Descrição</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="Descreva o que está incluso neste serviço..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Foto do Serviço (Landing Page)</label>
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        placeholder="Cole a URL da imagem..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                    />
                </div>
                <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Upload size={18} className="text-slate-600 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
            </div>
            {formData.imageUrl && (
                <div className="mt-2 relative h-32 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Alerta de Retorno (Dias)</label>
                <div className="relative">
                    <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                    type="number" 
                    value={formData.returnIntervalDays}
                    onChange={e => setFormData({...formData, returnIntervalDays: parseInt(e.target.value)})}
                    placeholder="0 = Sem alerta"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                    />
                </div>
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Serviço Ativo?</span>
                <button 
                    type="button"
                    onClick={() => setFormData({...formData, active: !formData.active})}
                    className={formData.active ? "text-green-500" : "text-slate-400"}
                >
                    {formData.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
             </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 text-center">
            * Os preços devem ser configurados na aba "Matriz de Preços" após salvar.
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Salvar Serviço
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
