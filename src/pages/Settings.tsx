import React, { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Save, 
  Upload, CheckCircle2, Layout, 
  QrCode, Smartphone, Wifi, Battery, LogOut, Loader2,
  Globe, Image as ImageIcon,
  Moon, Sun,
  Mail, Shield, MapPin,
  Edit2, X, Lock, User, LifeBuoy, Send, Scale, FileText, RefreshCw, ExternalLink, ShieldAlert, Eye, EyeOff, MessageSquare, BellRing, Palette
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { cn, formatCurrency } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import PaymentModal from '../components/PaymentModal';
import { DEFAULT_TERMS, DEFAULT_PRIVACY } from '../lib/legalDefaults';
import { SupportTicket } from '../types';

export default function Settings() {
  const { 
    companySettings, 
    updateCompanySettings, 
    subscription, 
    connectWhatsapp, 
    disconnectWhatsapp, 
    toggleTheme, 
    theme, 
    buyTokens, 
    changePlan, 
    ownerUser, 
    updateOwner, 
    cancelSubscription,
    createSupportTicket,
    supportTickets
  } = useApp();
  
  const { tokenPackages, plans, saasSettings } = useSuperAdmin();
  const { showConfirm, showAlert } = useDialog();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'integrations' | 'preferences' | 'landing' | 'account' | 'legal' | 'support'>('general');
  
  const [formData, setFormData] = useState(companySettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  // WhatsApp States
  const [isConnectingWa, setIsConnectingWa] = useState(false);

  // Account Modal States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalType, setAccountModalType] = useState<'email' | 'password' | 'profile'>('profile');
  const [accountForm, setAccountForm] = useState({
      name: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<{ type: 'plan' | 'token', item: any } | null>(null);

  // Support State
  const [supportForm, setSupportForm] = useState({
      type: 'help' as SupportTicket['type'],
      subject: '',
      message: '',
      priority: 'medium' as SupportTicket['priority']
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Sync formData with global settings whenever they change
  useEffect(() => {
    setFormData(companySettings);
  }, [companySettings]);

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

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

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    const maskedValue = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setFormData(prev => ({ ...prev, cep: maskedValue }));
    if (value.length === 8) {
        fetchAddress(value);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    setFormData(prev => ({ ...prev, cnpj: value.substring(0, 18) }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    setFormData(prev => ({ ...prev, phone: value.substring(0, 15) }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
            ...prev, 
            landingPage: { ...prev.landingPage, heroImage: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
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
    showAlert({ title: 'Salvo', message: 'Configurações atualizadas com sucesso.', type: 'success' });
  };

  const handleConnectWhatsapp = async () => {
    setIsConnectingWa(true);
    try {
        await connectWhatsapp(); 
    } catch (error) {
        // Error is handled in context
    } finally {
        setIsConnectingWa(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
      if (companySettings.whatsapp.session.status === 'scanning') {
          disconnectWhatsapp();
          return;
      }

      const confirm = await showConfirm({
          title: 'Desconectar WhatsApp',
          message: 'O robô parará de enviar mensagens automáticas. Tem certeza?',
          type: 'danger',
          confirmText: 'Desconectar'
      });
      if (confirm) {
          disconnectWhatsapp();
      }
  };

  // Payment & Account Handlers
  const handleSelectPlan = (plan: any) => { if (plan.id === subscription.planId) return; setPaymentItem({ type: 'plan', item: plan }); setIsPaymentModalOpen(true); };
  const handleSelectTokenPackage = (pkg: any) => { setPaymentItem({ type: 'token', item: pkg }); setIsPaymentModalOpen(true); };
  const handlePaymentSuccess = () => {
      if (paymentItem?.type === 'plan') { changePlan(paymentItem.item.id); showAlert({ title: 'Plano Atualizado', message: `Você agora é assinante do plano ${paymentItem.item.name}!`, type: 'success' }); }
      else if (paymentItem?.type === 'token') { buyTokens(paymentItem.item.tokens, paymentItem.item.price); showAlert({ title: 'Tokens Adicionados', message: `${paymentItem.item.tokens} tokens creditados.`, type: 'success' }); }
      setIsPaymentModalOpen(false); setPaymentItem(null);
  };
  const handleCancelSubscription = async () => {
      if (await showConfirm({ title: 'Cancelar Assinatura', message: 'Tem certeza? Você perderá acesso aos recursos premium.', type: 'danger', confirmText: 'Sim, Cancelar' })) {
          await cancelSubscription(); showAlert({ title: 'Cancelada', message: 'Assinatura cancelada.', type: 'info' });
      }
  };
  const openAccountModal = (type: any) => { setAccountModalType(type); setAccountForm({ name: ownerUser?.name || '', email: ownerUser?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' }); setIsAccountModalOpen(true); };
  const handleUpdateAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      if (accountModalType === 'password') {
          if (accountForm.newPassword !== accountForm.confirmPassword) return showAlert({ title: 'Erro', message: 'Senhas não conferem.', type: 'error' });
          await updateOwner({ password: accountForm.newPassword });
      } else if (accountModalType === 'email') {
          await updateOwner({ email: accountForm.email });
      } else { await updateOwner({ name: accountForm.name }); }
      setIsAccountModalOpen(false); showAlert({ title: 'Sucesso', message: 'Dados atualizados.', type: 'success' });
  };
  const handleLoadDefaultTerms = () => setFormData(prev => ({ ...prev, legal: { ...prev.legal, termsText: DEFAULT_TERMS } }));
  const handleLoadDefaultPrivacy = () => setFormData(prev => ({ ...prev, legal: { ...prev.legal, privacyText: DEFAULT_PRIVACY } }));
  const handleSubmitTicket = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supportForm.subject || !supportForm.message) return showAlert({ title: 'Erro', message: 'Preencha os campos.', type: 'warning' });
      setIsSubmittingTicket(true);
      const success = await createSupportTicket(supportForm);
      setIsSubmittingTicket(false);
      if (success) { showAlert({ title: 'Enviado', message: 'Ticket enviado.', type: 'success' }); setSupportForm({ type: 'help', subject: '', message: '', priority: 'medium' }); }
      else showAlert({ title: 'Erro', message: 'Falha ao enviar.', type: 'error' });
  };

  const getStatusLabel = () => {
      const status = companySettings.whatsapp.session.status;
      if (status === 'connected') return 'Conectado';
      if (status === 'scanning') return 'Aguardando Leitura';
      return 'Desconectado';
  };

  const toggleNotification = (key: keyof typeof formData.preferences.notifications) => {
      setFormData(prev => ({
          ...prev,
          preferences: {
              ...prev.preferences,
              notifications: {
                  ...prev.preferences.notifications,
                  [key]: !prev.preferences.notifications[key]
              }
          }
      }));
  };

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 animate-in fade-in duration-500 min-w-0">
      
      {/* Modals */}
      {isPaymentModalOpen && paymentItem && (
        <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} amount={paymentItem.item.price} description={paymentItem.type === 'plan' ? `Assinatura ${paymentItem.item.name}` : `Pacote ${paymentItem.item.name}`} onSuccess={handlePaymentSuccess} gateway={saasSettings.paymentGateway} />
      )}
      {isAccountModalOpen && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{accountModalType === 'password' ? 'Redefinir Senha' : accountModalType === 'email' ? 'Alterar Email' : 'Editar Perfil'}</h3>
                      <button onClick={() => setIsAccountModalOpen(false)}><X className="text-slate-400" /></button>
                  </div>
                  <form onSubmit={handleUpdateAccount} className="space-y-4">
                      {accountModalType === 'profile' && <input type="text" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white" required placeholder="Nome" />}
                      {accountModalType === 'email' && <input type="email" value={accountForm.email} onChange={e => setAccountForm({...accountForm, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white" required placeholder="Email" />}
                      {accountModalType === 'password' && <><input type="password" value={accountForm.newPassword} onChange={e => setAccountForm({...accountForm, newPassword: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white" required placeholder="Nova Senha" /><input type="password" value={accountForm.confirmPassword} onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white" required placeholder="Confirmar Senha" /></>}
                      <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancelar</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Salvar</button></div>
                  </form>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie sua empresa e assinatura.</p>
        </div>
        {isSaved && <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-right"><CheckCircle2 size={18} /><span className="font-bold text-sm">Salvo!</span></div>}
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'general', label: 'Dados da Empresa', icon: Building2 },
              { id: 'landing', label: 'Página Web', icon: Globe },
              { id: 'integrations', label: 'Integrações', icon: QrCode },
              { id: 'billing', label: 'Assinatura', icon: CreditCard },
              { id: 'preferences', label: 'Preferências', icon: Layout },
              { id: 'account', label: 'Conta', icon: Lock },
              { id: 'legal', label: 'Legal', icon: Scale },
              { id: 'support', label: 'Suporte', icon: LifeBuoy },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 text-xs sm:text-sm", activeTab === tab.id ? "bg-blue-600 text-white shadow-md" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-20">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
             <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-left">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Building2 className="text-blue-600" size={20} /> Informações Básicas</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome da Loja</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Responsável</label><input type="text" value={formData.responsibleName} onChange={e => setFormData({...formData, responsibleName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CNPJ</label><input type="text" value={formData.cnpj} onChange={handleCnpjChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Telefone</label><input type="text" value={formData.phone} onChange={handlePhoneChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div>
                     </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MapPin className="text-red-500" size={20} /> Endereço</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CEP</label><div className="relative"><input type="text" value={formData.cep || ''} onChange={handleCepChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" />{isLoadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={16} />}</div></div>
                        <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Rua</label><input type="text" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Número</label><input type="text" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Bairro</label><input type="text" value={formData.neighborhood || ''} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cidade / UF</label><div className="flex gap-2"><input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /><input type="text" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-16 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" /></div></div>
                     </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><ImageIcon className="text-purple-600" size={20} /> Identidade Visual</h3>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Logo</label>
                        <div className="flex gap-4 items-center">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6"><Upload className="w-8 h-8 text-slate-400 mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">Clique para enviar</p></div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                            {formData.logoUrl && <div className="w-32 h-32 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800"><img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" /></div>}
                        </div>
                     </div>
                 </div>
                 <div className="flex justify-end pt-4"><button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Save size={20} /> Salvar</button></div>
             </form>
          )}

          {/* LANDING PAGE TAB (NEW) */}
          {activeTab === 'landing' && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-right">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                              <Globe className="text-blue-500" size={20} /> Página Pública
                          </h3>
                          <a href={`/shop/${formData.slug || ''}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                              Ver Página <ExternalLink size={14} />
                          </a>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Título Principal (Hero)</label>
                              <input 
                                  type="text" 
                                  value={formData.landingPage?.heroTitle || ''} 
                                  onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, heroTitle: e.target.value }})} 
                                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                  placeholder="Ex: Estética Automotiva Premium"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Subtítulo</label>
                              <textarea 
                                  value={formData.landingPage?.heroSubtitle || ''} 
                                  onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, heroSubtitle: e.target.value }})} 
                                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none"
                                  rows={2}
                                  placeholder="Ex: Cuidado e proteção para seu veículo."
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mensagem Padrão do WhatsApp</label>
                              <input 
                                  type="text" 
                                  value={formData.landingPage?.whatsappMessage || ''} 
                                  onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, whatsappMessage: e.target.value }})} 
                                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                  placeholder="Ex: Olá, gostaria de agendar um serviço."
                              />
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Imagem de Fundo (Hero)</label>
                              <div className="flex gap-4 items-center">
                                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                          <p className="text-sm text-slate-500 dark:text-slate-400">Clique para alterar imagem</p>
                                      </div>
                                      <input type="file" className="hidden" accept="image/*" onChange={handleHeroImageUpload} />
                                  </label>
                                  {formData.landingPage?.heroImage && (
                                      <div className="w-48 h-32 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 relative group">
                                          <img src={formData.landingPage.heroImage} alt="Hero" className="w-full h-full object-cover" />
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar Serviços</span>
                                  <input 
                                      type="checkbox" 
                                      checked={formData.landingPage?.showServices ?? true}
                                      onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, showServices: e.target.checked }})}
                                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                  />
                              </div>
                              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mostrar Avaliações</span>
                                  <input 
                                      type="checkbox" 
                                      checked={formData.landingPage?.showTestimonials ?? true}
                                      onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, showTestimonials: e.target.checked }})}
                                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                          <Save size={20} /> Salvar Página
                      </button>
                  </div>
              </form>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Smartphone className="text-green-600" size={20} /> Sessão do WhatsApp
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className={cn("p-4 rounded-xl border-2 flex items-center gap-4", 
                                companySettings.whatsapp.session.status === 'connected' ? "border-green-500 bg-green-50 dark:bg-green-900/20" : 
                                companySettings.whatsapp.session.status === 'scanning' ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" :
                                "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            )}>
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", 
                                    companySettings.whatsapp.session.status === 'connected' ? "bg-green-500 text-white" : 
                                    companySettings.whatsapp.session.status === 'scanning' ? "bg-amber-500 text-white" :
                                    "bg-slate-300 dark:bg-slate-600 text-slate-500"
                                )}>
                                    {companySettings.whatsapp.session.status === 'connected' ? <CheckCircle2 size={24} /> : 
                                     companySettings.whatsapp.session.status === 'scanning' ? <Loader2 size={24} className="animate-spin" /> :
                                     <Wifi size={24} />}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{getStatusLabel()}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {companySettings.whatsapp.session.status === 'connected' 
                                            ? `Dispositivo: ${companySettings.whatsapp.session.device?.name || 'WhatsApp Web'}` 
                                            : companySettings.whatsapp.session.status === 'scanning'
                                            ? 'Escaneie o QR Code ao lado.'
                                            : 'Nenhuma sessão ativa.'}
                                    </p>
                                </div>
                            </div>

                            {companySettings.whatsapp.session.status === 'connected' ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2"><Battery size={16} /> Bateria</span>
                                        <span className="font-bold text-green-600">{companySettings.whatsapp.session.device?.battery || 100}%</span>
                                    </div>
                                    <button onClick={handleDisconnectWhatsapp} className="w-full py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"><LogOut size={18} /> Desconectar Sessão</button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={handleConnectWhatsapp} 
                                        disabled={isConnectingWa || companySettings.whatsapp.session.status === 'scanning'} 
                                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isConnectingWa ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />}
                                        {isConnectingWa ? 'Gerando Código...' : 'Conectar WhatsApp'}
                                    </button>
                                    
                                    {companySettings.whatsapp.session.status === 'scanning' && (
                                        <button 
                                            onClick={handleDisconnectWhatsapp} 
                                            className="w-full py-2 text-slate-500 hover:text-red-500 text-sm font-bold transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* QR Code / Pairing Display */}
                        <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 min-h-[250px] p-4">
                            {companySettings.whatsapp.session.status === 'scanning' ? (
                                <div className="text-center space-y-4 animate-in fade-in zoom-in w-full">
                                    <p className="font-bold text-slate-900 dark:text-white">Escaneie com seu celular</p>
                                    
                                    {companySettings.whatsapp.session.qrCode ? (
                                        <div className="bg-white p-2 rounded-lg inline-block shadow-sm">
                                            <img src={companySettings.whatsapp.session.qrCode} alt="QR Code" className="w-48 h-48" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 w-48 mx-auto bg-slate-200 dark:bg-slate-800 rounded-lg">
                                            <Loader2 className="animate-spin text-slate-400 mb-2" size={32} />
                                            <p className="text-xs text-slate-500">Aguardando QR Code...</p>
                                        </div>
                                    )}
                                    
                                    {companySettings.whatsapp.session.pairingCode && (
                                        <div className="mt-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Código de Pareamento</p>
                                            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">{companySettings.whatsapp.session.pairingCode}</p>
                                            <p className="text-xs text-slate-400 mt-1">Use este código se não conseguir escanear</p>
                                        </div>
                                    )}
                                </div>
                            ) : companySettings.whatsapp.session.status === 'connected' ? (
                                <div className="text-center text-green-600 dark:text-green-400">
                                    <CheckCircle2 size={64} className="mx-auto mb-2" />
                                    <p className="font-bold">Tudo pronto!</p>
                                    <p className="text-xs opacity-80">O robô está operando normalmente.</p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Smartphone size={48} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Aguardando conexão...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right">
                 <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-6 text-white shadow-lg border border-slate-700">
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="text-slate-400 text-sm font-bold uppercase mb-1">Plano Atual</p>
                             <h3 className="text-3xl font-bold text-white mb-2 capitalize">{plans.find(p => p.id === subscription.planId)?.name || subscription.planId}</h3>
                             <p className="text-sm text-slate-300">Próxima renovação: {new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-slate-400 text-sm font-bold uppercase mb-1">Status</p>
                             <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", subscription.status === 'active' ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-amber-500/20 text-amber-400 border border-amber-500/50")}>{subscription.status}</span>
                         </div>
                     </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Layout className="text-blue-600" size={20} /> Mudar de Plano</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {plans.filter(p => p.active).map(plan => {
                             const isCurrent = subscription.planId === plan.id;
                             return (
                                 <div key={plan.id} className={cn("border rounded-xl p-6 flex flex-col relative transition-all", isCurrent ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-slate-200 dark:border-slate-700 hover:border-blue-300")}>
                                     {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Recomendado</span>}
                                     <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{plan.name}</h4>
                                     <p className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{formatCurrency(plan.price)}<span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mês</span></p>
                                     <ul className="space-y-2 mb-6 flex-1">{plan.features.map((feat, idx) => (<li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /><span>{feat}</span></li>))}</ul>
                                     <button onClick={() => handleSelectPlan(plan)} disabled={isCurrent} className={cn("w-full py-2.5 rounded-lg font-bold text-sm transition-colors", isCurrent ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default" : "bg-blue-600 text-white hover:bg-blue-700")}>{isCurrent ? 'Plano Atual' : 'Assinar Agora'}</button>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><MessageSquare className="text-purple-600" size={20} /> Carteira de Tokens</h3><span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{subscription.tokenBalance}</span></div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         {tokenPackages.filter(p => p.active).map(pkg => (
                             <button key={pkg.id} onClick={() => handleSelectTokenPackage(pkg)} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left group">
                                 <div className="flex justify-between items-start mb-2"><Layout className="text-slate-400 group-hover:text-purple-500" size={24} /><span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded">{pkg.tokens} T</span></div>
                                 <p className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">{pkg.name}</p>
                                 <p className="font-bold text-lg text-slate-900 dark:text-white mt-1">{formatCurrency(pkg.price)}</p>
                             </button>
                         ))}
                     </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2"><LogOut size={16} /> Zona de Perigo</h4>
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div><p className="text-sm font-medium text-slate-700 dark:text-slate-300">Cancelar Assinatura</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ao cancelar, você perderá acesso aos recursos premium imediatamente.</p></div>
                        <button onClick={handleCancelSubscription} className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap">Cancelar Assinatura</button>
                    </div>
                 </div>
             </div>
          )}

          {/* PREFERENCES TAB - EXPANDED */}
          {activeTab === 'preferences' && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-right">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Palette className="text-blue-600" size={20} /> Aparência</h3>
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div><p className="font-bold text-slate-900 dark:text-white">Tema do Sistema</p><p className="text-xs text-slate-500 dark:text-slate-400">Alternar entre modo claro e escuro.</p></div>
                          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              <button type="button" onClick={() => theme === 'dark' && toggleTheme()} className={cn("p-2 rounded-md transition-colors", theme === 'light' ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600")}><Sun size={20} /></button>
                              <button type="button" onClick={() => theme === 'light' && toggleTheme()} className={cn("p-2 rounded-md transition-colors", theme === 'dark' ? "bg-blue-900/30 text-blue-400" : "text-slate-400 hover:text-slate-600")}><Moon size={20} /></button>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><BellRing className="text-purple-600" size={20} /> Notificações</h3>
                      <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div><p className="font-bold text-sm text-slate-900 dark:text-white">Estoque Baixo</p><p className="text-xs text-slate-500">Alertar quando produtos atingirem o mínimo.</p></div>
                              <input type="checkbox" checked={formData.preferences.notifications.lowStock} onChange={() => toggleNotification('lowStock')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div><p className="font-bold text-sm text-slate-900 dark:text-white">Atualizações de OS</p><p className="text-xs text-slate-500">Notificar mudanças de status de serviço.</p></div>
                              <input type="checkbox" checked={formData.preferences.notifications.osUpdates} onChange={() => toggleNotification('osUpdates')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div><p className="font-bold text-sm text-slate-900 dark:text-white">Alertas Financeiros</p><p className="text-xs text-slate-500">Avisos sobre metas e variações de receita.</p></div>
                              <input type="checkbox" checked={formData.preferences.notifications.financial} onChange={() => toggleNotification('financial')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end pt-4"><button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Save size={20} /> Salvar Preferências</button></div>
              </form>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2"><User className="text-blue-600" size={20} /> Perfil do Administrador</h3>
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl font-bold text-slate-400 dark:text-slate-500">{ownerUser?.name?.charAt(0) || 'A'}</div>
                          <div className="flex-1 w-full space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Nome</p><p className="font-medium text-slate-900 dark:text-white">{ownerUser?.name}</p></div>
                                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Email</p><p className="font-medium text-slate-900 dark:text-white">{ownerUser?.email}</p></div>
                              </div>
                              <div className="flex flex-wrap gap-3 pt-2">
                                  <button onClick={() => openAccountModal('profile')} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"><Edit2 size={16} /> Editar Perfil</button>
                                  <button onClick={() => openAccountModal('email')} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"><Mail size={16} /> Alterar Email</button>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Shield className="text-green-600" size={20} /> Segurança</h3>
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div><p className="font-bold text-slate-900 dark:text-white text-sm">Senha de Acesso</p><p className="text-xs text-slate-500">Recomendamos alterar periodicamente.</p></div>
                              <button onClick={() => openAccountModal('password')} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Alterar Senha</button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* LEGAL TAB */}
          {activeTab === 'legal' && (
             <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-right">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Scale className="text-blue-600" size={20} /> Documentos da Plataforma</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/terms" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group"><div className="flex items-center gap-3"><FileText className="text-slate-400 group-hover:text-blue-500" size={24} /><div><p className="font-bold text-slate-900 dark:text-white">Termos de Uso</p><p className="text-xs text-slate-500">Regras de utilização</p></div></div><ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" /></Link>
                        <Link to="/privacy" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group"><div className="flex items-center gap-3"><ShieldAlert className="text-slate-400 group-hover:text-blue-500" size={24} /><div><p className="font-bold text-slate-900 dark:text-white">Política de Privacidade</p><p className="text-xs text-slate-500">Tratamento de dados</p></div></div><ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" /></Link>
                     </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><FileText className="text-purple-600" size={20} /> Documentos da Sua Loja</h3>
                     <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-1.5"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Termos de Uso (Personalizado)</label><button type="button" onClick={handleLoadDefaultTerms} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"><RefreshCw size={12} /> Usar Modelo Padrão</button></div>
                            <textarea value={formData.legal?.termsText || ''} onChange={e => setFormData({ ...formData, legal: { ...formData.legal, termsText: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y min-h-[150px]" placeholder="Insira aqui os termos de uso..." />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Política de Privacidade (Personalizada)</label><button type="button" onClick={handleLoadDefaultPrivacy} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"><RefreshCw size={12} /> Usar Modelo Padrão</button></div>
                            <textarea value={formData.legal?.privacyText || ''} onChange={e => setFormData({ ...formData, legal: { ...formData.legal, privacyText: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y min-h-[150px]" placeholder="Insira aqui sua política..." />
                        </div>
                     </div>
                 </div>
                 <div className="flex justify-end pt-4"><button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Save size={20} /> Salvar Documentos</button></div>
             </form>
          )}

          {/* TAB: SUPPORT */}
          {activeTab === 'support' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><LifeBuoy className="text-blue-600" size={20} /> Suporte & Ajuda</h3>
                      <form onSubmit={handleSubmitTicket} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Tipo</label><select value={supportForm.type} onChange={e => setSupportForm({...supportForm, type: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"><option value="help">Dúvida / Ajuda</option><option value="bug">Reportar Bug</option><option value="feature">Sugestão</option><option value="other">Outro</option></select></div>
                              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Prioridade</label><select value={supportForm.priority} onChange={e => setSupportForm({...supportForm, priority: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div>
                          </div>
                          <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Assunto</label><input type="text" value={supportForm.subject} onChange={e => setSupportForm({...supportForm, subject: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white" required /></div>
                          <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mensagem</label><textarea value={supportForm.message} onChange={e => setSupportForm({...supportForm, message: e.target.value})} rows={5} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none" required /></div>
                          <div className="flex justify-end pt-2"><button type="submit" disabled={isSubmittingTicket} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">{isSubmittingTicket ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} Enviar Solicitação</button></div>
                      </form>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800"><h3 className="font-bold text-lg text-slate-900 dark:text-white">Histórico de Chamados</h3></div>
                      {supportTickets.length > 0 ? (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {supportTickets.map(ticket => (
                                  <div key={ticket.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                      <div className="flex justify-between items-start mb-2">
                                          <div><span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1", ticket.status === 'open' ? "bg-blue-100 text-blue-700" : ticket.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700")}>{ticket.status}</span><h4 className="font-bold text-slate-900 dark:text-white text-sm">{ticket.subject}</h4></div>
                                          <span className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">{ticket.message}</p>
                                      {ticket.adminResponse && <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30"><p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1"><Shield size={12} /> Resposta do Suporte:</p><p className="text-xs text-slate-700 dark:text-slate-300">{ticket.adminResponse}</p></div>}
                                  </div>
                              ))}
                          </div>
                      ) : <div className="p-8 text-center text-slate-400"><p className="text-sm">Nenhum chamado registrado.</p></div>}
                  </div>
              </div>
          )}

      </div>
    </div>
  );
}
