// Este arquivo agora é apenas um placeholder para evitar quebras de importação
// A funcionalidade real foi movida para src/lib/db.ts usando localStorage

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: { message: "Use o novo sistema de login" } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null } }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ error: null }) }),
    delete: () => ({ eq: () => ({ error: null }) }),
  })
};

export const checkSupabaseConnection = async () => {
  return true; // Sempre retorna true no modo mock
};
