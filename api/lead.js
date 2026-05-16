// Vercel serverless function — proxies form submissions to GoHighLevel.
// Why this exists: the browser can't reliably POST JSON cross-origin to GHL
// (CORS preflight issues). The form on the website POSTs to /api/lead (same
// origin, no CORS), and this function relays the body to GHL server-side.

const GHL_WEBHOOK_URL =
  'https://services.leadconnectorhq.com/hooks/5VC5Crt63oAfFwA1RTHp/webhook-trigger/938c131b-d8f5-4da2-8a42-5f5fd4f6d060';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // CORS — allow our own domains (and momentumarketing preview)
  const allowedOrigins = [
    'https://ajcommercialgroup.com',
    'https://www.ajcommercialgroup.com',
    'https://ajcg.momentumarketing.io',
    'https://ajcg-demo.vercel.app',
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');

  // Vercel auto-parses JSON bodies when Content-Type is application/json
  const body = req.body || {};

  // Enrich with server-side metadata
  const enriched = {
    ...body,
    server_received_at: new Date().toISOString(),
    server_ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null,
    user_agent: req.headers['user-agent'] || null,
  };

  try {
    const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    });

    if (!ghlResponse.ok) {
      console.error('GHL responded non-2xx:', ghlResponse.status, await ghlResponse.text().catch(() => ''));
      return res.status(502).json({ ok: false, error: 'ghl_upstream', status: ghlResponse.status });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to relay to GHL:', err);
    return res.status(500).json({ ok: false, error: 'relay_failed' });
  }
}
