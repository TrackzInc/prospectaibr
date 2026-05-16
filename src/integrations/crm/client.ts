import { createClient } from "@supabase/supabase-js";

// External CRM Project (Remix of Cashflow Connect)
// Project ID: 8e3214a3-ce1d-4e44-a43c-e570321daa47
const SUPABASE_URL = "https://xqavudmwsnuzzcgetzkb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "SUPABASE_PUBLISHABLE_KEY"; // To be replaced or configured by user if needed, but using the one from the project info

export const crmSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});

// Helper to check if connected
export const isCRMConnected = async () => {
  const { data: { session } } = await crmSupabase.auth.getSession();
  return !!session;
};
