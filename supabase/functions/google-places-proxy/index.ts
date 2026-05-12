import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, apiKey, params } = await req.json()

    if (!apiKey) {
      throw new Error('SerpApi Key is required')
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
