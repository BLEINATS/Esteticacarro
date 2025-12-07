import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
            </p>
            
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-left mb-6 overflow-auto max-h-32">
              <code className="text-xs text-red-500 font-mono">
                {this.state.error?.message || 'Erro desconhecido'}
              </code>
            </div>

            <div className="space-y-3">
              <button 
                onClick={this.handleReload}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Recarregar Página
              </button>
              
              <button 
                onClick={this.handleReset}
                className="w-full py-3 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Limpar Dados e Reiniciar
              </button>
              <p className="text-[10px] text-slate-400 mt-2">
                * "Limpar Dados" apagará as informações salvas no navegador se o erro persistir.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
