import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, Trash2, Save, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type DialogType = 'info' | 'success' | 'warning' | 'danger';

interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  showAlert: (options: DialogOptions) => Promise<void>;
  showConfirm: (options: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ title: '', message: '' });
  const [isConfirmation, setIsConfirmation] = useState(false);
  
  // Refs para guardar as funções resolve da Promise
  const resolveRef = useRef<((value: boolean | void | PromiseLike<boolean | void>) => void) | null>(null);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false); // Resolve como false se fechar sem confirmar
      resolveRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const showAlert = useCallback((opts: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setOptions({ ...opts, type: opts.type || 'info' });
      setIsConfirmation(false);
      resolveRef.current = resolve as any;
      setIsOpen(true);
    });
  }, []);

  const showConfirm = useCallback((opts: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({ ...opts, type: opts.type || 'warning' });
      setIsConfirmation(true);
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  // Ícones e Cores baseados no tipo
  const getIcon = () => {
    switch (options.type) {
      case 'success': return <CheckCircle2 size={48} className="text-green-500" />;
      case 'danger': return <Trash2 size={48} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={48} className="text-amber-500" />;
      case 'info': default: return <Info size={48} className="text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (options.type) {
      case 'success': return 'bg-green-600 hover:bg-green-700';
      case 'danger': return 'bg-red-600 hover:bg-red-700';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700';
      case 'info': default: return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* O DIÁLOGO GLOBAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className={cn("p-4 rounded-full bg-slate-50 dark:bg-slate-800 ring-8 ring-slate-50 dark:ring-slate-800/50")}>
                  {getIcon()}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {options.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                {options.message}
              </p>

              <div className="flex gap-3 justify-center">
                {isConfirmation && (
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {options.cancelText || 'Cancelar'}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={cn(
                    "flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95",
                    getButtonColor(),
                    !isConfirmation && "w-full"
                  )}
                >
                  {options.confirmText || (isConfirmation ? 'Confirmar' : 'OK')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
