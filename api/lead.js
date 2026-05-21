// Vercel serverless function — proxies form submissions to GoHighLevel.
// Why this exists: the browser can't reliably POST JSON cross-origin to GHL
// (CORS preflight issues). The form on the website POSTs to /api/lead (same
// origin, no CORS), and this function relays the body to GHL server-side.
//
// Bot protection:
//   1. Honeypot field "website_url" — invisible to humans, auto-filled by bots.
//      Any non-empty value silently drops the submission.
//   2. Minimum-time check — submissions in under 2 seconds from page load are
//      treated as bots and silently dropped.
//   In both cases we return 200 OK so the bot believes it succeeded and stops
//   retrying. The submission never reaches GoHighLevel.

const GHL_WEBHOOK_URL =
  'https://services.leadconnectorhq.com/hooks/5VC5Crt63oAfFwA1RTHp/webhook-trigger/938c131b-d8f5-4da2-8a42-5f5fd4f6d060';

const MIN_FORM_FILL_MS = 2000; // shorter than this = bot

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

  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;
  const userAgent = req.headers['user-agent'] || null;

  // -----------------------------------------------------------
  // Bot check #1: Honeypot
  // -----------------------------------------------------------
  // "website_url" is a hidden field that real users never see (CSS off-screen).
  // Bots auto-fill every input they find. If this has any value -> bot.
  if (body.website_url && String(body.website_url).trim().length > 0) {
    console.log('[bot drop] honeypot triggered', { ip: clientIp, ua: userAgent, form: body.form_type });
    return res.status(200).json({ ok: true }); // fake success so bot stops retrying
  }

  // -----------------------------------------------------------
  // Bot check #2: Minimum time on page
  // -----------------------------------------------------------
  // form-handler.js stamps __form_loaded_at as a millisecond timestamp when
  // the form loads. If a submission arrives in under 2 seconds, it's a bot.
  const loadedAt = parseInt(body.__form_loaded_at, 10);
  if (loadedAt && Number.isFinite(loadedAt)) {
    const elapsed = Date.now() - loadedAt;
    if (elapsed < MIN_FORM_FILL_MS) {
      console.log('[bot drop] time check failed', { ip: clientIp, ua: userAgent, form: body.form_type, elapsed });
      return res.status(200).json({ ok: true });
    }
  }

  // -----------------------------------------------------------
  // Strip bot-protection fields so they don't end up in GHL as junk fields
  // -----------------------------------------------------------
  const { website_url, __form_loaded_at, ...cleanBody } = body;

  // Enrich with server-side metadata
  const enriched = {
    ...cleanBody,
    server_received_at: new Date().toISOString(),
    server_ip: clientIp,
    user_agent: userAgent,
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
