import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Save, Shield, CreditCard, Globe, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useDialog } from '../../context/DialogContext';

export default function SuperAdminSettings() {
  const { saasSettings, updateSaaSSettings } = useSuperAdmin();
  const { showAlert } = useDialog();
  
  const [formData, setFormData] = useState(saasSettings);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'finance' | 'security'>('general');

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

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
            { id: 'general', label: 'Geral', icon: Globe },
            { id: 'finance', label: 'Financeiro', icon: CreditCard },
            { id: 'security', label: 'Segurança', icon: Shield },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
                <tab.icon size={18} />
                {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        
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
                <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
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
                                type="password" 
                                value={formData.apiKey || ''}
                                onChange={e => setFormData({...formData, apiKey: e.target.value})}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-sm"
                                placeholder={formData.paymentGateway === 'asaas' ? '$aact_...' : 'sk_live_...'}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Chave de API de produção para processar pagamentos reais.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <Save size={18} /> Salvar Configurações
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
                                type="password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                        <CheckCircle2 size={18} /> Atualizar Senha
                    </button>
                </div>
            </form>
        )}

      </div>
    </div>
  );
}
