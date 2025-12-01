import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, Star, MapPin, Phone, 
  ArrowRight, ShieldCheck, Clock, Sparkles, Menu, X,
  LogIn, ChevronDown, Instagram, Facebook, Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkOrder } from '../types';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const scaleOnHover = {
  hover: { scale: 1.05, transition: { duration: 0.3 } }
};

export default function ShopLanding() {
  const { companySettings, services, addWorkOrder } = useApp();
  const { landingPage, name, logoUrl, phone, address, email, instagram, facebook } = companySettings;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    vehicleModel: '',
    serviceId: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Scroll Effect for Navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  // Helper to scroll smoothly
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  if (!landingPage.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Em Breve</h1>
          <p className="text-slate-400">Estamos preparando uma nova experiência para você.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone || !bookingForm.vehicleModel) return;

    const selectedService = services.find(s => s.id === bookingForm.serviceId);
    const serviceName = selectedService ? selectedService.name : 'Orçamento Geral';

    const newLead: WorkOrder = {
      id: `LEAD-${Date.now()}`,
      clientId: 'lead-temp',
      vehicle: bookingForm.vehicleModel,
      plate: 'A DEFINIR',
      service: serviceName,
      serviceId: bookingForm.serviceId,
      status: 'Aguardando Aprovação',
      technician: 'A Definir',
      deadline: 'A Definir',
      priority: 'medium',
      totalValue: 0,
      damages: [],
      vehicleInventory: { estepe: false, macaco: false, chaveRoda: false, tapetes: false, manual: false, antena: false, pertences: '' },
      dailyLog: [],
      qaChecklist: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      checklist: [],
      origin: 'web_lead'
    };

    addWorkOrder(newLead);
    setIsSubmitted(true);
    
    setTimeout(() => {
      setIsSubmitted(false);
      setBookingForm({ name: '', phone: '', vehicleModel: '', serviceId: '' });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 py-4' : 'bg-transparent py-6'}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 rounded-full"></div>
              <img src={logoUrl} alt={name} className="relative w-10 h-10 rounded-full object-cover border border-white/20" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">{name}</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('services')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
              Serviços
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
            </button>
            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
              Sobre
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection('booking')}
              className="px-6 py-2.5 bg-white text-slate-950 text-sm font-bold rounded-full hover:bg-blue-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              Agendar
            </button>
            <Link 
              to="/" 
              className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors border-l border-white/20 pl-6"
            >
              <LogIn size={16} /> Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-950 border-b border-white/10 overflow-hidden"
            >
              <div className="p-6 space-y-4 flex flex-col">
                <button onClick={() => scrollToSection('services')} className="text-lg font-medium text-slate-300 text-left">Serviços</button>
                <button onClick={() => scrollToSection('about')} className="text-lg font-medium text-slate-300 text-left">Sobre</button>
                <button onClick={() => scrollToSection('booking')} className="text-lg font-bold text-blue-400 text-left">Agendar Agora</button>
                <Link to="/" className="text-lg font-medium text-slate-300 pt-4 border-t border-white/10" onClick={() => setIsMenuOpen(false)}>
                   Área do Cliente
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      {/* FIX: min-h-screen instead of h-screen to prevent cutoff on small screens */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
        {/* Background Parallax */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] z-10" />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            src={landingPage.heroImage} 
            alt="Hero Car" 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-300 text-sm font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Estética Automotiva Premium
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-6 tracking-tight">
              {landingPage.heroTitle.split(' ').map((word, i) => (
                <span key={i} className="inline-block mr-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                  {word}
                </span>
              ))}
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {landingPage.heroSubtitle}
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => scrollToSection('booking')}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.7)] flex items-center justify-center gap-2 group"
              >
                Agendar Avaliação <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                Conhecer Serviços
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 2, duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
        >
          <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* --- SERVICES SECTION --- */}
      {landingPage.showServices && (
        <section id="services" className="py-32 relative scroll-mt-16">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-20"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Nossos Serviços</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Soluções completas de detalhamento e proteção para elevar o nível do seu veículo.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.filter(s => s.active).map((service, idx) => (
                <motion.div 
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group relative bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-500"
                >
                  {/* Card Image Placeholder (Gradient) */}
                  <div className={`h-48 w-full relative group-hover:scale-105 transition-transform duration-700`}>
                    {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${idx % 2 === 0 ? 'from-slate-800 to-slate-900' : 'from-slate-900 to-slate-800'}`} />
                    )}
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Clock size={12} className="text-blue-400" /> {service.standardTimeMinutes} min
                      </span>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Sparkles size={24} />
                      </div>
                      <ArrowRight className="text-slate-600 group-hover:text-white -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">{service.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {service.description || "Tratamento especializado utilizando produtos de alta tecnologia para garantir o melhor resultado estético e proteção duradoura."}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      {service.category}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- FEATURES / WHY US --- */}
      <section id="about" className="py-32 bg-slate-900 relative overflow-hidden scroll-mt-16">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Não é apenas lavagem.<br />
              É <span className="text-blue-500">Ciência e Arte.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Na {name}, combinamos técnicas artesanais de detalhamento com a mais avançada tecnologia em produtos automotivos. Cada veículo é tratado como uma obra de arte única.
            </p>
            
            <div className="space-y-6">
              {[
                { title: "Produtos Certificados", desc: "Utilizamos apenas compostos de nível global." },
                { title: "Ambiente Controlado", desc: "Estúdio com iluminação técnica para correção perfeita." },
                { title: "Garantia de Serviço", desc: "Certificado de proteção e suporte pós-venda." }
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{feat.title}</h4>
                    <p className="text-slate-500 text-sm">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <img 
                src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80" 
                alt="Detailing Process" 
                className="rounded-xl w-full object-cover"
              />
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white text-slate-950 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="bg-yellow-400 p-2 rounded-lg">
                  <Star size={24} className="text-yellow-900" fill="currentColor" />
                </div>
                <div>
                  <p className="font-black text-xl">5.0</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avaliação Média</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- BOOKING SECTION --- */}
      <section id="booking" className="py-32 relative scroll-mt-16">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-16 shadow-2xl overflow-hidden relative"
          >
            {/* Decorative Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Agende sua Experiência</h2>
              <p className="text-slate-400">
                Preencha o formulário abaixo. Nossa equipe entrará em contato para confirmar os detalhes e personalizar seu atendimento.
              </p>
            </div>

            {isSubmitted ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/10 border border-green-500/20 rounded-2xl p-12 text-center"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                  <CheckCircle2 size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Solicitação Recebida!</h3>
                <p className="text-slate-300">Em breve entraremos em contato pelo WhatsApp.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Seu Nome</label>
                    <input 
                      type="text" 
                      required
                      value={bookingForm.name}
                      onChange={e => setBookingForm({...bookingForm, name: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">WhatsApp</label>
                    <input 
                      type="tel" 
                      required
                      value={bookingForm.phone}
                      onChange={e => setBookingForm({...bookingForm, phone: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modelo do Carro</label>
                    <input 
                      type="text" 
                      required
                      value={bookingForm.vehicleModel}
                      onChange={e => setBookingForm({...bookingForm, vehicleModel: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                      placeholder="Ex: BMW 320i, Porsche 911..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Serviço de Interesse</label>
                    <div className="relative">
                      <select 
                        value={bookingForm.serviceId}
                        onChange={e => setBookingForm({...bookingForm, serviceId: e.target.value})}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Gostaria de uma avaliação / Não sei</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-5 rounded-xl text-lg transition-all shadow-xl shadow-blue-900/20 mt-8"
                >
                  Solicitar Agendamento VIP
                </motion.button>
                <p className="text-center text-xs text-slate-600 mt-4">
                  Seus dados estão seguros. Não enviamos spam.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={logoUrl} alt={name} className="w-12 h-12 rounded-full grayscale opacity-80" />
                <span className="font-bold text-2xl text-white">{name}</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Elevando o padrão da estética automotiva. Cuidado meticuloso, tecnologia de ponta e paixão por carros.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Contato</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-blue-500" /> {phone}
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-blue-500" /> {email}
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-blue-500 mt-1" /> {address}
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Social</h4>
              <div className="flex gap-4">
                {instagram && (
                    <a href={instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                        <Instagram size={20} />
                    </a>
                )}
                {facebook && (
                    <a href={facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                        <Facebook size={20} />
                    </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <p>&copy; {new Date().getFullYear()} {name}. Todos os direitos reservados.</p>
            <p>Powered by Cristal Care ERP</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
