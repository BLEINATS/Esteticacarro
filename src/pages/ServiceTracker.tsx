import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, Clock, Wrench, ShieldCheck, MapPin, Phone, 
  MessageCircle, ChevronRight, Camera, Calendar, ArrowLeft,
  Star, Send, ThumbsUp, Frown, Meh, Smile, Heart
} from 'lucide-react';
import { db } from '../lib/db';
import { WorkOrder, CompanySettings } from '../types';
import { cn, formatCurrency, formatId } from '../lib/utils';

export default function ServiceTracker() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Rating State
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!orderId) return;
      try {
        // Buscar OS
        const orders = await db.getAll<WorkOrder>('work_orders');
        const foundOrder = orders.find(o => o.id === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
          if (foundOrder.npsScore) {
              setRating(foundOrder.npsScore);
              setRatingSubmitted(true);
          }
          
          // Buscar Configurações da Loja
          if (foundOrder.tenant_id) {
            const tenants = await db.getAll<any>('tenants');
            const tenant = tenants.find(t => t.id === foundOrder.tenant_id);
            if (tenant && tenant.settings) {
              setSettings(tenant.settings);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar rastreamento:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  const handleSubmitRating = async () => {
      if (!order || rating === null) return;
      
      setIsSubmittingRating(true);
      try {
          // Update local DB (Simulating API call)
          // We save npsComment in json_data AND top level for type safety if possible, 
          // but AppContext loads json_data into root, so saving to json_data is enough for persistence in this mock structure.
          await db.update('work_orders', order.id, { 
              nps_score: rating,
              json_data: { ...order.json_data, npsComment: comment } 
          });
          setRatingSubmitted(true);
      } catch (error) {
          console.error("Erro ao salvar avaliação", error);
          alert("Erro ao enviar avaliação. Tente novamente.");
      } finally {
          setIsSubmittingRating(false);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
          <Wrench className="text-slate-400" size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Ordem de Serviço não encontrada</h1>
        <p className="text-slate-500">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  // Steps configuration
  const steps = [
    { id: 'Aguardando', label: 'Recebido', icon: Clock },
    { id: 'Em Andamento', label: 'Em Execução', icon: Wrench },
    { id: 'Controle de Qualidade', label: 'Qualidade', icon: ShieldCheck },
    { id: 'Concluído', label: 'Pronto', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => 
    s.id === order.status || 
    (order.status === 'Aguardando Peças' && s.id === 'Em Andamento') ||
    (order.status === 'Entregue' && s.id === 'Concluído')
  );

  const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;
  const isCompleted = order.status === 'Concluído' || order.status === 'Entregue';

  // Collect all photos
  const timelinePhotos = order.dailyLog?.flatMap(log => log.photos.map(url => ({ url, date: log.date, desc: log.description }))) || [];
  const damagePhotos = order.damages?.filter(d => d.photoUrl && d.photoUrl !== 'pending').map(d => ({ url: d.photoUrl!, date: order.createdAt, desc: `Avaria: ${d.description}` })) || [];
  const allPhotos = [...damagePhotos, ...timelinePhotos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- EMOTION LOGIC ---
  const currentScore = hoverRating ?? rating;
  
  const getReaction = (score: number | null) => {
      if (score === null) return { icon: Star, color: 'text-white/30', text: 'Toque para avaliar', animation: '' };
      if (score >= 9) return { icon: Heart, color: 'text-pink-400 fill-pink-400', text: 'Incrível! 😍', animation: 'animate-bounce' };
      if (score >= 7) return { icon: Smile, color: 'text-green-400', text: 'Muito Bom! 🙂', animation: 'animate-pulse' };
      if (score >= 5) return { icon: Meh, color: 'text-yellow-400', text: 'Razoável 😐', animation: '' };
      return { icon: Frown, color: 'text-red-400', text: 'Poxa, o que houve? 😔', animation: 'animate-pulse' };
  };

  const reaction = getReaction(currentScore);
  const ReactionIcon = reaction.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {settings?.name?.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">{settings?.name || 'Cristal Care'}</h1>
              <p className="text-xs text-slate-500">Acompanhamento Online</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block">OS</span>
            <span className="text-sm font-mono font-bold text-slate-900">{formatId(order.id)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Vehicle Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{order.vehicle}</h2>
              <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded mt-1">
                {order.plate}
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Wrench size={24} />
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Serviço Principal</p>
            <p className="text-sm font-medium text-slate-800">{order.service}</p>
          </div>

          {order.deadline && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              <Calendar size={16} />
              <span className="font-bold">Previsão: {order.deadline}</span>
            </div>
          )}
        </div>

        {/* Status Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-6">Status Atual</h3>
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-100" />
            
            <div className="space-y-6 relative">
              {steps.map((step, idx) => {
                const isStepCompleted = idx <= activeStep;
                const isCurrent = idx === activeStep;
                
                return (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors duration-500",
                      isStepCompleted ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"
                    )}>
                      <step.icon size={14} />
                    </div>
                    <div className={cn("flex-1 transition-opacity duration-500", isStepCompleted ? "opacity-100" : "opacity-40")}>
                      <p className={cn("text-sm font-bold", isCurrent ? "text-green-600" : "text-slate-900")}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-green-600 animate-pulse font-medium">
                          {order.status === 'Entregue' ? 'Veículo Entregue' : 'Em andamento...'}
                        </p>
                      )}
                    </div>
                    {isStepCompleted && <CheckCircle2 size={16} className="text-green-500" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline / Daily Log */}
        {order.dailyLog && order.dailyLog.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 px-2">Linha do Tempo</h3>
            {order.dailyLog.map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-500">
                    {new Date(log.date).toLocaleDateString('pt-BR')} às {new Date(log.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm text-slate-800 mb-3">{log.description}</p>
                {log.photos && log.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {log.photos.map((photo, i) => (
                      <img key={i} src={photo} className="w-24 h-24 object-cover rounded-lg border border-slate-200" alt="Progresso" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {allPhotos.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Camera size={18} className="text-purple-600" /> Galeria de Fotos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {allPhotos.map((photo, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img src={photo.url} alt={photo.desc} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-[10px] text-white font-medium truncate">{photo.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NPS Rating Section - Only if Completed/Delivered */}
        {isCompleted && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg animate-in slide-in-from-bottom">
                <div className="text-center mb-6">
                    {/* Dynamic Emotion Animation */}
                    <div className="h-24 flex items-center justify-center mb-2">
                        <div className={cn("transition-all duration-300 transform", reaction.animation)}>
                            <ReactionIcon size={80} className={cn("drop-shadow-lg", reaction.color)} />
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1 transition-all">
                        {ratingSubmitted ? 'Obrigado pela avaliação!' : reaction.text}
                    </h3>
                    
                    {!ratingSubmitted && (
                        <p className="text-indigo-100 text-sm">
                            Como você avalia nossa qualidade de 0 a 10?
                        </p>
                    )}
                </div>

                {!ratingSubmitted ? (
                    <div className="space-y-6">
                        <div className="flex justify-center gap-1.5 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                <button
                                    key={score}
                                    onClick={() => setRating(score)}
                                    onMouseEnter={() => setHoverRating(score)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    className={cn(
                                        "w-8 h-10 rounded-lg font-bold text-sm transition-all flex items-center justify-center border-b-4 active:border-b-0 active:translate-y-1",
                                        (hoverRating !== null ? score <= hoverRating : (rating !== null && score <= rating))
                                            ? "bg-white text-indigo-700 border-indigo-900 scale-110 shadow-lg"
                                            : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                                    )}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-white/10 p-1 rounded-xl">
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="O que você mais gostou? (Opcional)..."
                                className="w-full p-3 bg-transparent border-none text-white placeholder-indigo-200 text-sm focus:ring-0 resize-none"
                                rows={3}
                            />
                        </div>

                        <button 
                            onClick={handleSubmitRating}
                            disabled={rating === null || isSubmittingRating}
                            className="w-full py-4 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isSubmittingRating ? 'Enviando...' : 'Enviar Avaliação'} <Send size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/10 rounded-xl p-6 text-center border border-white/10">
                        <div className="flex justify-center gap-1 mb-3">
                            {[1,2,3,4,5].map(i => (
                                <Star key={i} size={24} className={cn(i <= Math.round((rating || 0)/2) ? "fill-yellow-300 text-yellow-300" : "text-indigo-300")} />
                            ))}
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">Nota {rating}</p>
                        <p className="text-sm text-indigo-200">Sua opinião ajuda a melhorar nossos serviços.</p>
                    </div>
                )}
            </div>
        )}

        {/* Contact Footer */}
        {settings && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 text-center mt-8">
            <h3 className="font-bold text-lg mb-2">Fale Conosco</h3>
            <p className="text-slate-400 text-sm mb-6">Dúvidas sobre o serviço? Estamos à disposição.</p>
            
            <div className="flex flex-col gap-3">
              <a 
                href={`https://wa.me/55${settings.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={20} /> WhatsApp
              </a>
              <a 
                href={`tel:${settings.phone}`}
                className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Phone size={20} /> Ligar
              </a>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 text-xs text-slate-500 flex items-center justify-center gap-1">
              <MapPin size={12} /> {settings.address}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
