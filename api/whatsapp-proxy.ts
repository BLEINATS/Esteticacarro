export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract credentials from body (sent by frontend)
    // This supports "Pass-Through Authentication" for testing credentials in UI
    const { endpoint, method = 'GET', body, instanceId, token, baseUrl } = await req.json();

    // Prioritize UI credentials, fallback to ENV
    const INSTANCE_ID = instanceId || process.env.WAPI_INSTANCE_ID;
    const TOKEN = token || process.env.WAPI_TOKEN;
    const BASE_URL = baseUrl || 'https://api.w-api.io';

    if (!INSTANCE_ID || !TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Credenciais não fornecidas. Configure no painel ou variáveis de ambiente.' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure endpoint format
    const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${safeEndpoint}/${INSTANCE_ID}`;

    // Call Upstream W-API
    const upstreamResponse = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await upstreamResponse.text();

    // Return response exactly as received (status code + body)
    return new Response(text, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno no Proxy' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
