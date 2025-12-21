import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Save, Shield, CreditCard, Globe, Mail, Lock, CheckCircle2, MessageSquare, Smartphone, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';
import { cn } from '../../lib/utils';

export default function SuperAdminSettings() {
  const { saasSettings, updateSaaSSettings } = useSuperAdmin();
  const { showAlert } = useDialog();
  
  const [formData, setFormData] = useState(saasSettings);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'security' | 'integrations'>('general');

  // Password Visibility States
  const [showApiKey, setShowApiKey] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setFormData(saasSettings);
  }, [saasSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSaaSSettings(formData);
    showAlert({ title: 'Sucesso', message: 'Configurações salvas com sucesso.', type: 'success' });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        showAlert({ title: 'Erro', message: 'As senhas não coincidem.', type: 'error' });
        return;
    }
    if (newPassword.length < 6) {
        showAlert({ title: 'Erro', message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
        return;
    }
    
    updateSaaSSettings({ ...formData, adminPassword: newPassword });
    setNewPassword('');
    setConfirmPassword('');
    showAlert({ title: 'Sucesso', message: 'Senha de administrador atualizada.', type: 'success' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações do SaaS</h1>
        <p className="text-slate-500 dark:text-slate-400">Gerencie os dados globais da sua plataforma.</p>
      </div>

      {/* TABS - RESPONSIVE & STICKY (Edge-to-Edge on Mobile) */}
      <div className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
                { id: 'general', label: 'Geral', icon: Globe },
                { id: 'finance', label: 'Financeiro', icon: CreditCard },
                { id: 'integrations', label: 'Integrações', icon: MessageSquare },
                { id: 'security', label: 'Segurança', icon: Shield },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 text-sm",
                        activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                >
                    <tab.icon size={18} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
        
        {activeTab === 'general' && (
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome da Plataforma</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                value={formData.platformName}
                                onChange={e => setFormData({...formData, platformName: e.target.value})}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email de Suporte</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                value={formData.supportEmail}
                                onChange={e => setFormData({...formData, supportEmail: e.target.value})}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </form>
        )}

        {activeTab === 'finance' && (
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gateway de Pagamento</label>
                        <select 
                            value={formData.paymentGateway}
                            onChange={e => setFormData({...formData, paymentGateway: e.target.value as any})}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        >
                            <option value="asaas">Asaas</option>
                            <option value="stripe">Stripe</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Chave Pix (Recebimento)</label>
                        <input 
                            type="text" 
                            value={formData.pixKey}
                            onChange={e => setFormData({...formData, pixKey: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            API Key ({formData.paymentGateway === 'asaas' ? 'Asaas' : 'Stripe'})
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input 
                                type={showApiKey ? "text" : "password"} 
                                value={formData.apiKey || ''}
                                onChange={e => setFormData({...formData, apiKey: e.target.value})}
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                                placeholder={formData.paymentGateway === 'asaas' ? '$aact_...' : 'sk_live_...'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Chave de API de produção para processar pagamentos reais.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar Configurações
                    </button>
                </div>
            </form>
        )}

        {activeTab === 'integrations' && (
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg mb-4 flex items-start gap-3">
                    <Smartphone className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-300">WhatsApp API (w-api.app)</h3>
                        <p className="text-sm text-emerald-800 dark:text-emerald-400 mt-1">
                            Configure a infraestrutura global de mensagens. As lojas usarão esta conexão para criar suas instâncias.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Status da Integração</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Ativar ou desativar o serviço globalmente.</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setFormData({
                                ...formData, 
                                whatsappGlobal: { ...formData.whatsappGlobal!, enabled: !formData.whatsappGlobal?.enabled }
                            })}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                                formData.whatsappGlobal?.enabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                            )}
                        >
                            <span className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                formData.whatsappGlobal?.enabled ? "translate-x-6" : "translate-x-1"
                            )} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">URL da API (Base URL)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={formData.whatsappGlobal?.baseUrl || ''}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        whatsappGlobal: { ...formData.whatsappGlobal!, baseUrl: e.target.value }
                                    })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                                    placeholder="https://w-api.app/api"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Token Global / API Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type={showApiKey ? "text" : "password"} 
                                    value={formData.whatsappGlobal?.apiKey || ''}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        whatsappGlobal: { ...formData.whatsappGlobal!, apiKey: e.target.value }
                                    })}
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                                    placeholder="Token de autenticação do w-api.app"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Webhook URL (Callback)</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={formData.whatsappGlobal?.webhookUrl || ''}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        whatsappGlobal: { ...formData.whatsappGlobal!, webhookUrl: e.target.value }
                                    })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                                    placeholder="https://api.seusistema.com/webhook/whatsapp"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">URL para receber eventos de mensagens e status.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar Integração
                    </button>
                </div>
            </form>
        )}

        {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6 animate-in fade-in">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Atenção:</strong> Esta é a senha mestra de acesso ao painel Super Admin. Mantenha-a segura.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nova Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type={showNewPassword ? "text" : "password"} 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Atualizar Senha
                    </button>
                </div>
            </form>
        )}

      </div>
    </div>
  );
}
