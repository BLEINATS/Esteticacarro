import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

// CORREÇÃO: Função para exibir datas YYYY-MM-DD corretamente no fuso local
export function displayDate(dateStr: string) {
  if (!dateStr) return '-';
  
  // Se for formato ISO completo (com hora), usa o Date normal
  if (dateStr.includes('T')) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  // Se for apenas YYYY-MM-DD, forçamos a interpretação como meio-dia local para evitar shift de fuso
  // Ou criamos a data manualmente partes por partes
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Meses em JS são 0-11
    const day = parseInt(parts[2]);
    return new Date(year, month, day).toLocaleDateString('pt-BR');
  }

  return new Date(dateStr).toLocaleDateString('pt-BR');
}

// CORREÇÃO: Função para extrair YYYY-MM-DD local de uma data ISO (para inputs de edição)
export function formatDateToLocalInput(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
