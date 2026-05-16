import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require shared cron secret - this endpoint is server-to-server only
    const cronSecret = Deno.env.get('CRON_SECRET');
    const provided = req.headers.get('x-cron-secret');
    if (!cronSecret || provided !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();

    const { data: pendingSchedules, error: fetchError } = await supabaseClient
      .from('schedules')
      .select(`
        *,
        campaigns (*)
      `)
      .eq('is_active', true)
      .lte('next_run_at', now);

    if (fetchError) throw fetchError;

    const results = [];

    for (const schedule of pendingSchedules || []) {
      const campaign = schedule.campaigns;
      if (!campaign) continue;

      console.log(`Processing schedule: ${schedule.name} for campaign: ${campaign.name}`);

      let nextRun = null;
      if (schedule.recurrence === 'daily') {
        const d = new Date(schedule.next_run_at);
        d.setDate(d.getDate() + 1);
        nextRun = d.toISOString();
      } else if (schedule.recurrence === 'weekly') {
        const d = new Date(schedule.next_run_at);
        d.setDate(d.getDate() + 7);
        nextRun = d.toISOString();
      } else if (schedule.recurrence === 'monthly') {
        const d = new Date(schedule.next_run_at);
        d.setMonth(d.getMonth() + 1);
        nextRun = d.toISOString();
      }

      const { error: updateError } = await supabaseClient
        .from('schedules')
        .update({
          last_run_at: now,
          next_run_at: nextRun,
          is_active: nextRun !== null
        })
        .eq('id', schedule.id);

      if (updateError) console.error(`Error updating schedule ${schedule.id}:`, updateError);
      
      results.push({ id: schedule.id, status: 'processed' });
    }

    return new Response(
      JSON.stringify({ processed: results.length, details: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
