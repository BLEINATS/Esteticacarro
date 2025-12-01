import React, { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Save, 
  Upload, CheckCircle2, Layout, MessageCircle,
  QrCode, Smartphone, Wifi, Battery, LogOut, Loader2, RefreshCw,
  Globe, ExternalLink, Image as ImageIcon,
  Instagram, Facebook, ChevronRight, Moon, Sun, Bell, Globe2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn, formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { 
    companySettings, 
    updateCompanySettings, 
    subscription, 
    connectWhatsapp, 
    disconnectWhatsapp,
    services,
    updateService,
    toggleTheme,
    theme
  } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'integrations' | 'preferences' | 'landing'>('general');
  
  // Form States
  const [formData, setFormData] = useState(companySettings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(companySettings);
  }, [companySettings]);

  // --- MASK HELPERS ---
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2');
  };

  const maskCpfCnpj = (value: string) => {
    const v = value.replace(/\D/g, '');
    
    if (v.length <= 11) {
      // CPF Mask: 000.000.000-00
      return v
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ Mask: 00.000.000/0000-00
      return v
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTemplateChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      whatsapp: {
        ...prev.whatsapp,
        templates: {
          ...prev.whatsapp.templates,
          [key]: value
        }
      }
    }));
  };

  const handleLandingChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      landingPage: {
        ...prev.landingPage,
        [key]: value
      }
    }));
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      handleLandingChange('heroImage', url);
    }
  };

  const handleServiceImageUpdate = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      updateService(id, { imageUrl: url });
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [key]: value
        }
      }
    }));
  };

  // Sync local theme change with global theme
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    handlePreferenceChange('theme', newTheme);
    if (theme !== newTheme) {
        toggleTheme();
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie sua empresa e assinatura.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0 overflow-hidden">
        {/* Navigation - Horizontal Scroll on Mobile, Vertical Sidebar on Desktop */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:overflow-y-auto no-scrollbar lg:h-full">
            {[
              { id: 'general', label: 'Dados da Empresa', icon: Building2 },
              { id: 'landing', label: 'Página Web', icon: Globe },
              { id: 'integrations', label: 'WhatsApp', icon: QrCode },
              { id: 'billing', label: 'Assinatura', icon: CreditCard },
              { id: 'preferences', label: 'Preferências', icon: Layout },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex-shrink-0 lg:w-full text-left",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 overflow-y-auto lg:pr-4">
          
          {/* TAB: GENERAL (COMPANY INFO) */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Identidade da Empresa</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Esses dados aparecerão nas Ordens de Serviço e Faturas.</p>
              </div>
              
              <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
                {/* Logo Upload Simulation */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800"
                  />
                  <div className="text-center sm:text-left">
                    <button type="button" className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mx-auto sm:mx-0">
                      <Upload size={16} /> Alterar Logo
                    </button>
                    <p className="text-xs text-slate-400 mt-2">Recomendado: 500x500px (PNG/JPG)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome Fantasia</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Responsável</label>
                    <input 
                      type="text" 
                      value={formData.responsibleName || ''}
                      onChange={e => setFormData({...formData, responsibleName: e.target.value})}
                      placeholder="Ex: João Silva"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CNPJ / CPF</label>
                    <input 
                      type="text" 
                      value={formData.cnpj}
                      onChange={e => setFormData({...formData, cnpj: maskCpfCnpj(e.target.value)})}
                      maxLength={18}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Telefone</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Email de Contato</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Endereço Completo</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Saldo Inicial (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.initialBalance}
                      onChange={e => setFormData({...formData, initialBalance: parseFloat(e.target.value) || 0})}
                      placeholder="15000,00"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                    <p className="text-xs text-slate-400 mt-1">Valor base para cálculo do extrato bancário</p>
                  </div>
                </div>

                {/* Social Media Fields */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Redes Sociais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                                <Instagram size={14} /> Instagram (URL)
                            </label>
                            <input 
                                type="text" 
                                value={formData.instagram || ''}
                                onChange={e => setFormData({...formData, instagram: e.target.value})}
                                placeholder="https://instagram.com/suaempresa"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                                <Facebook size={14} /> Facebook (URL)
                            </label>
                            <input 
                                type="text" 
                                value={formData.facebook || ''}
                                onChange={e => setFormData({...formData, facebook: e.target.value})}
                                placeholder="https://facebook.com/suaempresa"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {isSaved ? (
                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={20} /> Alterações salvas!
                    </span>
                  ) : <span className="hidden sm:block"></span>}
                  <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                    <Save size={20} /> Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: LANDING PAGE (NEW) */}
          {activeTab === 'landing' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Página Web da Loja</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure sua vitrine online para captar clientes.</p>
                </div>
                <Link to="/shop" className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full sm:w-auto justify-center">
                    <ExternalLink size={16} /> Ver Página
                </Link>
              </div>
              
              <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
                    <div>
                        <span className="font-bold text-slate-900 dark:text-white block">Página Ativa</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Se desativado, clientes verão uma tela de manutenção.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.landingPage.enabled} onChange={e => handleLandingChange('enabled', e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Título Principal (Hero)</label>
                        <input 
                            type="text" 
                            value={formData.landingPage.heroTitle}
                            onChange={e => handleLandingChange('heroTitle', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Subtítulo</label>
                        <textarea 
                            rows={2}
                            value={formData.landingPage.heroSubtitle}
                            onChange={e => handleLandingChange('heroSubtitle', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Imagem de Capa (Hero Image)</label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="relative flex-1 w-full">
                                <input 
                                    type="text" 
                                    value={formData.landingPage.heroImage}
                                    onChange={e => handleLandingChange('heroImage', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="URL da imagem..."
                                />
                            </div>
                            <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto">
                                <Upload size={18} className="text-slate-600 dark:text-slate-300" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
                            </label>
                        </div>
                        {formData.landingPage.heroImage && (
                            <div className="mt-2 relative h-40 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img src={formData.landingPage.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input 
                            type="checkbox"
                            checked={formData.landingPage.showServices}
                            onChange={e => handleLandingChange('showServices', e.target.checked)}
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar Serviços</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input 
                            type="checkbox"
                            checked={formData.landingPage.showTestimonials}
                            onChange={e => handleLandingChange('showTestimonials', e.target.checked)}
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar Depoimentos</span>
                    </label>
                </div>

                {/* SERVICE IMAGES SECTION */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-blue-600" />
                        Galeria de Serviços
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Personalize as fotos que aparecem nos cards de serviço da sua página.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.filter(s => s.active).map(service => (
                            <div key={service.id} className="flex items-center gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 relative group">
                                    {service.imageUrl ? (
                                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload size={16} className="text-white" />
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleServiceImageUpdate(service.id, e)}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{service.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{service.category}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {isSaved ? (
                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={20} /> Alterações salvas!
                    </span>
                  ) : <span className="hidden sm:block"></span>}
                  <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                    <Save size={20} /> Salvar Página
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: INTEGRATIONS (WHATSAPP QR CODE) */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              
              {/* Connection Status Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Conexão WhatsApp</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Escaneie o QR Code para conectar seu número.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-[300px]">
                  
                  {/* STATE: DISCONNECTED */}
                  {companySettings.whatsapp.session.status === 'disconnected' && (
                    <div className="text-center animate-in fade-in">
                        <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Smartphone size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum dispositivo conectado</h4>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                            Clique abaixo para gerar o QR Code e conecte seu WhatsApp Business para enviar mensagens automáticas.
                        </p>
                        <button 
                            onClick={connectWhatsapp}
                            className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-900/20 transition-all flex items-center gap-2 mx-auto"
                        >
                            <QrCode size={20} /> Gerar QR Code
                        </button>
                    </div>
                  )}

                  {/* STATE: SCANNING */}
                  {companySettings.whatsapp.session.status === 'scanning' && (
                    <div className="text-center animate-in fade-in">
                        <div className="relative w-64 h-64 bg-white p-4 rounded-xl shadow-sm mx-auto mb-4 border border-slate-200">
                            {/* Real-looking QR Code via API */}
                            <img 
                                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CristalCareAuth" 
                                alt="Scan Me" 
                                className="w-full h-full object-contain opacity-90"
                            />
                            <div className="absolute inset-0 border-4 border-green-500/30 rounded-xl animate-pulse"></div>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Escaneie com seu WhatsApp</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> Aguardando leitura...
                        </p>
                    </div>
                  )}

                  {/* STATE: CONNECTED */}
                  {companySettings.whatsapp.session.status === 'connected' && (
                    <div className="w-full max-w-md animate-in zoom-in duration-300">
                        <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-900/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <img 
                                    src={companySettings.whatsapp.session.device?.avatarUrl} 
                                    alt="Avatar" 
                                    className="w-16 h-16 rounded-full border-2 border-green-500 p-0.5"
                                />
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                        {companySettings.whatsapp.session.device?.name}
                                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                    </h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{companySettings.whatsapp.session.device?.number}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                                    <Wifi size={18} className="text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Status</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Online</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                                    <Battery size={18} className="text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Bateria</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{companySettings.whatsapp.session.device?.battery}%</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={disconnectWhatsapp}
                                className="w-full py-3 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} /> Desconectar
                            </button>
                        </div>
                        
                        <div className="mt-4 text-center">
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1">
                                <CheckCircle2 size={14} /> Mensagens automáticas ativas
                            </p>
                        </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Templates Section */}
              {companySettings.whatsapp.session.status === 'connected' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 animate-in slide-in-from-bottom-4">
                    <div className="mb-6">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Templates de Mensagem</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Personalize o texto padrão. Use variáveis como <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-blue-600">{`{cliente}`}</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-blue-600">{`{veiculo}`}</code> e <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-blue-600">{`{valor}`}</code>.</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { key: 'welcome', label: 'Boas-vindas (Cadastro)', placeholder: 'Olá {cliente}...' },
                            { key: 'completion', label: 'Serviço Concluído', placeholder: 'Seu carro está pronto...' },
                            { key: 'nps', label: 'Pesquisa de Satisfação (NPS)', placeholder: 'Avalie nosso serviço...' },
                            { key: 'recall', label: 'Lembrete de Retorno (Recall)', placeholder: 'Hora de renovar a proteção...' },
                        ].map(template => (
                            <div key={template.key}>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{template.label}</label>
                                <textarea 
                                    value={(formData.whatsapp.templates as any)[template.key]}
                                    onChange={(e) => handleTemplateChange(template.key, e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder={template.placeholder}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button 
                            onClick={handleSave}
                            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> Salvar Configurações
                        </button>
                    </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: BILLING (SAAS) */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Plano Profissional</span>
                      <span className="text-green-400 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Ativo</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-2">R$ 299,90 <span className="text-lg font-normal text-slate-400">/mês</span></h3>
                    <p className="text-slate-400 text-sm mb-6">Próxima cobrança em {new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}</p>
                    
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-white text-slate-900 font-bold rounded-lg text-sm hover:bg-slate-100 transition-colors">Alterar Plano</button>
                      <button className="px-4 py-2 bg-white/10 text-white font-bold rounded-lg text-sm hover:bg-white/20 transition-colors">Gerenciar Pagamento</button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 min-w-[250px]">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Método de Pagamento</p>
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="text-white" size={24} />
                      <span className="font-medium">{subscription.paymentMethod}</span>
                    </div>
                    <p className="text-xs text-slate-500">Expira em 12/2028</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Histórico de Faturas</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Valor</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {subscription.invoices.map(inv => (
                        <tr key={inv.id}>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">R$ {inv.amount.toFixed(2).replace('.', ',')}</td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs font-bold">Pago</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs">PDF</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PREFERENCES */}
          {activeTab === 'preferences' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Layout size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Aparência</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Personalize como o sistema é exibido para você.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Tema do Sistema</label>
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => handleThemeChange('light')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        formData.preferences.theme === 'light'
                                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                    )}
                                >
                                    <Sun size={20} />
                                    <span className="font-medium">Claro</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleThemeChange('dark')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        formData.preferences.theme === 'dark'
                                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                    )}
                                >
                                    <Moon size={20} />
                                    <span className="font-medium">Escuro</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Notificações</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Escolha quais alertas você deseja receber no painel.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div>
                                <span className="block font-bold text-slate-900 dark:text-white">Estoque Baixo</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Alertar quando produtos atingirem o nível crítico.</span>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.preferences.notifications.lowStock}
                                    onChange={e => handleNotificationChange('lowStock', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div>
                                <span className="block font-bold text-slate-900 dark:text-white">Atualizações de OS</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Notificar quando uma OS mudar de status ou precisar de aprovação.</span>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.preferences.notifications.osUpdates}
                                    onChange={e => handleNotificationChange('osUpdates', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div>
                                <span className="block font-bold text-slate-900 dark:text-white">Marketing & CRM</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Avisar sobre lembretes de retorno e performance de campanhas.</span>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.preferences.notifications.marketing}
                                    onChange={e => handleNotificationChange('marketing', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Globe2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Localização</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Configurações regionais do sistema.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Idioma</label>
                            <select 
                                value={formData.preferences.language}
                                onChange={e => handlePreferenceChange('language', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="pt-BR">Português (Brasil)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es-ES">Español</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fuso Horário</label>
                            <select 
                                disabled
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                            >
                                <option>Horário de Brasília (GMT-3)</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Definido automaticamente pelo navegador.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {isSaved ? (
                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={20} /> Preferências salvas!
                    </span>
                  ) : <span className="hidden sm:block"></span>}
                  <button type="submit" onClick={handleSave} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                    <Save size={20} /> Salvar Preferências
                  </button>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
