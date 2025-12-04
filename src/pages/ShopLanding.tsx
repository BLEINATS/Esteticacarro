import React, { useState } from 'react';
import { 
  Calendar, Star, MapPin, Phone, Instagram, 
  Clock, ShieldCheck, Droplets, ArrowRight, 
  Menu, X, ChevronRight, Car, CheckCircle2,
  LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ShopLanding() {
  const navigate = useNavigate();
  const { companySettings } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const services = [
    {
      title: 'Polimento Técnico',
      desc: 'Correção de pintura, remoção de riscos e recuperação do brilho original.',
      price: 'A partir de R$ 450',
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000'
    },
    {
      title: 'Vitrificação',
      desc: 'Proteção cerâmica de alta durabilidade (até 3 anos) contra sol, chuva e sujeira.',
      price: 'A partir de R$ 890',
      image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=1000'
    },
    {
      title: 'Higienização Interna',
      desc: 'Limpeza profunda de bancos, teto, carpetes e hidratação de couro.',
      price: 'A partir de R$ 350',
      image: 'https://images.unsplash.com/photo-1605218427360-6961d3748ea9?auto=format&fit=crop&q=80&w=1000'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
                {companySettings.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-bold text-xl tracking-tight">{companySettings.name}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#servicos" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Serviços</a>
              <a href="#sobre" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Sobre</a>
              <a href="#contato" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Contato</a>
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20"
              >
                <LogIn size={16} />
                Área do Cliente / Login
              </button>
            </div>

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl">
            <a href="#servicos" className="block font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Serviços</a>
            <a href="#sobre" className="block font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Sobre</a>
            <a href="#contato" className="block font-medium text-slate-600" onClick={() => setIsMenuOpen(false)}>Contato</a>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold"
            >
              Login
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 -z-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50 rounded-l-[100px] -z-10 hidden lg:block"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in slide-in-from-left duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">
                <Star size={12} className="fill-blue-700" />
                Referência em Estética Automotiva
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Seu carro merece <br/>
                <span className="text-blue-600">tratamento vip</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Transformamos seu veículo com as técnicas mais avançadas de detalhamento, proteção e restauração. Qualidade que você vê e sente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href={`https://wa.me/55${companySettings.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  Agendar Avaliação Grátis <ArrowRight size={18} />
                </a>
                <button className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Car size={18} /> Ver Portfólio
                </button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Cliente" className="w-10 h-10 rounded-full border-2 border-white" />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex text-yellow-400 mb-0.5">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                  <p className="font-medium text-slate-900">+500 clientes satisfeitos</p>
                </div>
              </div>
            </div>
            <div className="relative lg:h-[600px] animate-in slide-in-from-right duration-700 delay-200">
              <img 
                src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000" 
                alt="Carro sendo polido" 
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs hidden sm:block">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Garantia Total</p>
                    <p className="text-xs text-slate-500">Serviço certificado</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Utilizamos apenas produtos premium certificados internacionalmente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Nossos Serviços Premium</h2>
            <p className="text-slate-600">Soluções completas para estética, proteção e restauração do seu veículo.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="group rounded-2xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{service.desc}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="font-bold text-blue-600">{service.price}</span>
                    <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <h3 className="text-white font-bold text-xl mb-4">{companySettings.name}</h3>
              <p className="text-sm leading-relaxed max-w-xs mb-6">
                Elevando o padrão da estética automotiva. Cuidamos do seu carro com a paixão e a técnica que ele merece.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><Instagram size={20} /></a>
                <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors"><Phone size={20} /></a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contato</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Phone size={16} /> {companySettings.phone}</li>
                <li className="flex items-center gap-2"><MapPin size={16} /> {companySettings.address}</li>
                <li className="flex items-center gap-2"><Clock size={16} /> Seg-Sex: 08h às 18h</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="/login" className="hover:text-white transition-colors">Área do Cliente</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {companySettings.name}. Todos os direitos reservados. Sistema por Crystal Care ERP.
          </div>
        </div>
      </footer>
    </div>
  );
}
