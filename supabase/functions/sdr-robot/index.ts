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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // This function would be triggered by a webhook from Evolution API
    // When a lead responds
    const body = await req.json();
    const { lead_id, message, user_id } = body;

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
    // In a real implementation: fetch('https://api.anthropic.com/v1/messages', ...)

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

    // 4. Send via Evolution API
    // Similar to sendMessage logic in frontend

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
