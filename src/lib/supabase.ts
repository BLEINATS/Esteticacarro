import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Fallback para garantir que funcione mesmo se o .env não carregar no WebContainer
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bgsrkyzlbiyvzjhimdcd.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnc3JreXpsYml5dnpqaGltZGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjk1MzIsImV4cCI6MjA4MDcwNTUzMn0.TssnRLgLTPMB6jWruBgdq71ylU6vGncDbkB5N13_Ys4";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Função para verificar status da conexão
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
    return !error;
  } catch (e) {
    return false;
  }
};
