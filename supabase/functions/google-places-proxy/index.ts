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
      throw new Error('Google Places API Key is required')
    }

    let url = ''
    if (action === 'geocode') {
      const { address } = params
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    } else if (action === 'nearbysearch') {
      const { location, keyword } = params
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=5000&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`
    } else if (action === 'placedetails') {
      const { placeId } = params
      url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,opening_hours,formatted_address,rating,user_ratings_total&key=${apiKey}`
    } else {
      throw new Error('Invalid action')
    }

    console.log(`Proxying request for action: ${action}`)
    const response = await fetch(url)
    const data = await response.json()

    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`Google API Error: ${data.status}`, data.error_message)
      throw new Error(data.error_message || `Google API Error: ${data.status}`)
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

