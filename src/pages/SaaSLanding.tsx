import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Rocket, PlayCircle, Lock, TrendingUp, Calendar, 
  BrainCircuit, AlertTriangle, Lightbulb, BarChart3, Users, 
  Car, UserMinus, Package, CalendarX, BellRing, TrendingDown, 
  Star, StarHalf, Facebook, Instagram, Mail, Bot, Menu, X,
  CheckCircle2, ArrowRight, ShieldCheck, Zap, DollarSign, Send, MessageSquare, DollarSign as DollarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DottedSurface } from '../components/ui/dotted-surface';
import dashboardImg from '../assets/dashboard-main.png';
import { useSuperAdmin } from '../context/SuperAdminContext';

export default function SaaSLanding() {
  const navigate = useNavigate();
  const { saasSettings } = useSuperAdmin();
  const platformName = saasSettings?.platformName || 'Cristal Care ERP';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Bot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'bot', text: `Olá! 👋 Sou a IA do ${platformName}. Quer saber como nosso CRM aumenta o faturamento da sua estética em até 30%?` }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    
    const userText = chatInput;
    const userMsg = { id: Date.now(), role: 'user', text: userText };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Advanced Sales AI Logic
    setTimeout(() => {
      let reply = `O ${platformName} é um sistema completo de gestão e fidelização. Posso explicar sobre o CRM, Financeiro, Marketing ou Operações. O que prefere?`;
      const lower = userText.toLowerCase();

      // 1. Greetings
      if (lower.includes('oi') || lower.includes('ola') || lower.includes('olá') || lower.includes('bom dia') || lower.includes('boa tarde')) {
        reply = `Olá! Tudo bem? Estou aqui para mostrar como o ${platformName} pode transformar sua estética automotiva. Tem alguma dúvida específica sobre o sistema?`;
      } 
      // 2. Pricing
      else if (lower.includes('preço') || lower.includes('valor') || lower.includes('quanto') || lower.includes('plano')) {
        reply = "Nossos planos começam em apenas R$ 62,00/mês no plano Básico. O plano mais popular (Intermediário) sai por R$ 107,00 e inclui WhatsApp, CRM e Financeiro completo! 🚀";
      } 
      // 3. WhatsApp Integration
      else if (lower.includes('whatsapp') || lower.includes('zap')) {
        reply = "Sim! Temos integração oficial. O sistema envia lembretes de agendamento, status do serviço e mensagens de pós-venda automaticamente para você não perder tempo.";
      } 
      // 4. Test/Free
      else if (lower.includes('teste') || lower.includes('gratis') || lower.includes('grátis')) {
        reply = "Ótima escolha! Você pode testar todas as funcionalidades agora mesmo sem compromisso. Clique em 'Começar Agora' no topo da página.";
      }
      // 5. CRM & Data (NEW)
      else if (lower.includes('crm') || lower.includes('dados') || lower.includes('ltv') || lower.includes('churn') || lower.includes('histórico')) {
        reply = "Nosso CRM gerencia a base completa! Ele calcula automaticamente o LTV (valor total gasto pelo cliente) e identifica o 'Risco de Churn' (clientes inativos há +60 dias) para você agir rápido.";
      }
      // 6. Segmentation (NEW)
      else if (lower.includes('segment') || lower.includes('vip') || lower.includes('perfil') || lower.includes('tipo de cliente')) {
        reply = "O sistema classifica seus clientes automaticamente em: VIPs (prioridade máxima), Recorrentes (estabilidade), Novos e Em Risco. Isso ajuda a focar seu marketing em quem dá mais lucro.";
      }
      // 7. Marketing & Campaigns (NEW)
      else if (lower.includes('marketing') || lower.includes('campanha') || lower.includes('social') || lower.includes('post') || lower.includes('divulga')) {
        reply = "Você pode disparar mensagens em massa via WhatsApp para grupos específicos (ex: recuperar inativos) e medir o ROI. Além disso, o Social Studio AI cria posts de 'Antes e Depois' com legendas automáticas!";
      }
      // 8. Automation & Rules (NEW)
      else if (lower.includes('automacao') || lower.includes('automação') || lower.includes('lembrete') || lower.includes('nps') || lower.includes('recall')) {
        reply = "Automatizamos a régua de relacionamento: Lembrete 24h antes, aviso de conclusão com link de pagamento, pesquisa NPS pós-serviço e até Recall de Manutenção (ex: renovar vitrificação após 6 meses).";
      }
      // 9. Operations & Tracking (NEW)
      else if (lower.includes('operac') || lower.includes('acompanha') || lower.includes('vistoria') || lower.includes('assinatura') || lower.includes('transparência')) {
        reply = "Para a operação, temos o Diário de Bordo: envie um link onde o cliente vê fotos do serviço em tempo real! Também temos vistoria digital com mapa de avarias e assinatura na tela.";
      }
      // 10. General "How it works"
      else if (lower.includes('funciona') || lower.includes('como') || lower.includes('sistema')) {
        reply = `O ${platformName} é 100% online e funciona como um motor de vendas e retenção. Você controla agendamentos, comissões, estoque e fideliza clientes automaticamente.`;
      }
      
      setChatMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="antialiased bg-background-base text-gray-200 font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden min-h-screen relative">
      
      {/* Background Effects */}
      <DottedSurface className="opacity-40" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${scrolled ? 'bg-background-base/90 shadow-lg' : 'bg-background-base/70'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                <Sparkles size={20} />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">{platformName}</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">Funcionalidades</a>
              <a href="#dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">Dashboard</a>
              <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">Preços</a>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition">Entrar</button>
              <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition backdrop-blur-sm">
                Começar Agora
              </button>
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden text-white p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background-card border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">Funcionalidades</a>
                <a href="#dashboard" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">Dashboard</a>
                <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">Preços</a>
                <hr className="border-white/10 my-2" />
                <button onClick={() => navigate('/login')} className="text-base font-bold text-white text-left">Entrar</button>
                <button onClick={() => navigate('/login')} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-center">
                  Começar Agora
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 shadow-2xl backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Nova Versão 2.0</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
          >
            Gestão Inteligente para <br/>
            <span className="text-gradient">Estética Automotiva</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-xl text-gray-400"
          >
            Aumente seu ticket médio, recupere clientes inativos e gerencie sua operação com a inteligência de dados que seu negócio merece.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex justify-center gap-4 flex-col sm:flex-row"
          >
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold text-lg transition shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 hover:-translate-y-1 transform duration-200"
            >
              <Rocket size={20} />
              Testar Gratuitamente
            </button>
            <a href="#dashboard" className="px-8 py-4 rounded-xl glass-panel hover:bg-white/10 text-white font-semibold text-lg transition flex items-center justify-center gap-2 hover:-translate-y-1 transform duration-200">
              <PlayCircle size={20} />
              Ver Demonstração
            </a>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            id="dashboard"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-24 relative mx-auto w-full max-w-6xl"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0B1121]">
              
              {/* Browser Bar */}
              <div className="h-12 bg-[#161E32] border-b border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="ml-4 px-4 py-1.5 rounded-md bg-[#020617] border border-white/5 text-xs text-gray-500 w-full max-w-sm flex items-center justify-center font-mono">
                  <Lock size={10} className="mr-2" /> {platformName.toLowerCase().replace(/\s+/g, '')}.com/dashboard
                </div>
              </div>

              {/* Dashboard Content Mock (Image) */}
              <div className="relative bg-[#0B1121] min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
                 <img 
                    src={dashboardImg} 
                    alt="Dashboard Preview" 
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                 />
                 {/* Fallback Content if image fails or while loading */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                    <div className="text-center">
                        <BarChart3 size={64} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-600 font-medium">Visualização do Sistema</p>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-wide uppercase text-xs mb-3">Por que {platformName}?</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Controle total da sua estética, <br/><span className="text-gray-500">sem planilhas complicadas.</span></h3>
            <p className="text-gray-400 text-lg">Nosso sistema aprende com sua operação e sugere as melhores ações para aumentar o lucro.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition duration-300">
                <BarChart3 size={28} />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Inteligência Financeira</h4>
              <p className="text-gray-400 leading-relaxed text-sm">
                Visualize em tempo real seu faturamento, despesas e margem de lucro. Gráficos intuitivos mostram exatamente para onde seu dinheiro está indo.
              </p>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition duration-300">
                <Users size={28} />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Gestão de Clientes (CRM)</h4>
              <p className="text-gray-400 leading-relaxed text-sm">
                Identifique clientes VIP e em risco de churn. Receba alertas automáticos quando um cliente importante não retorna há mais de 60 dias.
              </p>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition duration-300">
                <Car size={28} />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Controle de Pátio</h4>
              <p className="text-gray-400 leading-relaxed text-sm">
                Saiba exatamente quais carros estão no pátio, status do serviço e tempo de permanência. Melhore a rotatividade dos veículos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-background-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">500+</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Estéticas Ativas</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">15M</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Transacionados/mês</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">98%</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Satisfação</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">24/7</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Suporte Dedicado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Nunca mais perca uma <span className="text-gradient">oportunidade de venda.</span>
              </h2>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                O {platformName} monitora seu negócio 24 horas por dia. Se a semana está fraca, te avisamos. Se um produto está acabando, te avisamos. Se um cliente sumiu, nós ajudamos a trazê-lo de volta.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition duration-300">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                    <UserMinus size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-lg">Alertas de Churn</h5>
                    <p className="text-sm text-gray-400 mt-1">Identificamos clientes que pararam de frequentar automaticamente.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition duration-300">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <Package size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-lg">Estoque Inteligente</h5>
                    <p className="text-sm text-gray-400 mt-1">Aviso preventivo de produtos críticos para a operação não parar.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition duration-300">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <CalendarX size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-lg">Ociosidade de Agenda</h5>
                    <p className="text-sm text-gray-400 mt-1">Sugestões de promoções para dias identificados com baixo movimento.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <div className="glass-panel rounded-2xl p-8 shadow-2xl relative border-t border-l border-white/20">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/30 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                  <h4 className="font-bold text-white flex items-center gap-3 text-lg">
                    <div className="bg-red-500/20 p-2 rounded-lg">
                      <BellRing size={20} className="text-red-400" />
                    </div>
                    Central de Alertas
                  </h4>
                  <span className="bg-green-500/10 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/20 font-medium">Sistema Ativo</span>
                </div>
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-[#0B1121] border border-red-500/30 flex gap-4 items-start shadow-lg transform hover:scale-[1.02] transition duration-200">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500 shrink-0">
                      <TrendingDown size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Queda de 12% no ticket médio</h5>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">Comparado à semana anterior. Sugerimos ofertar serviços adicionais como Hidratação de Couro.</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-[#0B1121] border border-blue-500/30 flex gap-4 items-start shadow-lg transform hover:scale-[1.02] transition duration-200">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Oportunidade Quinta-feira</h5>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">Agenda com 40% de ociosidade projetada. Dispare uma campanha SMS para base inativa.</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-[#0B1121] border border-orange-500/30 flex gap-4 items-start shadow-lg transform hover:scale-[1.02] transition duration-200">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 shrink-0">
                      <UserMinus size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Anomalia: 3 Clientes VIP</h5>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">Não retornam há mais de 60 dias. Risco alto de churn. Clique para ver lista.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">O que dizem nossos <span className="text-primary">parceiros</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition">
              <div className="flex items-center gap-1 text-yellow-500 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-gray-300 text-sm mb-8 leading-relaxed italic">
                "O controle de pátio mudou nossa dinâmica. Antes perdíamos muito tempo procurando fichas, agora tudo está na tela. O faturamento subiu 20% no primeiro mês."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xl font-bold text-white">C</div>
                <div>
                  <p className="text-sm font-bold text-white">Carlos Mendes</p>
                  <p className="text-xs text-gray-500">Dono da Premium Detail</p>
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition">
              <div className="flex items-center gap-1 text-yellow-500 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-gray-300 text-sm mb-8 leading-relaxed italic">
                "A funcionalidade de alertas é incrível. O sistema me avisou que o ticket médio tinha caído e consegui reverter a situação na mesma semana. Indispensável."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-blue-600 flex items-center justify-center text-xl font-bold text-white">F</div>
                <div>
                  <p className="text-sm font-bold text-white">Fernanda Lima</p>
                  <p className="text-xs text-gray-500">Gerente na AutoSpa</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition">
              <div className="flex items-center gap-1 text-yellow-500 mb-6">
                {[1,2,3,4].map(i => <Star key={i} size={16} fill="currentColor" />)}
                <StarHalf size={16} fill="currentColor" />
              </div>
              <p className="text-gray-300 text-sm mb-8 leading-relaxed italic">
                "Excelente para gestão de clientes recorrentes. Consigo ver quem são meus VIPs e dar um tratamento diferenciado. O software se paga sozinho."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-700 to-purple-600 flex items-center justify-center text-xl font-bold text-white">R</div>
                <div>
                  <p className="text-sm font-bold text-white">Roberto Silva</p>
                  <p className="text-xs text-gray-500">Proprietário da CleanCar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-900/50 via-indigo-900/50 to-background-card border border-blue-500/30 rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse animation-delay-2000"></div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">Pronto para transformar sua estética?</h2>
            <p className="text-blue-100 text-lg mb-12 max-w-2xl mx-auto relative z-10">Junte-se a centenas de estéticas automotivas que já profissionalizaram sua gestão com o {platformName}.</p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center relative z-10">
              <button onClick={() => navigate('/login')} className="px-8 py-4 rounded-xl bg-white text-blue-900 font-bold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-white/20">
                Começar Teste Grátis
              </button>
              <button className="px-8 py-4 rounded-xl bg-transparent border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition backdrop-blur-sm">
                Falar com Consultor
              </button>
            </div>
            <p className="mt-8 text-xs text-blue-200/50 relative z-10">Sem necessidade de cartão de crédito. Cancele quando quiser.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-white/5 pt-20 pb-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs shadow-lg shadow-blue-500/30">
                  <Sparkles size={16} />
                </div>
                <span className="font-bold text-xl text-white">{platformName}</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                A plataforma definitiva para gestão de centros de estética automotiva e detailers. Inteligência artificial aplicada ao seu negócio.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Produto</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-primary transition">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-primary transition">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition">Atualizações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Recursos</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="/privacy" className="hover:text-primary transition">Privacidade</a></li>
                <li><a href="/terms" className="hover:text-primary transition">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} {platformName} Systems. Todos os direitos reservados.</p>
            <div className="flex gap-6 text-gray-500">
              <a href="#" className="hover:text-white transition"><Facebook size={20} /></a>
              <a href="#" className="hover:text-white transition"><Instagram size={20} /></a>
              <a href="#" className="hover:text-white transition"><Mail size={20} /></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Bot */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-20 right-0 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]"
            >
              {/* Chat Header */}
              <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Assistente de Vendas</h3>
                    <p className="text-xs text-indigo-100 opacity-90">IA {platformName}</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                  >
                    <div className={`p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="self-start bg-slate-800 p-3 rounded-2xl rounded-tl-none w-12 flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 border border-indigo-400/30 ${isChatOpen ? 'bg-slate-800 rotate-90' : 'bg-indigo-600 hover:bg-indigo-500'}`}
        >
          {isChatOpen ? <X size={24} /> : <Bot size={24} />}
        </button>
      </div>
    </div>
  );
}
