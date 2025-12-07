import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // Tipagem gerada automaticamente

// Estas variáveis devem ser definidas no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL ou Key não encontrados. O sistema funcionará em modo offline (mock).');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Função auxiliar para verificar conexão
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('tenants').select('count').single();
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
};
