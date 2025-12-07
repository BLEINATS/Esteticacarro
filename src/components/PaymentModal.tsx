import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, CheckCircle2, Loader2, CreditCard, Lock, Calendar, User, ShieldCheck, Globe } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { createPixCharge, createCreditCardCharge, AsaasPayment } from '../services/asaas';
import { createStripePixPaymentIntent, createStripeCardPaymentIntent } from '../services/stripe';
import QRCode from 'qrcode';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onSuccess: () => void;
  gateway?: 'asaas' | 'stripe'; // Prop para definir o gateway
}

export default function PaymentModal({ isOpen, onClose, amount, description, onSuccess, gateway = 'asaas' }: PaymentModalProps) {
  const [step, setStep] = useState<'method' | 'card_details' | 'processing' | 'payment' | 'success'>('method');
  const [paymentData, setPaymentData] = useState<AsaasPayment | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState('');

  // Card Data State
  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expiry: '',
    cvv: ''
  });

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setPaymentData(null);
      setQrCodeDataUrl('');
      setCardData({ number: '', holderName: '', expiry: '', cvv: '' });
      setError('');
    }
  }, [isOpen]);

  // Generate QR Code image when payload is available
  useEffect(() => {
    if (paymentData?.pix?.payload) {
      QRCode.toDataURL(paymentData.pix.payload, { width: 300, margin: 2 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [paymentData]);

  // --- PIX HANDLERS ---
  const handleSelectPix = async () => {
    setStep('processing');
    try {
      let data;
      // Lógica de seleção do Gateway
      if (gateway === 'stripe') {
        data = await createStripePixPaymentIntent(amount, description);
      } else {
        data = await createPixCharge(amount, description);
      }
      setPaymentData(data);
      setStep('payment');
    } catch (error) {
      console.error("Erro ao gerar Pix", error);
      setError("Falha ao conectar com o gateway de pagamento.");
      setStep('method');
    }
  };

  const handleCopyPix = () => {
    if (paymentData?.pix?.payload) {
      navigator.clipboard.writeText(paymentData.pix.payload);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSimulatePixPayment = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }, 1500);
  };

  // --- CARD HANDLERS ---
  const handleSelectCard = () => {
    setStep('card_details');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardData({ ...cardData, number: value.substring(0, 19) }); // Limit to 16 digits + spaces
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardData({ ...cardData, expiry: value.substring(0, 5) });
  };

  const handleProcessCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('processing');

    try {
      // Lógica de seleção do Gateway para Cartão
      if (gateway === 'stripe') {
        await createStripeCardPaymentIntent(amount, cardData, description);
      } else {
        await createCreditCardCharge(amount, cardData, description);
      }
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento.');
      setStep('card_details');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Checkout Seguro</h3>
            <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Processado por:</span>
                <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                    gateway === 'stripe' 
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" 
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                )}>
                    {gateway === 'stripe' ? <Globe size={10} /> : <ShieldCheck size={10} />}
                    {gateway === 'stripe' ? 'Stripe' : 'Asaas'}
                </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* STEP 1: SELECT METHOD */}
          {step === 'method' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Valor a pagar</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(amount)}</p>
                <p className="text-xs text-slate-400 mt-1">{description}</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs text-center">
                    {error}
                </div>
              )}

              <div className="space-y-3">
                <button 
                  onClick={handleSelectPix}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <QrCode size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400">Pix (Instantâneo)</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Aprovação imediata</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-green-500 group-hover:bg-green-500" />
                </button>

                <button 
                  onClick={handleSelectCard}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <CreditCard size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Cartão de Crédito</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Até 12x sem juros</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-blue-500 group-hover:bg-blue-500" />
                </button>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Lock size={12} /> Ambiente criptografado
              </div>
            </div>
          )}

          {/* STEP 1.5: CARD DETAILS */}
          {step === 'card_details' && (
            <form onSubmit={handleProcessCardPayment} className="space-y-4 animate-in slide-in-from-right">
                <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => setStep('method')} className="text-xs text-blue-600 hover:underline">
                        &larr; Voltar
                    </button>
                    <span className="text-xs font-bold text-slate-500 uppercase">Dados do Cartão</span>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs text-center">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Número do Cartão</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            required
                            value={cardData.number}
                            onChange={handleCardNumberChange}
                            placeholder="0000 0000 0000 0000"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Titular</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            required
                            value={cardData.holderName}
                            onChange={e => setCardData({...cardData, holderName: e.target.value.toUpperCase()})}
                            placeholder="COMO NO CARTÃO"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Validade</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required
                                maxLength={5}
                                value={cardData.expiry}
                                onChange={handleExpiryChange}
                                placeholder="MM/AA"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CVV</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required
                                maxLength={4}
                                value={cardData.cvv}
                                onChange={e => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                                placeholder="123"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    <Lock size={18} /> Pagar {formatCurrency(amount)}
                </button>
            </form>
          )}

          {/* STEP 2: PROCESSING (LOADING) */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 animate-in fade-in">
              <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
              <p className="font-bold text-slate-900 dark:text-white">Processando pagamento...</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Conectando com {gateway === 'stripe' ? 'Stripe' : 'Asaas'}...</p>
            </div>
          )}

          {/* STEP 3: PIX PAYMENT (QR CODE) */}
          {step === 'payment' && paymentData && (
            <div className="text-center space-y-6 animate-in slide-in-from-right">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg inline-block">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-bold">
                  Pague {formatCurrency(amount)} via Pix
                </p>
              </div>

              <div className="flex justify-center">
                {qrCodeDataUrl ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <img src={qrCodeDataUrl} alt="QR Code Pix" className="w-48 h-48" />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-slate-400" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">Ou copie o código abaixo:</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={paymentData.pix?.payload} 
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono truncate"
                  />
                  <button 
                    onClick={handleCopyPix}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-lg transition-colors"
                    title="Copiar"
                  >
                    {copySuccess ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 mb-3">
                  Após o pagamento, a liberação é automática em alguns segundos.
                </p>
                {/* Botão de Simulação para o Protótipo */}
                <button 
                  onClick={handleSimulatePixPayment}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Simular Pagamento Aprovado
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pagamento Confirmado!</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Transação aprovada com sucesso.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
