import React, { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Save, 
  Upload, CheckCircle2, Layout, MessageCircle,
  QrCode, Smartphone, Wifi, Battery, LogOut, Loader2, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

export default function Settings() {
  const { companySettings, updateCompanySettings, subscription, connectWhatsapp, disconnectWhatsapp } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'integrations' | 'preferences'>('general');
  
  // Form States
  const [formData, setFormData] = useState(companySettings);
  const [isSaved, setIsSaved] = useState(false);

  // --- FIX: SYNC LOCAL STATE WITH CONTEXT ---
  // Isso garante que quando o WhatsApp conectar (via timeout no Context),
  // o formData local seja atualizado e não sobrescreva o status com "disconnected" ao salvar.
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie sua empresa e assinatura.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          {[
            { id: 'general', label: 'Dados da Empresa', icon: Building2 },
            { id: 'integrations', label: 'WhatsApp (QR Code)', icon: QrCode },
            { id: 'billing', label: 'Assinatura & Faturas', icon: CreditCard },
            { id: 'preferences', label: 'Preferências', icon: Layout },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left",
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

        {/* Content Area */}
        <div className="flex-1">
          
          {/* TAB: GENERAL (COMPANY INFO) */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Identidade da Empresa</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Esses dados aparecerão nas Ordens de Serviço e Faturas.</p>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* Logo Upload Simulation */}
                <div className="flex items-center gap-6">
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800"
                  />
                  <div>
                    <button type="button" className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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
                  
                  {/* NOVO CAMPO: RESPONSÁVEL */}
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
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {isSaved ? (
                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 size={20} /> Alterações salvas!
                    </span>
                  ) : <span></span>}
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2">
                    <Save size={20} /> Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: INTEGRATIONS (WHATSAPP QR CODE) */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right">
              
              {/* Connection Status Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
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

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                  
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-in slide-in-from-bottom-4">
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
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
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
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
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
          )}

          {/* TAB: PREFERENCES */}
          {activeTab === 'preferences' && (
             <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center animate-in fade-in slide-in-from-right">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Layout size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Preferências do Sistema</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Configurações de tema, notificações e permissões de usuários estarão disponíveis aqui em breve.
                </p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
