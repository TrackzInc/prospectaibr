import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication - reject unauthenticated callers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { lead_id, message } = body;
    // Use authenticated user id, NEVER trust user_id from request body
    const user_id = user.id;

    // 1. Get Robot Config
    const { data: config } = await supabaseClient
      .from('robot_config')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!config || !config.is_active) {
      return new Response(JSON.stringify({ status: 'inactive' }), { headers: corsHeaders });
    }

    // 2. Call Claude API (Simplified representation)
    const systemPrompt = `Você é ${config.assistant_name}. Seu objetivo é ${config.objective}. 
    Contexto: ${config.business_context}. 
    Instruções: ${config.specific_instructions}.
    Responda de forma natural, curta e direta via WhatsApp.`;

    const claudeResponse = "Olá! Vi seu interesse e gostaria de agendar uma conversa rápida. Qual o melhor horário para você?"; 

    // 3. Save Log
    await supabaseClient
      .from('robot_logs')
      .insert({
        user_id,
        lead_id,
        received_message: message,
        sent_response: claudeResponse,
        status: 'automatic'
      });

    return new Response(
      JSON.stringify({ response: claudeResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
