import { createClient } from "@supabase/supabase-js";

// External CRM Project (Remix of Cashflow Connect)
// Project ID: 8e3214a3-ce1d-4e44-a43c-e570321daa47
const SUPABASE_URL = "https://vtdnthphxnrwdbslntlw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZG50aHBoeG5yd2Ric2xudGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTA4NDIsImV4cCI6MjA5NDQ2Njg0Mn0.NRZ5TWcXMWfVHr69g2idlsOCE-2BxF7ENs6hmGTA2Gg";

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
