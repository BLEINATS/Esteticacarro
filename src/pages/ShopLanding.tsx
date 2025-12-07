import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Car, ArrowRight, LogIn, Star, ShieldCheck, Phone, MapPin, Clock, 
  Instagram, CheckCircle2, ChevronRight, Facebook, ExternalLink, Smartphone
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShopLanding() {
  const navigate = useNavigate();
  const { shopId } = useParams(); // Captura o ID/Slug da URL
  const { companySettings, services } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter active services that are enabled for landing page
  const displayServices = services
    .filter(s => s.active && (s.showOnLandingPage !== false))
    .slice(0, 9); // Limit to 9 for layout
    
  const hasServices = displayServices.length > 0;

  const defaultServices = [
    {
      id: 'def1',
      name: 'Polimento Técnico',
      description: 'Correção de pintura, remoção de riscos e recuperação do brilho original com acabamento espelhado.',
      imageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'def2',
      name: 'Vitrificação Cerâmica',
      description: 'Proteção de alta durabilidade (até 3 anos) contra sol, chuva ácida e sujeira, com hidrofobia extrema.',
      imageUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'def3',
      name: 'Higienização Premium',
      description: 'Limpeza profunda de bancos, teto, carpetes e hidratação de couro com produtos bactericidas.',
      imageUrl: 'https://images.unsplash.com/photo-1605218427360-6961d3748ea9?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'def4',
      name: 'Detalhamento de Motor',
      description: 'Limpeza técnica e proteção de plásticos e borrachas do cofre do motor, sem uso de água sob pressão.',
      imageUrl: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'def5',
      name: 'Revitalização de Faróis',
      description: 'Remoção do amarelado e opacidade das lentes, devolvendo a transparência e segurança na iluminação.',
      imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'def6',
      name: 'Oxi-Sanitização',
      description: 'Eliminação de odores, fungos e bactérias do interior do veículo através de gerador de ozônio.',
      imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=1000'
    }
  ];

  const servicesToShow = hasServices ? displayServices : defaultServices;
  
  // Link do WhatsApp com mensagem personalizada
  const defaultMessage = companySettings.landingPage?.whatsappMessage || 'Olá, gostaria de agendar uma visita.';
  const whatsappLink = `https://wa.me/55${companySettings.phone.replace(/\D/g, '')}?text=${encodeURIComponent(defaultMessage)}`;

  // NOTE: In a real backend scenario, we would fetch the shop data based on `shopId`.
  // Since this is a local-storage based prototype, we assume the current context IS the shop.
  // However, we can use the shopId for display or validation if needed.

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 border-b ${
          scrolled 
            ? 'bg-slate-950/90 backdrop-blur-md border-slate-800 py-3 shadow-lg' 
            : 'bg-transparent border-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {companySettings.logoUrl ? (
                 <img src={companySettings.logoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white/10 shadow-lg" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
                    {companySettings.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white">{companySettings.name}</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Início</a>
              <a href="#servicos" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Serviços</a>
              <a href="#diferenciais" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Diferenciais</a>
              <a href="#contato" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Contato</a>
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full text-sm font-bold transition-all backdrop-blur-sm"
              >
                <LogIn size={16} />
                Área do Cliente
              </button>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/30 transform hover:scale-105"
              >
                Agendar Visita
              </a>
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
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
              className="md:hidden bg-slate-900 border-t border-slate-800 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <a href="#inicio" className="block font-medium text-slate-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Início</a>
                <a href="#servicos" className="block font-medium text-slate-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Serviços</a>
                <a href="#diferenciais" className="block font-medium text-slate-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Diferenciais</a>
                <a href="#contato" className="block font-medium text-slate-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Contato</a>
                <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold"
                  >
                    Área do Cliente
                  </button>
                  <a 
                    href={whatsappLink}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-center"
                  >
                    Agendar Visita
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="inicio" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={companySettings.landingPage?.heroImage || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920"} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wide mb-6 backdrop-blur-md"
            >
              <Star size={12} className="fill-blue-400" />
              Estética Automotiva Premium
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] mb-6"
            >
              {companySettings.landingPage?.heroTitle || 'Seu carro merece tratamento VIP'}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl"
            >
              {companySettings.landingPage?.heroSubtitle || 'Transformamos seu veículo com as técnicas mais avançadas de detalhamento, proteção e restauração. Qualidade que você vê e sente.'}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 group"
              >
                Agendar Visita
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#servicos" 
                className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                Conhecer Serviços
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-12 flex items-center gap-8 pt-8 border-t border-white/10"
            >
              <div>
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-sm text-slate-400">Carros Entregues</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">4.9</p>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  Avaliação Média
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-slate-400">Satisfação</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section id="servicos" className="py-24 bg-slate-950 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2">Nossos Serviços</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Soluções completas para seu veículo</h3>
            <p className="text-slate-400">
              Do polimento técnico à higienização interna, oferecemos o que há de melhor em estética automotiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesToShow.map((service, idx) => (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10"
              >
                <div className="h-56 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-60" />
                  <img 
                    src={service.imageUrl || "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000"} 
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="inline-block px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-lg mb-2">
                      Premium
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{service.name}</h4>
                  <p className="text-slate-400 text-sm mb-6 line-clamp-3">{service.description}</p>
                  
                  <a 
                    href={`${whatsappLink.split('?')[0]}?text=${encodeURIComponent(`Olá, gostaria de saber mais sobre ${service.name}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between w-full px-4 py-3 bg-slate-800 hover:bg-blue-600 rounded-xl text-sm font-bold text-white transition-all group-hover:translate-x-1"
                  >
                    Solicitar Orçamento
                    <ChevronRight size={16} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DIFFERENTIALS --- */}
      <section id="diferenciais" className="py-24 bg-slate-900 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2">Por que nos escolher?</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Cuidado obsessivo em cada detalhe</h3>
              <p className="text-slate-400 mb-8 text-lg">
                Não somos apenas um lava-rápido. Somos um estúdio de detalhamento focado em restaurar e proteger seu patrimônio com as melhores técnicas do mercado.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Produtos Certificados', desc: 'Utilizamos apenas produtos de linha premium e alta performance.', icon: ShieldCheck },
                  { title: 'Profissionais Treinados', desc: 'Equipe em constante atualização com as novas técnicas.', icon: Star },
                  { title: 'Garantia de Serviço', desc: 'Satisfação garantida ou refazemos o trabalho.', icon: CheckCircle2 },
                  { title: 'Acompanhamento Online', desc: 'Receba fotos e status do seu carro em tempo real.', icon: Smartphone }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700 text-blue-500">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl transform rotate-3 opacity-20 blur-lg" />
              <img 
                src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000" 
                alt="Detailing" 
                className="relative rounded-3xl shadow-2xl border border-slate-800 w-full"
              />
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 max-w-xs hidden sm:block">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Garantia Total</p>
                    <p className="text-xs text-slate-400">Serviço certificado</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">Seu carro em boas mãos, com seguro e proteção durante todo o serviço.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Pronto para transformar seu carro?</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                Agende agora uma avaliação gratuita e descubra o verdadeiro potencial do seu veículo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-6 h-6" />
                  Chamar no WhatsApp
                </a>
                <a 
                  href="#servicos"
                  className="px-8 py-4 bg-blue-800 text-white border border-blue-700 rounded-xl font-bold text-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                >
                  Ver Tabela de Preços
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contato" className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                {companySettings.logoUrl && <img src={companySettings.logoUrl} className="w-8 h-8 rounded-lg" alt="Logo" />}
                <span className="text-xl font-bold text-white">{companySettings.name}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
                Elevando o padrão da estética automotiva. Cuidamos do seu carro com a paixão e a técnica que ele merece.
              </p>
              <div className="flex gap-4">
                {companySettings.instagram && (
                    <a href={companySettings.instagram} target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-400 transition-all"><Instagram size={20} /></a>
                )}
                {companySettings.facebook && (
                    <a href={companySettings.facebook} target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-400 transition-all"><Facebook size={20} /></a>
                )}
                {companySettings.website && (
                    <a href={companySettings.website} target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-blue-600 hover:border-blue-600 hover:text-white text-slate-400 transition-all"><ExternalLink size={20} /></a>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Contato</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <Phone size={18} className="text-blue-500 mt-0.5" /> 
                  <span>{companySettings.phone}</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-blue-500 mt-0.5" /> 
                  <span>{companySettings.address}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={18} className="text-blue-500 mt-0.5" /> 
                  <span>Seg-Sex: 08h às 18h<br/>Sáb: 08h às 12h</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/privacy" className="hover:text-blue-400 transition-colors">Política de Privacidade</a></li>
                <li><a href="/terms" className="hover:text-blue-400 transition-colors">Termos de Uso</a></li>
                <li><a href="/login" className="hover:text-blue-400 transition-colors">Área do Cliente</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} {companySettings.name}. Todos os direitos reservados.
            </p>
            <p className="text-xs text-slate-700 flex items-center gap-1">
              Powered by <span className="font-bold text-slate-600">Cristal Care ERP</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center transition-transform hover:scale-110 animate-in fade-in slide-in-from-bottom-10"
        title="Fale conosco no WhatsApp"
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-8 h-8" />
      </a>
    </div>
  );
}
