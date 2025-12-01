import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Download, Share2, QrCode, Smartphone, Wallet, Copy, Check, Gift } from 'lucide-react';
import FidelityCard from '../components/FidelityCard';
import QRCode from 'qrcode';

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, getClientPoints, getFidelityCard, companySettings, getRewardsByLevel, generatePKPass, generateGoogleWallet, getWhatsappLink } = useApp();
  const client = clients.find(c => c.id === clientId);
  const points = getClientPoints(clientId || '');
  const card = getFidelityCard(clientId || '');
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pkpassUrl, setPkpassUrl] = useState('');
  const [googleWalletUrl, setGoogleWalletUrl] = useState('');
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (!card || !points) return;
    
    // Gerar QR code com dados do cliente
    const qrData = {
      clientId: client?.id,
      cardNumber: card.cardNumber,
      clientName: client?.name,
      totalPoints: points.totalPoints,
      tier: points.tier,
      timestamp: new Date().toISOString()
    };
    
    QRCode.toDataURL(JSON.stringify(qrData), { width: 300 })
      .then(setQrCodeUrl)
      .catch(console.error);
    
    // Gerar URLs de wallet
    setPkpassUrl(generatePKPass(clientId || ''));
    setGoogleWalletUrl(generateGoogleWallet(clientId || ''));
    
    // Gerar link compartilhável
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/client-profile/${clientId}`);
  }, [clientId, card, points, generatePKPass, generateGoogleWallet, client?.id]);

  if (!client || !points || !card) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Cliente não encontrado</p>
      </div>
    );
  }

  const handleDownloadPKPass = () => {
    if (pkpassUrl) {
      const link = document.createElement('a');
      link.href = pkpassUrl;
      link.download = `cartao-fidelidade-${card.cardNumber}.txt`;
      link.click();
    }
  };

  const handleAddToGoogleWallet = () => {
    if (googleWalletUrl) {
      window.open(googleWalletUrl, '_blank');
    }
  };

  const handleCopyCardNumber = () => {
    navigator.clipboard.writeText(card.cardNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Meu cartão de fidelidade Cristal Care:\nNúmero: ${card.cardNumber}\nPontos: ${points.totalPoints}\nNível: ${points.tier.toUpperCase()}`;
    if (navigator.share) {
      navigator.share({ title: 'Meu Cartão de Fidelidade', text: shareText }).catch(() => {
        navigator.clipboard.writeText(shareText);
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSendViaWhatsApp = () => {
    const message = `Olá ${client?.name}! 🎁\n\nSeu cartão de fidelidade ${companySettings.name} está pronto! Você já tem ${points.totalPoints} pontos no nível ${points.tier.toUpperCase()}.\n\nAdicione ao seu Wallet:\n${shareLink}\n\nNúmero: ${card.cardNumber}`;
    const whatsappLink = getWhatsappLink(client?.phone || '', message);
    window.open(whatsappLink, '_blank');
  };

  const availableRewards = points.tier ? getRewardsByLevel(points.tier as 'bronze' | 'silver' | 'gold' | 'platinum') : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Clientes
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {client.name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Cartão de Fidelidade - {points.tier.toUpperCase()} • {points.totalPoints} Pontos
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Fidelity Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
            <FidelityCard
              clientName={client.name}
              clientPhone={client.phone}
              totalPoints={points.totalPoints}
              currentLevel={points.currentLevel}
              tier={points.tier}
              cardNumber={card.cardNumber}
              servicesCompleted={points.servicesCompleted}
              logoUrl={companySettings.logoUrl}
              shopName={companySettings.name}
              instagram={companySettings.instagram}
              facebook={companySettings.facebook}
              website={companySettings.website}
            />
          </div>

          {/* QR Code Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            {qrCodeUrl ? (
              <>
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg border-2 border-slate-200 dark:border-slate-700" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">Escanear para acompanhar pontos</p>
              </>
            ) : (
              <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <QrCode size={32} className="text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Wallet & WhatsApp Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleDownloadPKPass}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg"
          >
            <Smartphone size={20} /> iOS Wallet
          </button>
          <button
            onClick={handleAddToGoogleWallet}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-lg"
          >
            <Wallet size={20} /> Google Wallet
          </button>
          <button
            onClick={handleSendViaWhatsApp}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg"
          >
            💬 Enviar via WhatsApp
          </button>
        </div>

        {/* Card Number & Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800 mb-8">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Número do Cartão</h3>
                <button
                  onClick={handleCopyCardNumber}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-700 dark:text-slate-300 font-semibold text-sm"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">{card.cardNumber}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Link de Compartilhamento</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono text-slate-600 dark:text-slate-400"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-semibold text-sm"
                >
                  {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors"
            >
              <Share2 size={18} /> Compartilhar Cartão
            </button>
          </div>
        </div>

        {/* Points History */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-8">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
            📋 Histórico de Pontos ({points.pointsHistory?.length || 0})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {points.pointsHistory && points.pointsHistory.length > 0 ? (
              points.pointsHistory.map(entry => (
                <div key={entry.id} className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-200 text-sm">{entry.description}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">+{entry.points}</span>
                </div>
              ))
            ) : (
              <p className="text-blue-700 dark:text-blue-400 text-sm italic">Nenhum ponto acumulado ainda</p>
            )}
          </div>
        </div>

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-4 flex items-center gap-2">
              <Gift size={20} /> Recompensas Disponíveis ({availableRewards.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {availableRewards.map(reward => (
                <div key={reward.id} className="p-3 bg-white/60 dark:bg-slate-900/50 rounded-lg">
                  <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">{reward.name}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">{reward.description}</p>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-300 mt-1">
                    {reward.rewardType === 'discount' ? `${reward.percentage}% desconto` : reward.gift}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
