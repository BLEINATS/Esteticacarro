import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key not found in environment variables.');
}

// Fix: Provide placeholders to prevent createClient from throwing an error with empty strings
// This allows the app to load in "offline mode" using IndexedDB if env vars are missing
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

export const checkSupabaseConnection = async () => {
  try {
    // Simple check to see if we can reach the server
    const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
    return !error;
  } catch (e) {
    return false;
  }
};
