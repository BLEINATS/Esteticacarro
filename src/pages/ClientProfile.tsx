import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Download, Share2, QrCode } from 'lucide-react';
import FidelityCard from '../components/FidelityCard';

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, getClientPoints, getFidelityCard, companySettings } = useApp();
  const client = clients.find(c => c.id === clientId);
  const points = getClientPoints(clientId || '');

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Cliente não encontrado</p>
      </div>
    );
  }

  const handleDownloadWallet = () => alert('Cartão adicionado ao Wallet!');
  const handleShare = () => alert('Compartilhado com sucesso!');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Cartão de Fidelidade
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {client.name}
          </p>
        </div>

        {/* Fidelity Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 mb-8">
          <FidelityCard
            clientName={client.name}
            clientPhone={client.phone}
            totalPoints={points?.totalPoints || 0}
            currentLevel={points?.currentLevel || 1}
            tier={points?.tier || 'bronze'}
            cardNumber={getFidelityCard(client.id)?.cardNumber || 'CC00000000'}
            servicesCompleted={points?.servicesCompleted || 0}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleDownloadWallet}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg"
          >
            <Download size={20} /> Download PKPass
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-lg"
          >
            <Share2 size={20} /> Compartilhar
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-4">📋 Histórico de Pontos</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {points?.pointsHistory && points.pointsHistory.length > 0 ? (
              points.pointsHistory.map(entry => (
                <div key={entry.id} className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
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
      </div>
    </div>
  );
}
