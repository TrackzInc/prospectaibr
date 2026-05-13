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

    const now = new Date().toISOString();

    // 1. Get pending schedules that are active
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

      // 2. Logic to start the campaign or send messages
      // This part depends on how your campaigns are triggered. 
      // Typically, you'd call the Evolution API here for each lead in the campaign.
      
      // For now, let's mark it as run and update next_run_at if recurrence exists
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
