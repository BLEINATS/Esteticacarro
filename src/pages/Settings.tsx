import React, { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Save, 
  Upload, CheckCircle2, Layout, MessageCircle,
  QrCode, Smartphone, Wifi, Battery, LogOut, Loader2, RefreshCw,
  Globe, ExternalLink, Image as ImageIcon,
  Instagram, Facebook, ChevronRight, Moon, Sun, Bell, Globe2,
  Mail, ShieldAlert, DollarSign, Monitor, AlertCircle, MessageSquare, History, MapPin,
  Eye, EyeOff, Edit2, Plus, Copy, Share2, Check, X, Calendar, Info, Lock, User, Download, Database, List, Camera,
  Package, Zap, FileText, Scale
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSuperAdmin } from '../context/SuperAdminContext';
import { cn, formatCurrency } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useDialog } from '../context/DialogContext';
import PaymentModal from '../components/PaymentModal';

export default function Settings() {
  const { 
    companySettings, 
    updateCompanySettings, 
    subscription, 
    connectWhatsapp, 
    disconnectWhatsapp,
    simulateWhatsappScan,
    messageLogs,
    toggleTheme,
    theme,
    buyTokens,
    changePlan,
    ownerUser,
    logoutOwner,
    updateOwner
  } = useApp();
  
  const { tokenPackages, plans, saasSettings } = useSuperAdmin();
  const { showConfirm, showAlert } = useDialog();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'integrations' | 'preferences' | 'landing' | 'account' | 'legal'>('general');
  
  const [formData, setFormData] = useState(companySettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  // WhatsApp States
  const [isConnectingWa, setIsConnectingWa] = useState(false);
  const [waView, setWaView] = useState<'status' | 'logs'>('status');

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
    
    // Aplica máscara visual 00000-000
    const maskedValue = value.replace(/^(\d{5})(\d)/, '$1-$2');
    
    setFormData(prev => ({ ...prev, cep: maskedValue }));
    if (value.length === 8) {
        fetchAddress(value);
    }
  };

  // Máscara de CNPJ: 00.000.000/0000-00
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    
    setFormData(prev => ({ ...prev, cnpj: value.substring(0, 18) }));
  };

  // Máscara de Telefone: (00) 00000-0000
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    value = value.replace(/^(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    
    setFormData(prev => ({ ...prev, phone: value.substring(0, 15) }));
  };

  // Upload de Logo
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
    await connectWhatsapp();
    setIsConnectingWa(false);
  };

  const handleSimulateScan = () => {
    setIsConnectingWa(true);
    setTimeout(() => {
        simulateWhatsappScan();
        setIsConnectingWa(false);
        showAlert({ title: 'Conectado', message: 'WhatsApp conectado com sucesso!', type: 'success' });
    }, 2000);
  };

  const handleDisconnectWhatsapp = async () => {
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

  // --- PAYMENT & PLAN HANDLERS ---
  const handleSelectPlan = (plan: any) => {
      if (plan.id === subscription.planId) return;
      setPaymentItem({ type: 'plan', item: plan });
      setIsPaymentModalOpen(true);
  };

  const handleSelectTokenPackage = (pkg: any) => {
      setPaymentItem({ type: 'token', item: pkg });
      setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
      if (paymentItem?.type === 'plan') {
          changePlan(paymentItem.item.id);
          showAlert({ title: 'Plano Atualizado', message: `Você agora é assinante do plano ${paymentItem.item.name}!`, type: 'success' });
      } else if (paymentItem?.type === 'token') {
          buyTokens(paymentItem.item.tokens, paymentItem.item.price);
          showAlert({ title: 'Tokens Adicionados', message: `${paymentItem.item.tokens} tokens foram creditados na sua conta.`, type: 'success' });
      }
      setIsPaymentModalOpen(false);
      setPaymentItem(null);
  };

  // --- ACCOUNT HANDLERS ---
  const openAccountModal = (type: 'email' | 'password' | 'profile') => {
      setAccountModalType(type);
      setAccountForm({
          name: ownerUser?.name || '',
          email: ownerUser?.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
      });
      setIsAccountModalOpen(true);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (accountModalType === 'password') {
          if (accountForm.newPassword !== accountForm.confirmPassword) {
              showAlert({ title: 'Erro', message: 'As senhas não coincidem.', type: 'error' });
              return;
          }
          if (accountForm.newPassword.length < 3) {
              showAlert({ title: 'Erro', message: 'A senha deve ter pelo menos 3 caracteres.', type: 'error' });
              return;
          }
          await updateOwner({ password: accountForm.newPassword });
          showAlert({ title: 'Sucesso', message: 'Senha atualizada com sucesso.', type: 'success' });
      } else if (accountModalType === 'email') {
          if (!accountForm.email.includes('@')) {
              showAlert({ title: 'Erro', message: 'Email inválido.', type: 'error' });
              return;
          }
          await updateOwner({ email: accountForm.email });
          showAlert({ title: 'Sucesso', message: 'Email atualizado com sucesso.', type: 'success' });
      } else if (accountModalType === 'profile') {
          await updateOwner({ name: accountForm.name });
          showAlert({ title: 'Sucesso', message: 'Perfil atualizado com sucesso.', type: 'success' });
      }
      
      setIsAccountModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 animate-in fade-in duration-500 min-w-0">
      
      {/* Payment Modal */}
      {isPaymentModalOpen && paymentItem && (
        <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            amount={paymentItem.item.price}
            description={paymentItem.type === 'plan' ? `Assinatura Plano ${paymentItem.item.name}` : `Pacote ${paymentItem.item.name} (${paymentItem.item.tokens} tokens)`}
            onSuccess={handlePaymentSuccess}
            gateway={saasSettings.paymentGateway}
        />
      )}

      {/* Account Modal */}
      {isAccountModalOpen && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {accountModalType === 'password' ? 'Redefinir Senha' : accountModalType === 'email' ? 'Alterar Email' : 'Editar Perfil'}
                      </h3>
                      <button onClick={() => setIsAccountModalOpen(false)}><X className="text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleUpdateAccount} className="space-y-4">
                      {accountModalType === 'profile' && (
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome Completo</label>
                              <input 
                                  type="text" 
                                  value={accountForm.name}
                                  onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                                  required
                              />
                          </div>
                      )}

                      {accountModalType === 'email' && (
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Novo Email</label>
                              <input 
                                  type="email" 
                                  value={accountForm.email}
                                  onChange={e => setAccountForm({...accountForm, email: e.target.value})}
                                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                                  required
                              />
                          </div>
                      )}

                      {accountModalType === 'password' && (
                          <>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nova Senha</label>
                                  <input 
                                      type="password" 
                                      value={accountForm.newPassword}
                                      onChange={e => setAccountForm({...accountForm, newPassword: e.target.value})}
                                      className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                                      required
                                      placeholder="Mínimo 3 caracteres"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirmar Senha</label>
                                  <input 
                                      type="password" 
                                      value={accountForm.confirmPassword}
                                      onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})}
                                      className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-white text-slate-900"
                                      required
                                      placeholder="Repita a senha"
                                  />
                              </div>
                          </>
                      )}

                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button"
                              onClick={() => setIsAccountModalOpen(false)}
                              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit"
                              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                          >
                              Salvar
                          </button>
                      </div>
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
        {isSaved && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-right">
                <CheckCircle2 size={18} />
                <span className="font-bold text-sm">Alterações salvas!</span>
            </div>
        )}
      </div>

      {/* TABS - RESPONSIVE & STICKY (Edge-to-Edge on Mobile) */}
      <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'general', label: 'Dados da Empresa', icon: Building2 },
              { id: 'landing', label: 'Página Web', icon: Globe },
              { id: 'integrations', label: 'WhatsApp & API', icon: QrCode },
              { id: 'billing', label: 'Assinatura & Tokens', icon: CreditCard },
              { id: 'preferences', label: 'Preferências', icon: Layout },
              { id: 'account', label: 'Conta & Segurança', icon: Lock },
              { id: 'legal', label: 'Legal & Termos', icon: Scale },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 text-xs sm:text-sm",
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                {tab.label}
              </button>
            ))}
          </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-20">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
             <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-left">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Building2 className="text-blue-600" size={20} /> Informações Básicas
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome da Loja</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Responsável</label>
                            <input 
                                type="text" 
                                value={formData.responsibleName}
                                onChange={e => setFormData({...formData, responsibleName: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CNPJ</label>
                            <input 
                                type="text" 
                                value={formData.cnpj}
                                onChange={handleCnpjChange}
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Telefone / WhatsApp</label>
                            <input 
                                type="text" 
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Email de Contato</label>
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                     </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin className="text-red-500" size={20} /> Endereço
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CEP</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.cep || ''}
                                    onChange={handleCepChange}
                                    maxLength={9}
                                    placeholder="00000-000"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                {isLoadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={16} />}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Rua</label>
                            <input 
                                type="text" 
                                value={formData.street || ''}
                                onChange={e => setFormData({...formData, street: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Número</label>
                            <input 
                                type="text" 
                                value={formData.number || ''}
                                onChange={e => setFormData({...formData, number: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Bairro</label>
                            <input 
                                type="text" 
                                value={formData.neighborhood || ''}
                                onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cidade / UF</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={formData.city || ''}
                                    onChange={e => setFormData({...formData, city: e.target.value})}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={formData.state || ''}
                                    onChange={e => setFormData({...formData, state: e.target.value})}
                                    maxLength={2}
                                    className="w-16 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                />
                            </div>
                        </div>
                     </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ImageIcon className="text-purple-600" size={20} /> Identidade Visual
                     </h3>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Logo da Empresa</label>
                        <div className="flex gap-4 items-center">
                            <div className="relative flex-1">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                        <p className="text-xs text-slate-400">PNG, JPG ou GIF</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </label>
                            </div>
                            {formData.logoUrl && (
                                <div className="w-32 h-32 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                                    <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                            )}
                        </div>
                     </div>
                 </div>

                 <div className="flex justify-end pt-4">
                    <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                        <Save size={20} /> Salvar Alterações
                    </button>
                 </div>
             </form>
          )}

          {/* LEGAL TAB */}
          {activeTab === 'legal' && (
             <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-right">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Scale className="text-blue-600" size={20} /> Documentos da Plataforma
                     </h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Acesse os termos que regem o uso do Cristal Care ERP.
                     </p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/terms" target="_blank" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group">
                            <div className="flex items-center gap-3">
                                <FileText className="text-slate-400 group-hover:text-blue-500" size={24} />
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Termos de Uso</p>
                                    <p className="text-xs text-slate-500">Regras de utilização do software</p>
                                </div>
                            </div>
                            <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" />
                        </Link>
                        
                        <Link to="/privacy" target="_blank" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors group">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="text-slate-400 group-hover:text-blue-500" size={24} />
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Política de Privacidade</p>
                                    <p className="text-xs text-slate-500">Como tratamos seus dados</p>
                                </div>
                            </div>
                            <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" />
                        </Link>
                     </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="text-purple-600" size={20} /> Documentos da Sua Loja
                     </h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Configure os termos que aparecerão na sua Página Web (Landing Page) para seus clientes.
                     </p>

                     <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Termos de Uso (Personalizado)</label>
                            <textarea 
                                value={formData.legal?.termsText || ''}
                                onChange={e => setFormData({
                                    ...formData, 
                                    legal: { ...formData.legal, termsText: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y min-h-[150px]"
                                placeholder="Insira aqui os termos de uso específicos da sua loja..."
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Política de Privacidade (Personalizada)</label>
                            <textarea 
                                value={formData.legal?.privacyText || ''}
                                onChange={e => setFormData({
                                    ...formData, 
                                    legal: { ...formData.legal, privacyText: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y min-h-[150px]"
                                placeholder="Insira aqui como você trata os dados dos seus clientes..."
                            />
                        </div>
                     </div>
                 </div>

                 <div className="flex justify-end pt-4">
                    <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                        <Save size={20} /> Salvar Documentos
                    </button>
                 </div>
             </form>
          )}

          {activeTab === 'landing' && (
             <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-right">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <Globe className="text-blue-500" size={20} /> Página Pública
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Configure como seus clientes veem sua loja online.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Publicado</span>
                            <button 
                                type="button"
                                onClick={() => setFormData({...formData, landingPage: { ...formData.landingPage, enabled: !formData.landingPage.enabled }})}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                    formData.landingPage.enabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                    formData.landingPage.enabled ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Título Principal (Hero)</label>
                            <input 
                                type="text" 
                                value={formData.landingPage.heroTitle}
                                onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, heroTitle: e.target.value }})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Subtítulo</label>
                            <textarea 
                                value={formData.landingPage.heroSubtitle}
                                onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, heroSubtitle: e.target.value }})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Imagem de Fundo (URL)</label>
                            <input 
                                type="text" 
                                value={formData.landingPage.heroImage}
                                onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, heroImage: e.target.value }})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mensagem Padrão WhatsApp</label>
                            <input 
                                type="text" 
                                value={formData.landingPage.whatsappMessage}
                                onChange={e => setFormData({...formData, landingPage: { ...formData.landingPage, whatsappMessage: e.target.value }})}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                     </div>

                     <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Link 
                            to={`/shop/${formData.slug || ''}`}
                            className="text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center gap-1 hover:underline"
                        >
                            <ExternalLink size={16} /> Visualizar Página
                        </Link>
                        <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                            <Save size={20} /> Salvar Alterações
                        </button>
                     </div>
                 </div>
             </form>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right">
                 {/* Current Plan Card */}
                 <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-6 text-white shadow-lg border border-slate-700">
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="text-slate-400 text-sm font-bold uppercase mb-1">Plano Atual</p>
                             <h3 className="text-3xl font-bold text-white mb-2 capitalize">
                                 {plans.find(p => p.id === subscription.planId)?.name || subscription.planId}
                             </h3>
                             <p className="text-sm text-slate-300">Próxima renovação: {new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-slate-400 text-sm font-bold uppercase mb-1">Status</p>
                             <span className={cn(
                                 "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                 subscription.status === 'active' ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                             )}>
                                 {subscription.status}
                             </span>
                         </div>
                     </div>
                 </div>

                 {/* Available Plans */}
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Layout className="text-blue-600" size={20} /> Mudar de Plano
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {plans.filter(p => p.active).map(plan => {
                             const isCurrent = subscription.planId === plan.id;
                             return (
                                 <div key={plan.id} className={cn(
                                     "border rounded-xl p-6 flex flex-col relative transition-all",
                                     isCurrent ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-500" : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                                 )}>
                                     {plan.highlight && (
                                         <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                             Recomendado
                                         </span>
                                     )}
                                     <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{plan.name}</h4>
                                     <p className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                         {formatCurrency(plan.price)}<span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mês</span>
                                     </p>
                                     <ul className="space-y-2 mb-6 flex-1">
                                         {plan.features.map((feat, idx) => (
                                             <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                 <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                 <span>{feat}</span>
                                             </li>
                                         ))}
                                         <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                             <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                             <span>{plan.includedTokens} Tokens/mês</span>
                                         </li>
                                     </ul>
                                     <button 
                                         onClick={() => handleSelectPlan(plan)}
                                         disabled={isCurrent}
                                         className={cn(
                                             "w-full py-2.5 rounded-lg font-bold text-sm transition-colors",
                                             isCurrent 
                                                 ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default" 
                                                 : "bg-blue-600 text-white hover:bg-blue-700"
                                         )}
                                     >
                                         {isCurrent ? 'Plano Atual' : 'Assinar Agora'}
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 </div>

                 {/* Token Wallet */}
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="text-purple-600" size={20} /> Carteira de Tokens
                         </h3>
                         <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{subscription.tokenBalance}</span>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         {tokenPackages.filter(p => p.active).map(pkg => (
                             <button 
                                key={pkg.id}
                                onClick={() => handleSelectTokenPackage(pkg)}
                                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left group"
                             >
                                 <div className="flex justify-between items-start mb-2">
                                     <Package className="text-slate-400 group-hover:text-purple-500" size={24} />
                                     <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded">
                                         {pkg.tokens} T
                                     </span>
                                 </div>
                                 <p className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">{pkg.name}</p>
                                 <p className="font-bold text-lg text-slate-900 dark:text-white mt-1">{formatCurrency(pkg.price)}</p>
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Invoices */}
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                     <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
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
                                {subscription.invoices.length > 0 ? subscription.invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(inv.amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase">
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhuma fatura encontrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                 </div>
             </div>
          )}

          {activeTab === 'preferences' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Layout className="text-blue-600" size={20} /> Aparência
                     </h3>
                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                 {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                             </div>
                             <div>
                                 <p className="font-bold text-slate-900 dark:text-white">Modo Escuro</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">Alternar entre tema claro e escuro.</p>
                             </div>
                         </div>
                         <button 
                            onClick={toggleTheme}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                theme === 'dark' ? "bg-blue-600" : "bg-slate-300"
                            )}
                        >
                            <span className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                theme === 'dark' ? "translate-x-6" : "translate-x-1"
                            )} />
                        </button>
                     </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Bell className="text-amber-500" size={20} /> Notificações
                     </h3>
                     <div className="space-y-4">
                         {[
                             { id: 'lowStock', label: 'Estoque Baixo', desc: 'Alertar quando produtos atingirem o mínimo.' },
                             { id: 'osUpdates', label: 'Atualizações de OS', desc: 'Notificar quando uma OS mudar de status.' },
                             { id: 'financial', label: 'Resumo Financeiro', desc: 'Receber relatório diário de caixa.' }
                         ].map(item => (
                             <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                 <div>
                                     <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={(formData.preferences.notifications as any)[item.id]}
                                        onChange={() => setFormData({
                                            ...formData,
                                            preferences: {
                                                ...formData.preferences,
                                                notifications: {
                                                    ...formData.preferences.notifications,
                                                    [item.id]: !(formData.preferences.notifications as any)[item.id]
                                                }
                                            }
                                        })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                 </label>
                             </div>
                         ))}
                     </div>
                     <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <button onClick={handleSave} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                            Salvar Preferências
                        </button>
                     </div>
                 </div>
             </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
                
                {/* Sub-tabs for Logs */}
                <div className="flex gap-2 mb-4">
                    <button 
                        onClick={() => setWaView('status')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                            waView === 'status' ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        Conexão
                    </button>
                    <button 
                        onClick={() => setWaView('logs')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2",
                            waView === 'logs' ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <List size={16} /> Logs de Mensagens
                    </button>
                </div>

                {waView === 'status' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <QrCode size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Integração WhatsApp</h3>
                                    <p className="text-emerald-100 text-sm">Conecte seu número para ativar o Robô.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {companySettings.whatsapp.session.status === 'connected' ? (
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 animate-in zoom-in">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp Conectado!</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                                            O sistema está pronto para enviar mensagens automáticas.
                                        </p>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm">
                                        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                            {companySettings.whatsapp.session.device?.avatarUrl ? (
                                                <img src={companySettings.whatsapp.session.device.avatarUrl} className="w-12 h-12 rounded-full" alt="Avatar" />
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center"><User size={20} /></div>
                                            )}
                                            <div className="text-left">
                                                <p className="font-bold text-slate-900 dark:text-white">{companySettings.whatsapp.session.device?.name || 'Dispositivo'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{companySettings.whatsapp.session.device?.number}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Status</span>
                                            <span className="text-green-600 font-bold">Online</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-2">
                                            <span className="text-slate-500">Bateria</span>
                                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                <Battery size={14} /> {companySettings.whatsapp.session.device?.battery}%
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleDisconnectWhatsapp}
                                        className="px-6 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut size={18} /> Desconectar
                                    </button>
                                </div>
                            ) : companySettings.whatsapp.session.status === 'scanning' ? (
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="p-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm">
                                        {companySettings.whatsapp.session.qrCode ? (
                                            <img src={companySettings.whatsapp.session.qrCode} alt="QR Code" className="w-64 h-64" />
                                        ) : (
                                            <div className="w-64 h-64 flex items-center justify-center bg-slate-100 text-slate-400">
                                                <Loader2 className="animate-spin" size={32} />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="max-w-md">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Escaneie o QR Code</h3>
                                        <ol className="text-sm text-slate-500 dark:text-slate-400 text-left list-decimal pl-5 space-y-1">
                                            <li>Abra o WhatsApp no seu celular</li>
                                            <li>Toque em <strong>Configurações</strong> ou <strong>Menu</strong></li>
                                            <li>Selecione <strong>Aparelhos Conectados</strong></li>
                                            <li>Toque em <strong>Conectar um aparelho</strong></li>
                                            <li>Aponte a câmera para esta tela</li>
                                        </ol>
                                    </div>

                                    {companySettings.whatsapp.session.pairingCode && (
                                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-1">Ou use o código de pareamento:</p>
                                            <p className="text-xl font-mono font-bold tracking-widest text-slate-900 dark:text-white">{companySettings.whatsapp.session.pairingCode}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => updateCompanySettings({ whatsapp: { ...companySettings.whatsapp, session: { status: 'disconnected' } } })}
                                            className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700"
                                        >
                                            Cancelar
                                        </button>
                                        {/* PROTOTYPE ONLY BUTTON */}
                                        <button 
                                            onClick={handleSimulateScan}
                                            disabled={isConnectingWa}
                                            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            {isConnectingWa ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />}
                                            Simular Leitura (App)
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                                        <Wifi size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">WhatsApp Desconectado</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                                        Conecte seu WhatsApp para enviar lembretes, campanhas e atualizações de OS automaticamente.
                                    </p>
                                    <button 
                                        onClick={handleConnectWhatsapp}
                                        disabled={isConnectingWa}
                                        className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 flex items-center gap-2"
                                    >
                                        {isConnectingWa ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />}
                                        Conectar Agora
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {waView === 'logs' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Histórico de Envios</h3>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                                {messageLogs.length} mensagens
                            </span>
                        </div>
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Cliente</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Mensagem</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Custo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {messageLogs.length > 0 ? messageLogs.slice().reverse().map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {new Date(log.sentAt).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white text-xs">{log.clientName}</p>
                                                <p className="text-[10px] text-slate-500">{log.clientPhone}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.content}>
                                                {log.content}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    log.status === 'read' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                    log.status === 'delivered' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                    log.status === 'sent' ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                                                    "bg-red-100 text-red-700"
                                                )}>
                                                    {log.status === 'read' ? 'Lido' : log.status === 'delivered' ? 'Entregue' : log.status === 'sent' ? 'Enviado' : 'Falha'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-mono text-slate-500">
                                                {log.costInTokens} tk
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                                                Nenhuma mensagem enviada ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
          )}

          {/* TAB: ACCOUNT */}
          {activeTab === 'account' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lock className="text-slate-600 dark:text-slate-400" size={20} /> Segurança da Conta
                     </h3>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                             <div>
                                 <p className="font-bold text-slate-900 dark:text-white">Dados Pessoais</p>
                                 <p className="text-sm text-slate-500">{ownerUser?.name}</p>
                             </div>
                             <button 
                                onClick={() => openAccountModal('profile')}
                                className="text-sm text-blue-600 font-bold hover:underline"
                             >
                                Editar
                             </button>
                         </div>
                         <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                             <div>
                                 <p className="font-bold text-slate-900 dark:text-white">Email de Acesso</p>
                                 <p className="text-sm text-slate-500">{ownerUser?.email}</p>
                             </div>
                             <button 
                                onClick={() => openAccountModal('email')}
                                className="text-sm text-blue-600 font-bold hover:underline"
                             >
                                Alterar
                             </button>
                         </div>
                         <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                             <div>
                                 <p className="font-bold text-slate-900 dark:text-white">Senha</p>
                                 <p className="text-sm text-slate-500">********</p>
                             </div>
                             <button 
                                onClick={() => openAccountModal('password')}
                                className="text-sm text-blue-600 font-bold hover:underline"
                             >
                                Redefinir
                             </button>
                         </div>
                     </div>
                     
                     <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                         <button 
                            onClick={async () => {
                                const confirm = await showConfirm({
                                    title: 'Sair do Sistema',
                                    message: 'Tem certeza que deseja fazer logout?',
                                    confirmText: 'Sair',
                                    type: 'warning'
                                });
                                if (confirm) {
                                    await logoutOwner();
                                    window.location.href = '/login';
                                }
                            }}
                            className="w-full py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2"
                         >
                             <LogOut size={18} /> Sair da Conta
                         </button>
                     </div>
                 </div>
             </div>
          )}

      </div>
    </div>
  );
}
