import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, params } = await req.json()

    // Look up the SerpApi key from the DB for this user (RLS-scoped)
    const { data: cfg, error: cfgError } = await supabase
      .from('serpapi_config')
      .select('api_key')
      .eq('user_id', user.id)
      .maybeSingle()

    if (cfgError) {
      console.error('Error loading serpapi_config:', cfgError)
      return new Response(JSON.stringify({ error: 'Failed to load API key configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = cfg?.api_key
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'SerpApi Key not configured. Please save it in your settings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let url = ''
    if (action === 'search') {
      const { q, location } = params
      url = `https://serpapi.com/search?engine=google_maps&q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&type=search&z=13&api_key=${apiKey}`
    } else {
      throw new Error('Invalid action')
    }

    console.log(`Proxying request to SerpApi for query: ${params.q}`)
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      console.error(`SerpApi Error:`, data.error)
      throw new Error(data.error)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`Proxy Error: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
