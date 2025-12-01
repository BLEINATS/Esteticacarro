import React, { useEffect, useState } from 'react';
import { Download, Copy, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

interface FidelityCardProps {
  clientName: string;
  clientPhone: string;
  totalPoints: number;
  currentLevel: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  cardNumber: string;
  servicesCompleted: number;
  logoUrl?: string;
  shopName?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

const tierColors = {
  bronze: { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
  silver: { bg: 'from-slate-400 to-slate-600', light: 'bg-slate-50 dark:bg-slate-900/20', text: 'text-slate-600' },
  gold: { bg: 'from-yellow-500 to-yellow-600', light: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600' },
  platinum: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
};

const levelNames = ['Iniciante', 'Bronze', 'Prata', 'Ouro', 'Platina'];
const nextLevelPoints = [500, 1500, 3000, 5000];

export default function FidelityCard({ clientName, clientPhone, totalPoints, currentLevel, tier, cardNumber, servicesCompleted, logoUrl, shopName = 'Cristal Care', instagram, facebook, website }: FidelityCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const colors = tierColors[tier];

  useEffect(() => {
    QRCode.toDataURL(cardNumber).then(url => setQrCodeUrl(url));
  }, [cardNumber]);

  const nextThreshold = nextLevelPoints[currentLevel - 1] || 5000;
  const progressPercent = (totalPoints / nextThreshold) * 100;

  const handleDownloadWallet = () => {
    // Simula download de cartão para wallet
    console.log('Downloading wallet pass for:', clientName);
    alert('Cartão adicionado ao seu Wallet! 📱');
  };

  const handleShare = () => {
    const text = `Meu cartão de fidelidade Cristal Care: ${cardNumber}\nPontos: ${totalPoints}\nNível: ${levelNames[currentLevel]}`;
    if (navigator.share) {
      navigator.share({ title: 'Meu Cartão de Fidelidade', text }).catch(() => {
        // Ignorar erro se usuário cancelar
        navigator.clipboard.writeText(text);
      });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Main Card - 3D Effect */}
      <div className={`relative h-64 rounded-3xl bg-gradient-to-br ${colors.bg} p-8 text-white shadow-2xl transform hover:scale-105 transition-transform duration-300 overflow-hidden group`}>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Top Section - Logo + Shop Name */}
          <div className="flex items-center gap-3 mb-2">
            {logoUrl && <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full bg-white/20" />}
            <div>
              <p className="text-xs font-bold opacity-75 uppercase tracking-widest">{shopName}</p>
              <p className="text-2xl font-bold">{levelNames[currentLevel]}</p>
            </div>
          </div>

          {/* Center - Points */}
          <div className="text-center">
            <p className="text-5xl font-bold">{totalPoints}</p>
            <p className="text-sm opacity-90 mt-1">Pontos Disponíveis</p>
          </div>

          {/* Bottom - Card Details */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs opacity-75">Titular do Cartão</p>
              <p className="font-bold text-lg">{clientName.split(' ')[0]}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">Número</p>
              <p className="font-mono text-sm font-bold">{cardNumber.slice(-4)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`${colors.light} rounded-xl p-4 border border-slate-200 dark:border-slate-700`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-bold ${colors.text}`}>Progresso para Próximo Nível</span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-white dark:bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
          <div 
            className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-500`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          {nextThreshold - totalPoints} pontos faltam para {levelNames[Math.min(currentLevel + 1, 4)]}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{servicesCompleted}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Serviços</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentLevel}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Nível</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{Math.floor(totalPoints / 100)}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Descontos</p>
        </div>
      </div>

      {/* QR Code */}
      {showQR && qrCodeUrl && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
          <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 mx-auto mb-2" />
          <p className="text-xs text-slate-600 dark:text-slate-400">Escaneie para validar pontos</p>
        </div>
      )}

      {/* Social Networks */}
      {(instagram || facebook || website) && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase">Siga-nos</p>
          <div className="flex gap-3 flex-wrap">
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">
                🌐 Website
              </a>
            )}
            {instagram && (
              <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded transition">
                📸 Instagram
              </a>
            )}
            {facebook && (
              <a href={`https://facebook.com/${facebook}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition">
                👍 Facebook
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadWallet}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Adicionar ao Wallet
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
        <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-2">✨ Benefícios do {levelNames[currentLevel]}</h4>
        <ul className="text-sm text-emerald-800 dark:text-emerald-300 space-y-1">
          {currentLevel >= 1 && <li>✓ 5% desconto em todos os serviços</li>}
          {currentLevel >= 2 && <li>✓ 10% desconto + Frete grátis</li>}
          {currentLevel >= 3 && <li>✓ 15% desconto + Atendimento prioritário</li>}
          {currentLevel >= 4 && <li>✓ 20% desconto + Brinde exclusivo</li>}
        </ul>
      </div>
    </div>
  );
}
