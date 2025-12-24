import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Tag, Clock, FileText, RotateCcw, ToggleLeft, ToggleRight, Image as ImageIcon, Upload, Eye, Trash2, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceCatalogItem } from '../types';
import { useDialog } from '../context/DialogContext';
import { generateUUID } from '../lib/utils';

interface ServiceModalProps {
  service?: ServiceCatalogItem | null;
  onClose: () => void;
}

export default function ServiceModal({ service, onClose }: ServiceModalProps) {
  const { addService, updateService } = useApp();
  const { showAlert } = useDialog();
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<ServiceCatalogItem>>({
    name: '',
    category: '',
    description: '',
    standardTimeMinutes: 60,
    returnIntervalDays: 0,
    active: true,
    imageUrl: '',
    showOnLandingPage: true // Default to true
  });

  useEffect(() => {
    if (service) {
      setFormData({
        ...service,
        description: service.description || '',
        imageUrl: service.imageUrl || '',
        returnIntervalDays: service.returnIntervalDays || 0,
        showOnLandingPage: service.showOnLandingPage !== undefined ? service.showOnLandingPage : true
      });
    } else {
      // Focus on name input for new service
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return; // Prevent double submission
    
    setIsSaving(true);
    
    try {
        let success = false;
        if (service) {
          // Edit Mode
          success = await updateService(service.id, formData);
        } else {
          // Create Mode
          const newService: ServiceCatalogItem = {
            id: generateUUID(),
            name: formData.name || 'Novo Serviço',
            category: formData.category || 'Geral',
            description: formData.description || '',
            standardTimeMinutes: formData.standardTimeMinutes || 60,
            returnIntervalDays: formData.returnIntervalDays || 0,
            active: formData.active !== undefined ? formData.active : true,
            imageUrl: formData.imageUrl || '',
            showOnLandingPage: formData.showOnLandingPage !== undefined ? formData.showOnLandingPage : true
          };
          success = await addService(newService);
        }

        if (success) {
            await showAlert({ title: 'Sucesso', message: 'Serviço salvo com sucesso.', type: 'success' });
            onClose();
        } else {
            throw new Error("Falha na operação");
        }
    } catch (error) {
        console.error(error);
        await showAlert({ title: 'Erro', message: 'Erro ao salvar serviço.', type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (Limit increased to 2MB)
      if (file.size > 2 * 1024 * 1024) {
          showAlert({
            title: 'Arquivo muito grande',
            message: 'A imagem selecionada excede o limite de 2MB. Por favor, escolha uma imagem menor ou comprima-a para garantir o desempenho do sistema.',
            type: 'warning'
          });
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // This converts to Base64 string which persists in DB
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const isBase64 = formData.imageUrl?.startsWith('data:');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh]">
        
        {/* Header (Fixo) */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
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

        {/* Form Content (Rolável) */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Serviço</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  ref={nameInputRef}
                  type="text" 
                  required
                  value={formData.name || ''}
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
                  value={formData.category || ''}
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
                    value={formData.standardTimeMinutes || 0}
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
                  value={formData.description || ''}
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
                          value={isBase64 ? 'Imagem carregada (Base64)' : (formData.imageUrl || '')}
                          onChange={e => !isBase64 && setFormData({...formData, imageUrl: e.target.value})}
                          placeholder="Cole a URL da imagem ou faça upload..."
                          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 truncate"
                          disabled={isBase64}
                      />
                      {formData.imageUrl && (
                          <button 
                              type="button"
                              onClick={handleClearImage}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                              title="Remover imagem"
                          >
                              <Trash2 size={16} />
                          </button>
                      )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Upload size={18} className="text-slate-600 dark:text-slate-300" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
              </div>
              {formData.imageUrl && (
                  <div className="mt-2 relative h-32 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
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
                      value={formData.returnIntervalDays || ''}
                      onChange={e => setFormData({...formData, returnIntervalDays: parseInt(e.target.value)})}
                      placeholder="0 = Sem alerta"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                      />
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Visibilidade</label>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 h-[46px]">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Eye size={14} /> Landing Page
                      </span>
                      <button 
                          type="button"
                          onClick={() => setFormData({...formData, showOnLandingPage: !formData.showOnLandingPage})}
                          className={formData.showOnLandingPage ? "text-blue-500" : "text-slate-400"}
                      >
                          {formData.showOnLandingPage ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                  </div>
               </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 text-center">
              * Os preços devem ser configurados na aba "Matriz de Preços" após salvar.
            </div>
          </form>
        </div>

        {/* Footer (Fixo) - Botões fora da área de rolagem */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 flex-shrink-0">
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
            form="service-form"
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : 'Salvar Serviço'}
          </button>
        </div>

      </div>
    </div>
  );
}
