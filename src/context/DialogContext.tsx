import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, Trash2, Save, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type DialogType = 'info' | 'success' | 'warning' | 'danger' | 'question';

interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

interface OptionDialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  options: {
    label: string;
    value: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  }[];
  cancelable?: boolean;
}

interface DialogContextType {
  showAlert: (options: DialogOptions) => Promise<void>;
  showConfirm: (options: DialogOptions) => Promise<boolean>;
  showOptions: (options: OptionDialogOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    mode: 'alert' | 'confirm' | 'options';
    title: string;
    message: string;
    type: DialogType;
    confirmText?: string;
    cancelText?: string;
    options?: { label: string; value: string; variant?: string }[];
  }>({ mode: 'alert', title: '', message: '', type: 'info' });
  
  const resolveRef = useRef<((value: any) => void) | null>(null);

  const handleClose = useCallback((result: any) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  const showAlert = useCallback((opts: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setDialogConfig({ 
        mode: 'alert', 
        title: opts.title, 
        message: opts.message, 
        type: opts.type || 'info',
        confirmText: 'OK'
      });
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const showConfirm = useCallback((opts: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogConfig({ 
        mode: 'confirm', 
        title: opts.title, 
        message: opts.message, 
        type: opts.type || 'warning',
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar'
      });
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const showOptions = useCallback((opts: OptionDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogConfig({
        mode: 'options',
        title: opts.title,
        message: opts.message,
        type: opts.type || 'question',
        options: opts.options
      });
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const getIcon = () => {
    switch (dialogConfig.type) {
      case 'success': return <CheckCircle2 size={48} className="text-green-500" />;
      case 'danger': return <Trash2 size={48} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={48} className="text-amber-500" />;
      case 'question': return <HelpCircle size={48} className="text-purple-500" />;
      case 'info': default: return <Info size={48} className="text-blue-500" />;
    }
  };

  const getButtonClass = (variant: string = 'primary') => {
    switch (variant) {
      case 'primary': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary': return 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600';
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'outline': return 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
      default: return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showOptions }}>
      {children}
      
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
                {dialogConfig.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 mb-8 whitespace-pre-wrap">
                {dialogConfig.message}
              </p>

              <div className={cn("flex gap-3 justify-center", dialogConfig.mode === 'options' ? "flex-col sm:flex-row" : "")}>
                {dialogConfig.mode === 'alert' && (
                  <button
                    onClick={() => handleClose(undefined)}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    {dialogConfig.confirmText}
                  </button>
                )}

                {dialogConfig.mode === 'confirm' && (
                  <>
                    <button
                      onClick={() => handleClose(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {dialogConfig.cancelText}
                    </button>
                    <button
                      onClick={() => handleClose(true)}
                      className={cn(
                        "flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95",
                        dialogConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                      )}
                    >
                      {dialogConfig.confirmText}
                    </button>
                  </>
                )}

                {dialogConfig.mode === 'options' && (
                  <div className="flex flex-col gap-2 w-full">
                    {dialogConfig.options?.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleClose(opt.value)}
                        className={cn(
                          "w-full px-4 py-3 font-bold rounded-xl transition-all active:scale-95",
                          getButtonClass(opt.variant)
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleClose(null)}
                      className="w-full px-4 py-2 text-slate-500 dark:text-slate-400 font-medium text-sm hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
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
