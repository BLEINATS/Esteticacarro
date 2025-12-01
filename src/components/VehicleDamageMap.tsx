import React from 'react';
import { cn } from '../lib/utils';
import { AlertCircle, Camera } from 'lucide-react';
import { DamagePoint } from '../types';

interface VehicleDamageMapProps {
  damages: DamagePoint[];
  onAddDamage: (area: DamagePoint['area']) => void;
  readOnly?: boolean;
}

export default function VehicleDamageMap({ damages, onAddDamage, readOnly = false }: VehicleDamageMapProps) {
  
  const areas: { id: DamagePoint['area']; label: string; style: string }[] = [
    { id: 'frente', label: 'Frente / Capô', style: 'top-0 left-1/2 -translate-x-1/2 w-1/3 h-1/5 rounded-t-3xl' },
    { id: 'traseira', label: 'Traseira / Porta-malas', style: 'bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1/5 rounded-b-3xl' },
    { id: 'teto', label: 'Teto', style: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-lg' },
    { id: 'lateral_esq', label: 'Lateral Esq.', style: 'left-0 top-1/2 -translate-y-1/2 w-1/4 h-3/4 rounded-l-2xl' },
    { id: 'lateral_dir', label: 'Lateral Dir.', style: 'right-0 top-1/2 -translate-y-1/2 w-1/4 h-3/4 rounded-r-2xl' },
  ];

  const getDamagesInArea = (area: string) => damages.filter(d => d.area === area);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl border-4 border-slate-300 dark:border-slate-700 shadow-inner my-4">
        {/* Car Outline Simulation */}
        
        {areas.map((area) => {
          const areaDamages = getDamagesInArea(area.id);
          const hasDamage = areaDamages.length > 0;

          return (
            <button
              key={area.id}
              disabled={readOnly}
              onClick={() => onAddDamage(area.id)}
              className={cn(
                "absolute border-2 transition-all flex items-center justify-center flex-col gap-1",
                area.style,
                hasDamage 
                  ? "bg-red-100 border-red-500 dark:bg-red-900/40 dark:border-red-500 z-20" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 z-10"
              )}
            >
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center leading-tight px-1">
                {area.label}
              </span>
              {hasDamage && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {areaDamages.length}
                </span>
              )}
            </button>
          );
        })}

        {/* Wheels */}
        <div className="absolute top-[15%] -left-2 w-4 h-12 bg-slate-800 rounded-l-md" />
        <div className="absolute top-[15%] -right-2 w-4 h-12 bg-slate-800 rounded-r-md" />
        <div className="absolute bottom-[15%] -left-2 w-4 h-12 bg-slate-800 rounded-l-md" />
        <div className="absolute bottom-[15%] -right-2 w-4 h-12 bg-slate-800 rounded-r-md" />
      </div>

      <div className="w-full mt-4 space-y-2">
        {damages.map((damage, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{damage?.area?.replace('_', ' ') || 'Área desconhecida'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{damage.type} - {damage.description}</p>
              </div>
            </div>
            {damage.photoUrl ? (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Camera size={12} /> Foto OK
              </span>
            ) : (
              <button className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700">
                <Camera size={12} /> Add Foto
              </button>
            )}
          </div>
        ))}
        {damages.length === 0 && (
          <p className="text-center text-sm text-slate-400 italic py-2">Nenhuma avaria registrada.</p>
        )}
      </div>
    </div>
  );
}
