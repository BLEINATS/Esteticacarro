import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key not found in environment variables.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
    return !error;
  } catch (e) {
    return false;
  }
};
