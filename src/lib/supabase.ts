import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Credenciais do projeto Supabase
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação simples para evitar uso de placeholders inválidos do .env.example
const isValidUrl = (url: string | undefined) => url && url.startsWith('http');
const isValidKey = (key: string | undefined) => key && key.length > 20 && !key.startsWith('YOUR_');

// Usa as variáveis de ambiente se válidas, senão usa o fallback hardcoded (Projeto Supabase do usuário)
const supabaseUrl = isValidUrl(envUrl) ? envUrl : "https://bgsrkyzlbiyvzjhimdcd.supabase.co";
const supabaseAnonKey = isValidKey(envKey) ? envKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnc3JreXpsYml5dnpqaGltZGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjk1MzIsImV4cCI6MjA4MDcwNTUzMn0.TssnRLgLTPMB6jWruBgdq71ylU6vGncDbkB5N13_Ys4";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Função para verificar status da conexão
export const checkSupabaseConnection = async () => {
  try {
    // Timeout promise - Aumentado para 10s para conexões lentas
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
    
    // Tenta uma query simples com timeout
    const { error } = await Promise.race([
        supabase.from('tenants').select('count', { count: 'exact', head: true }),
        timeout
    ]) as any;
    
    if (!error) return true;
    
    // Lista de códigos que indicam que o servidor respondeu, mesmo que com erro de acesso
    const serverRespondedCodes = ['PGRST301', '401', '403', 'PGRST116'];
    
    if (serverRespondedCodes.includes(error.code) || (error.message && error.message.includes('permission denied'))) {
        return true;
    }

    console.error("Supabase connection check failed:", error);
    return false;
  } catch (e) {
    // Otimista: Se der timeout, assume que a conexão está lenta mas existe, permitindo o login tentar
    console.warn("Supabase connection check timed out (assuming slow connection):", e);
    return true;
  }
};
