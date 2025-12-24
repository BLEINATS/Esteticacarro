import React from 'react';
import { cn } from '../../lib/utils';

interface LicensePlateProps {
  plate: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LicensePlate({ plate, className, size = 'md' }: LicensePlateProps) {
  const sizeClasses = {
    sm: 'w-20 border',
    md: 'w-28 border-2',
    lg: 'w-36 border-2'
  };

  const headerHeight = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5'
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const logoSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5'
  };

  return (
    <div className={cn(
        "relative inline-flex flex-col rounded bg-white shadow-sm overflow-hidden select-none border-slate-900 box-border", 
        sizeClasses[size],
        className
    )}>
      {/* Top Bar (Blue) */}
      <div className={cn("bg-[#003399] w-full flex items-center justify-between px-1.5", headerHeight[size])}>
        <span className="text-[5px] sm:text-[6px] font-bold text-white tracking-widest">BRASIL</span>
        {/* Mercosul Logo Simulation */}
        <div className={cn("rounded-full border border-white/50 flex items-center justify-center", logoSize[size])}>
            <div className="w-[60%] h-[60%] bg-white/80 rounded-full"></div>
        </div>
      </div>
      
      {/* Plate Number */}
      <div className="flex-1 flex items-center justify-center bg-white py-0.5">
        <span className={cn("font-mono font-bold text-slate-900 tracking-widest uppercase leading-none", textSize[size])}>
            {plate || 'ABC1D23'}
        </span>
      </div>
    </div>
  );
}
