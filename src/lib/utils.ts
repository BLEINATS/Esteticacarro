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

// NOVO: Formatador de ID de OS (Padrão: #8CHARS)
export function formatId(id: string) {
  if (!id) return '';
  // Pega os primeiros 8 caracteres e coloca em maiúsculo
  return id.length > 8 ? `#${id.substring(0, 8).toUpperCase()}` : `#${id.toUpperCase()}`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function displayDate(dateStr: string) {
  if (!dateStr) return '-';
  if (dateStr.includes('T')) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(year, month, day).toLocaleDateString('pt-BR');
  }
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatDateToLocalInput(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000, errorMessage = 'A requisição demorou muito para responder.'): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).then((result) => {
    clearTimeout(timeoutHandle);
    return result;
  }).catch((error) => {
    clearTimeout(timeoutHandle);
    throw error;
  });
}
