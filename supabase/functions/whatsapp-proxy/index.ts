import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, method, body, config } = await req.json()
    
    if (!config || !config.baseUrl || !config.apiKey) {
        throw new Error('Configuração ausente no corpo da requisição')
    }

    const baseUrl = config.baseUrl.replace(/\/$/, '')
    const url = `${baseUrl}${endpoint}`

    console.log(`Proxying ${method} request to: ${url}`)

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    const fetchOptions: RequestInit = {
        method: method || 'GET',
        headers: headers
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(url, fetchOptions)
    const responseText = await response.text()
    
    let responseData
    try {
        responseData = JSON.parse(responseText)
    } catch (e) {
        responseData = { error: 'Invalid JSON response', raw: responseText }
    }

    return new Response(
      JSON.stringify({ 
          status: response.status,
          ok: response.ok,
          data: responseData 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
