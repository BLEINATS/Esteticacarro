import React from 'react';
import { Package, AlertTriangle, Search, Plus, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Inventory() {
  const { inventory } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Estoque</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão de insumos com baixa automática via OS.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={18} />
          Novo Item
        </button>
      </div>

      {/* AI Insights / Alerts */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <Info className="text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Inteligência de Estoque</h4>
          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
            O sistema detectou um alto consumo de <strong>Verniz Alto Sólidos</strong> nesta semana. 
            Considere antecipar a compra para evitar paradas na Funilaria.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar item..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Item</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Categoria</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Quantidade</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                    <Package size={18} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  {item.name}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{item.stock} {item.unit}</td>
                <td className="px-6 py-4">
                  {item.status === 'critical' && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs font-bold w-fit">
                      <AlertTriangle size={12} /> Crítico
                    </span>
                  )}
                  {item.status === 'warning' && (
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full text-xs font-bold w-fit">
                      Atenção
                    </span>
                  )}
                  {item.status === 'ok' && (
                    <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs font-bold w-fit">
                      Normal
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
