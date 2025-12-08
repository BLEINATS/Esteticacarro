import React, { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Save, 
  Upload, CheckCircle2, Layout, MessageCircle,
  QrCode, Smartphone, Wifi, Battery, LogOut, Loader2, RefreshCw,
  Globe, ExternalLink, Image as ImageIcon,
  Instagram, Facebook, ChevronRight, Moon, Sun, Bell, Globe2,
  Mail, ShieldAlert, DollarSign, Monitor, AlertCircle, MessageSquare, History, MapPin,
  Eye, EyeOff, Edit2, Plus, Copy, Share2, Check, X, Calendar, Info, Lock, User, Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { cn, formatCurrency } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import ServiceModal from '../components/ServiceModal';
import PaymentModal from '../components/PaymentModal';
import { ServiceCatalogItem, SaaSPlan } from '../types';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

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
    theme,
    addNotification,
    buyTokens,
    clients,
    workOrders,
    updateClient,
    changePlan,
    ownerUser
  } = useApp();
  
  const { plans, tokenPackages, saasSettings } = useSuperAdmin();
  const { showConfirm, showAlert } = useDialog();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'integrations' | 'preferences' | 'landing' | 'account'>('general');
  
  // Form States
  const [formData, setFormData] = useState(companySettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);

  // Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    type: 'token' | 'plan';
    amount: number;
    description: string;
    data?: any;
  } | null>(null);

  useEffect(() => {
    setFormData(companySettings);
  }, [companySettings]);

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

  // --- CEP LOGIC ---
  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      console.error("Error fetching CEP", error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const maskCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = maskCep(e.target.value);
    setFormData(prev => ({ ...prev, cep: value }));
    if (value.replace(/\D/g, '').length === 8) {
        fetchAddress(value);
    }
  };

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
      return v
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return v
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = `${formData.street || ''}, ${formData.number || ''} - ${formData.neighborhood || ''}, ${formData.city || ''} - ${formData.state || ''}, ${formData.cep || ''}`;
    
    let slug = formData.slug;
    if (!slug) {
        slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    updateCompanySettings({
        ...formData,
        address: fullAddress,
        slug
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
        await showAlert({ title: 'Erro', message: 'A senha deve ter pelo menos 6 caracteres.', type: 'warning' });
        return;
    }

    if (newPassword !== confirmPassword) {
        await showAlert({ title: 'Erro', message: 'As senhas não coincidem.', type: 'warning' });
        return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
        await showAlert({ title: 'Erro', message: error.message, type: 'error' });
    } else {
        setNewPassword('');
        setConfirmPassword('');
        await showAlert({ title: 'Sucesso', message: 'Senha alterada com sucesso!', type: 'success' });
    }
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

  const handleChannelChange = (channel: 'email' | 'whatsapp' | 'system', value: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          channels: {
            ...(prev.preferences?.notifications?.channels || { email: true, whatsapp: false, system: true }),
            [channel]: value
          }
        }
      }
    }));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    handlePreferenceChange('theme', newTheme);
    if (theme !== newTheme) {
        toggleTheme();
    }
  };

  const handleTestNotification = () => {
    addNotification({
      title: 'Teste de Notificação',
      message: 'Esta é uma notificação de teste para verificar suas configurações.',
      type: 'success'
    });
  };

  const handleBuyTokens = (amount: number, cost: number) => {
    setPendingTransaction({
        type: 'token',
        amount: cost,
        description: `Compra de Pacote: ${amount} Tokens`,
        data: { tokenAmount: amount }
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecalculateMetrics = async () => {
    const confirmed = await showConfirm({
        title: 'Recalcular Métricas',
        message: 'Isso irá varrer todas as Ordens de Serviço e recalcular o LTV e Visitas de todos os clientes. Deseja continuar?',
        type: 'warning',
        confirmText: 'Sim, Recalcular'
    });

    if (confirmed) {
        setIsRecalculating(true);
        setTimeout(() => {
            clients.forEach(client => {
                const clientOS = workOrders.filter(os => os.clientId === client.id && os.status === 'Concluído');
                const totalSpent = clientOS.reduce((acc, os) => acc + (os.totalValue || 0), 0);
                const visitCount = clientOS.length;
                if (client.ltv !== totalSpent || client.visitCount !== visitCount) {
                    updateClient(client.id, {
                        ltv: totalSpent,
                        visitCount: visitCount
                    });
                }
            });
            setIsRecalculating(false);
            showAlert({ title: 'Concluído', message: 'Métricas recalculadas com sucesso!', type: 'success' });
        }, 1500);
    }
  };

  const handleUpdatePlan = async (planId: 'starter' | 'pro' | 'enterprise' | 'trial') => {
    if (planId === 'trial') {
        const confirmed = await showConfirm({
            title: 'Iniciar Teste Grátis',
            message: 'Você terá acesso a todas as funcionalidades por 7 dias. Após isso, será necessário escolher um plano. Continuar?',
            confirmText: 'Iniciar Agora',
            type: 'success'
        });
        if (confirmed) {
            changePlan('trial');
            setIsPlanModalOpen(false);
            await showAlert({ title: 'Bem-vindo!', message: 'Seu período de teste de 7 dias começou.', type: 'success' });
        }
        return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setPendingTransaction({
        type: 'plan',
        amount: plan.price,
        description: `Assinatura Plano ${plan.name} (Mensal)`,
        data: { planId: plan.id }
    });
    setIsPlanModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    if (!pendingTransaction) return;

    if (pendingTransaction.type === 'token') {
        buyTokens(pendingTransaction.data.tokenAmount, pendingTransaction.amount);
        showAlert({ title: 'Sucesso', message: `${pendingTransaction.data.tokenAmount} tokens adicionados!`, type: 'success' });
    } else if (pendingTransaction.type === 'plan') {
        changePlan(pendingTransaction.data.planId);
        showAlert({ title: 'Sucesso', message: 'Plano atualizado com sucesso!', type: 'success' });
    }

    setPendingTransaction(null);
    setIsPaymentModalOpen(false);
  };

  const shopLink = `${window.location.origin}/shop/${formData.slug || 'loja'}`;

  const handleCopyLink = () => {
    const copyToClipboard = (text: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise<void>((resolve, reject) => {
          document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'));
          textArea.remove();
        });
      }
    };

    copyToClipboard(shopLink)
      .then(() => showAlert({ title: 'Copiado', message: 'Link copiado! Cole na bio do seu Instagram.', type: 'success' }))
      .catch(() => showAlert({ title: 'Erro', message: 'Copie o link manualmente.', type: 'error' }));
  };

  const handleShareLink = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: companySettings.name,
                text: 'Agende seu serviço conosco!',
                url: shopLink
            });
        } catch (err) {
            console.log('Error sharing', err);
        }
    } else {
        handleCopyLink();
    }
  };

  const handleDownloadQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(shopLink, { width: 500, margin: 2 });
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-loja-${formData.slug || 'loja'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert({ title: 'Sucesso', message: 'QR Code baixado com sucesso!', type: 'success' });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Erro', message: 'Não foi possível gerar o QR Code.', type: 'error' });
    }
  };

  const toggleServiceVisibility = (id: string, currentStatus: boolean) => {
    updateService(id, { showOnLandingPage: !currentStatus });
  };

  const handleEditService = (service: ServiceCatalogItem) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleNewService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };

  const currentPlan = plans.find(p => p.id === subscription.planId) || (subscription.planId === 'trial' ? { name: 'Período de Teste', price: 0 } : null);

  return (
    <div className="h-full flex flex-col space-y-6">
      {isServiceModalOpen && (
        <ServiceModal 
            service={selectedService} 
            onClose={() => setIsServiceModalOpen(false)} 
        />
      )}

      {isPaymentModalOpen && pendingTransaction && (
        <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            amount={pendingTransaction.amount}
            description={pendingTransaction.description}
            onSuccess={handlePaymentSuccess}
            gateway={saasSettings.paymentGateway}
        />
      )}

      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Escolha seu Plano</h3>
                    <button onClick={() => setIsPlanModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="rounded-xl border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/10 p-6 flex flex-col transition-all relative hover:shadow-lg">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                                Grátis por 7 dias
                            </div>
                            <h4 className="text-lg font-bold text-purple-900 dark:text-purple-300 text-center mt-2">Teste Grátis</h4>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 mb-6 text-center">
                                R$ 0,00
                            </p>
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-4 text-center">
                                <p className="text-sm text-slate-600 dark:text-slate-300">Acesso total a todas as funcionalidades.</p>
                            </div>
                            <ul className="space-y-3 mb-6 flex-1">
                                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                    Sem compromisso
                                </li>
                                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                    Não requer cartão
                                </li>
                            </ul>
                            <button
                                onClick={() => handleUpdatePlan('trial')}
                                disabled={subscription.planId === 'trial'}
                                className={cn(
                                    "w-full py-3 rounded-lg font-bold text-sm transition-colors",
                                    subscription.planId === 'trial'
                                        ? "bg-green-600 text-white cursor-default"
                                        : "bg-purple-600 text-white hover:bg-purple-700"
                                )}
                            >
                                {subscription.planId === 'trial' ? 'Ativo Agora' : 'Iniciar Teste'}
                            </button>
                        </div>

                        {plans.filter(p => p.active).map(plan => (
                            <div 
                                key={plan.id} 
                                className={cn(
                                    "rounded-xl border-2 p-6 flex flex-col transition-all relative",
                                    subscription.planId === plan.id 
                                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10" 
                                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900"
                                )}
                            >
                                {plan.highlight && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        Mais Popular
                                    </div>
                                )}

                                <h4 className="text-lg font-bold text-slate-900 dark:text-white text-center mt-2">{plan.name}</h4>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 mb-6 text-center">
                                    {formatCurrency(plan.price)}<span className="text-sm font-normal text-slate-500">/mês</span>
                                </p>

                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-4 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><MessageSquare size={14} /> Tokens Mensais</span>
                                        <div className="text-right">
                                            <span className="font-bold text-slate-900 dark:text-white block">{plan.includedTokens}</span>
                                            <span className="text-xs text-slate-400 font-normal">(Não cumulativo)</span>
                                        </div>
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-6 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleUpdatePlan(plan.id)}
                                    disabled={subscription.planId === plan.id}
                                    className={cn(
                                        "w-full py-3 rounded-lg font-bold text-sm transition-colors",
                                        subscription.planId === plan.id
                                            ? "bg-green-600 text-white cursor-default"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    )}
                                >
                                    {subscription.planId === plan.id ? 'Plano Atual' : 'Selecionar'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie sua empresa e assinatura.</p>
        </div>
      </div>

      {/* MAIN LAYOUT CONTAINER */}
      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* TOP TABS NAVIGATION */}
        <div className="w-full flex-shrink-0 border-b border-slate-200 dark:border-slate-800 pb-1">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'general', label: 'Dados da Empresa', icon: Building2 },
              { id: 'landing', label: 'Página Web', icon: Globe },
              { id: 'integrations', label: 'WhatsApp', icon: QrCode },
              { id: 'billing', label: 'Assinatura & Tokens', icon: CreditCard },
              { id: 'preferences', label: 'Preferências', icon: Layout },
              { id: 'account', label: 'Conta & Segurança', icon: Lock },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 text-sm",
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-20">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Identidade da Empresa</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Esses dados aparecerão nas Ordens de Serviço e Faturas.</p>
              </div>
              
              <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
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
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Slug da Loja (URL)</label>
                    <div className="flex items-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 border border-r-0 border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-l-lg text-sm">
                            /shop/
                        </span>
                        <input 
                        type="text" 
                        value={formData.slug || ''}
                        onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                        placeholder="minha-loja"
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-r-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Identificador único para o link público da sua loja.</p>
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
                    <p className="text-[10px] text-slate-400 mt-1">
                        * Este número será usado para o link do WhatsApp. O título "M C P..." que aparece no WhatsApp é definido nas configurações do seu WhatsApp Business, não aqui.
                    </p>
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

                {/* ADDRESS SECTION */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-blue-600" />
                        Endereço da Loja
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="col-span-1 relative">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CEP</label>
                            <input 
                                type="text" 
                                value={formData.cep || ''}
                                onChange={handleCepChange}
                                placeholder="00000-000"
                                maxLength={9}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {isLoadingCep && <Loader2 className="absolute right-3 top-9 animate-spin text-blue-500" size={16} />}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Rua / Logradouro</label>
                            <input 
                                type="text" 
                                value={formData.street || ''}
                                onChange={e => setFormData({...formData, street: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Número</label>
                            <input 
                                type="text" 
                                value={formData.number || ''}
                                onChange={e => setFormData({...formData, number: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Bairro</label>
                            <input 
                                type="text" 
                                value={formData.neighborhood || ''}
                                onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cidade</label>
                            <input 
                                type="text" 
                                value={formData.city || ''}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">UF</label>
                            <input 
                                type="text" 
                                value={formData.state || ''}
                                onChange={e => setFormData({...formData, state: e.target.value})}
                                maxLength={2}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                            />
                        </div>
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

          {/* TAB: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Conta & Segurança</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie suas credenciais de acesso.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-8">
                {/* Dados de Acesso */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                        <User size={16} /> Dados de Acesso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Email de Login</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    value={ownerUser?.email || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">O email de login não pode ser alterado.</p>
                        </div>
                    </div>
                </div>

                {/* Alterar Senha */}
                <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                        <Lock size={16} /> Alterar Senha
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nova Senha</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={!newPassword || !confirmPassword || isChangingPassword}
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Atualizar Senha
                        </button>
                    </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: LANDING PAGE */}
          {activeTab === 'landing' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right">
              {/* ... (Landing Page content remains the same) ... */}
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Página Web da Loja</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure sua vitrine online para captar clientes.</p>
                </div>
                <Link to={`/shop/${formData.slug || 'loja'}`} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full sm:w-auto justify-center">
                    <ExternalLink size={16} /> Ver Página
                </Link>
              </div>
              
              <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
                
                {/* Public Link Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                                <Globe size={20} /> Seu Link Público
                            </h4>
                            <p className="text-blue-100 text-sm mb-4">
                                Compartilhe este link nas redes sociais e WhatsApp.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20 flex-1 min-w-0">
                                    <code className="text-[11px] sm:text-xs font-mono break-all text-blue-50 whitespace-normal leading-tight">
                                        {shopLink}
                                    </code>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button 
                                        type="button"
                                        onClick={handleCopyLink}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg font-bold text-xs sm:text-sm hover:bg-blue-50 transition-colors shadow-md flex-1 sm:flex-none"
                                    >
                                        <Copy size={16} /> Copiar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleShareLink}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/50 text-white rounded-lg font-bold text-xs sm:text-sm hover:bg-blue-500/70 transition-colors flex-1 sm:flex-none"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleDownloadQRCode}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors flex-1 sm:flex-none"
                                        title="Baixar QR Code para imprimir"
                                    >
                                        <Download size={16} /> <span className="hidden sm:inline">Baixar QR</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block flex-shrink-0">
                            <div className="w-24 h-24 bg-white p-2 rounded-lg">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${shopLink}`} 
                                    alt="QR Code Loja" 
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ... (Rest of Landing Page form) ... */}
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
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mensagem Padrão (WhatsApp)</label>
                        <input 
                            type="text" 
                            value={formData.landingPage.whatsappMessage || 'Olá, gostaria de agendar uma visita.'}
                            onChange={e => handleLandingChange('whatsappMessage', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: Olá, gostaria de agendar uma visita."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Esta é a mensagem que aparecerá preenchida quando o cliente clicar no botão de agendar.</p>
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

                {/* SERVICE GALLERY MANAGEMENT */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={20} className="text-blue-600" />
                            <h4 className="font-bold text-slate-900 dark:text-white">Gestão da Vitrine</h4>
                        </div>
                        <button 
                            type="button"
                            onClick={handleNewService}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={14} /> Novo Serviço
                        </button>
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Escolha quais serviços aparecem na sua página pública e personalize as fotos.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.filter(s => s.active).map(service => (
                            <div key={service.id} className="flex flex-col gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-start gap-4">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 relative group">
                                        {service.imageUrl ? (
                                            <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <ImageIcon size={24} />
                                            </div>
                                        )}
                                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Upload size={20} className="text-white" />
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => handleServiceImageUpdate(service.id, e)}
                                            />
                                        </label>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{service.name}</p>
                                            <button 
                                                type="button"
                                                onClick={() => handleEditService(service)}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{service.description}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Exibir no Site?</span>
                                    <button 
                                        type="button"
                                        onClick={() => toggleServiceVisibility(service.id, service.showOnLandingPage ?? true)}
                                        className={service.showOnLandingPage !== false ? "text-green-500" : "text-slate-400"}
                                        title={service.showOnLandingPage !== false ? "Visível na Vitrine" : "Oculto na Vitrine"}
                                    >
                                        {service.showOnLandingPage !== false ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
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

          {/* TAB: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              
              {/* --- TOKEN WALLET --- */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <MessageSquare size={24} className="text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">Carteira de Tokens</h3>
                            <p className="text-slate-400 text-sm">Créditos para automação do Robô WhatsApp</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <p className="text-sm text-slate-400 uppercase font-bold mb-1">Saldo Atual</p>
                            <p className="text-4xl font-bold text-green-400">{subscription.tokenBalance || 0} <span className="text-lg text-white">Tokens</span></p>
                        </div>
                        
                        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {tokenPackages.filter(p => p.active).map(pack => (
                                <button
                                    key={pack.id}
                                    onClick={() => handleBuyTokens(pack.tokens, pack.price)}
                                    className="flex-1 md:flex-none flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-3 transition-colors min-w-[100px]"
                                >
                                    <span className="font-bold text-lg">{pack.tokens}</span>
                                    <span className="text-xs text-slate-300">{formatCurrency(pack.price)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
              </div>

              {/* --- SUBSCRIPTION INFO --- */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {currentPlan?.name || subscription.planId}
                      </span>
                      <span className="text-green-600 dark:text-green-400 text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Ativo</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        {formatCurrency(currentPlan?.price || 0)} <span className="text-lg font-normal text-slate-500 dark:text-slate-400">/mês</span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Próxima cobrança em {new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}</p>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsPlanModalOpen(true)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Alterar Plano
                      </button>
                      <button 
                        onClick={() => {
                            // Open payment modal for current plan renewal or just management
                            setPendingTransaction({
                                type: 'plan',
                                amount: currentPlan?.price || 0,
                                description: `Renovação Plano ${currentPlan?.name}`,
                                data: { planId: subscription.planId }
                            });
                            setIsPaymentModalOpen(true);
                        }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Gerenciar Pagamento
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 min-w-[250px]">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Método de Pagamento</p>
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="text-slate-900 dark:text-white" size={24} />
                      <span className="font-medium text-slate-900 dark:text-white">{subscription.paymentMethod}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Expira em 12/2028</p>
                  </div>
                </div>
              </div>

              {/* --- TOKEN HISTORY & INVOICES --- */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <History size={20} className="text-slate-400" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Extrato de Tokens</h3>
                </div>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(subscription.tokenHistory || []).map(hist => (
                        <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs">
                            {new Date(hist.date).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900 dark:text-white text-xs">
                            {hist.description}
                          </td>
                          <td className={cn(
                            "px-6 py-3 text-right font-bold text-xs",
                            hist.type === 'credit' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          )}>
                            {hist.type === 'credit' ? '+' : '-'}{hist.amount}
                          </td>
                        </tr>
                      ))}
                      {(!subscription.tokenHistory || subscription.tokenHistory.length === 0) && (
                        <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-xs">Nenhum histórico de tokens.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                {/* ... (Preferences content remains the same) ... */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Layout size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Aparência</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Personalize como o sistema é exibido.</p>
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
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400"
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
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400"
                                    )}
                                >
                                    <Moon size={20} />
                                    <span className="font-medium">Escuro</span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Idioma & Região</label>
                            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <Globe2 size={20} className="text-slate-400" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Português (Brasil)</p>
                                    <p className="text-xs text-slate-500">GMT-3 (Brasília)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Configurar Alertas</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Defina o que é importante para você.</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleTestNotification}
                            className="text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Testar Notificação
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Categories */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Categorias de Alerta</h4>
                            
                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                                        <AlertCircle size={18} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-slate-900 dark:text-white text-sm">Estoque Crítico</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Avisar quando produtos estiverem acabando.</span>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.preferences.notifications.lowStock}
                                        onChange={e => handleNotificationChange('lowStock', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                            
                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Layout size={18} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-slate-900 dark:text-white text-sm">Atualizações de OS</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Mudanças de status e aprovações.</span>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.preferences.notifications.osUpdates}
                                        onChange={e => handleNotificationChange('osUpdates', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                        <DollarSign size={18} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-slate-900 dark:text-white text-sm">Financeiro</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Contas a pagar vencendo hoje.</span>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.preferences.notifications.financial}
                                        onChange={e => handleNotificationChange('financial', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                        <MessageCircle size={18} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-slate-900 dark:text-white text-sm">Marketing & CRM</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Lembretes de retorno e campanhas.</span>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.preferences.notifications.marketing}
                                        onChange={e => handleNotificationChange('marketing', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <div>
                                        <span className="block font-bold text-slate-900 dark:text-white text-sm">Segurança</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Logins suspeitos e alterações críticas.</span>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.preferences.notifications.security}
                                        onChange={e => handleNotificationChange('security', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        </div>

                        {/* Channels */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Canais de Recebimento</h4>
                            
                            {/* EXPLANATION TEXT */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-2 flex gap-2 items-start">
                                <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                    A seção "Canais de Recebimento" nas configurações de notificação define por onde você (o administrador/dono) deseja ser avisado quando algo importante acontece no sistema (como estoque baixo, nova OS, ou alerta de segurança).
                                </p>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Bell size={18} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notificações no Sistema</span>
                                    </div>
                                    <div className="relative inline-flex items-center">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={formData.preferences.notifications?.channels?.system ?? true}
                                            onChange={e => handleChannelChange('system', e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </label>

                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Mail size={18} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                                    </div>
                                    <div className="relative inline-flex items-center">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={formData.preferences.notifications?.channels?.email ?? true}
                                            onChange={e => handleChannelChange('email', e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </label>

                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle size={18} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp (Admin)</span>
                                    </div>
                                    <div className="relative inline-flex items-center">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={formData.preferences.notifications?.channels?.whatsapp ?? false}
                                            onChange={e => handleChannelChange('whatsapp', e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                                * Notificações via WhatsApp requerem integração ativa.
                            </p>
                        </div>
                    </div>
                </div>

                {/* MAINTENANCE ACTIONS */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <RefreshCw size={18} className="text-amber-500" />
                        Manutenção do Sistema
                    </h4>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Recalcular Métricas de Clientes</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Use isso se notar valores zerados ou inconsistentes no LTV.
                            </p>
                        </div>
                        <button 
                            type="button"
                            onClick={handleRecalculateMetrics}
                            disabled={isRecalculating}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition-colors flex items-center gap-2"
                        >
                            {isRecalculating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Recalcular Agora
                        </button>
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

          {/* TAB: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Conta & Segurança</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie suas credenciais de acesso.</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-8">
                {/* Dados de Acesso */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                        <User size={16} /> Dados de Acesso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Email de Login</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    value={ownerUser?.email || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">O email de login não pode ser alterado.</p>
                        </div>
                    </div>
                </div>

                {/* Alterar Senha */}
                <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                        <Lock size={16} /> Alterar Senha
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nova Senha</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={!newPassword || !confirmPassword || isChangingPassword}
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Atualizar Senha
                        </button>
                    </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
