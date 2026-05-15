/* ============================================================
 * AJ Commercial Group · Momentum Build
 * Form handler with GoHighLevel webhook integration
 * ============================================================
 *
 * SETUP IN GOHIGHLEVEL:
 *   1. In GHL, create a Workflow → trigger: "Inbound Webhook"
 *   2. Copy the webhook URL it generates
 *   3. Paste it into GHL_WEBHOOK_URL below
 *   4. (Optional) Add hidden custom fields in your GHL CRM that
 *      match the form_type values below — that way every form
 *      can route to a different pipeline / tag / sequence.
 *
 * Forms post JSON with these keys:
 *   - form_type     (quick_valuation | buying | selling | exchange_1031 | contact)
 *   - first_name, last_name, email, phone
 *   - all named form fields
 *   - source        ("ajcommercialgroup.com")
 *   - submitted_at  (ISO timestamp)
 *   - utm_source, utm_medium, utm_campaign, utm_content (auto-captured from URL)
 *   - referrer      (document.referrer)
 *   - page_url
 * ============================================================ */

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/5VC5Crt63oAfFwA1RTHp/webhook-trigger/938c131b-d8f5-4da2-8a42-5f5fd4f6d060';

(function () {
  // Capture UTM params on page load
  const params = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || ''
  };

  function showStatus(form, message, isError) {
    let status = form.querySelector('.form-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'form-status';
      form.appendChild(status);
    }
    status.textContent = message;
    status.style.cssText = 'margin-top: 18px; padding: 14px 18px; border-radius: 6px; font-size: 14px; font-weight: 500; line-height: 1.5;' +
      (isError
        ? 'background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;'
        : 'background: #DCFCE7; color: #14532D; border: 1px solid #86EFAC;');
  }

  function serializeForm(form) {
    const data = {};
    const fd = new FormData(form);
    // Grab single-value fields
    fd.forEach((value, key) => {
      if (data[key]) {
        // multi-value field (e.g. checkboxes with same name)
        if (Array.isArray(data[key])) data[key].push(value);
        else data[key] = [data[key], value];
      } else {
        data[key] = value;
      }
    });
    // Split single 'full_name' or 'name' field into first_name + last_name for GHL.
    // Forms collect a single name field, but GHL's Create Contact wants first/last separately.
    const rawName = (data.full_name || data.name || '').toString().trim();
    if (rawName) {
      const parts = rawName.split(/\s+/);
      data.first_name = parts.slice(0, -1).join(' ') || parts[0];
      data.last_name  = parts.length > 1 ? parts[parts.length - 1] : '';
      data.name = rawName;        // keep canonical 'name' for SMS/email templates
      data.full_name = rawName;
    }
    // Add metadata
    data.form_type = form.dataset.formType || 'unknown';
    data.source = 'ajcommercialgroup.com';
    data.submitted_at = new Date().toISOString();
    data.page_url = window.location.href;
    data.referrer = document.referrer || '';
    Object.assign(data, utm);
    return data;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"], .form-submit');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    const data = serializeForm(form);
    console.log('[AJCG form] Submitting to GHL:', data);

    // POST to GoHighLevel webhook using sendBeacon when possible.
    // sendBeacon is specifically designed for fire-and-forget POSTs to a different
    // origin — no CORS preflight, content-type is set via the Blob's mime type,
    // and the browser handles delivery reliably even on page unload. This is the
    // most reliable way to ship a JSON payload to a webhook from a browser form.
    const payload = JSON.stringify(data);
    let delivered = false;
    // Use text/plain Blob so the request is a "simple" CORS request — no preflight OPTIONS.
    // GHL's webhook auto-detects the JSON body regardless of the declared Content-Type.
    if (typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'text/plain' });
        delivered = navigator.sendBeacon(GHL_WEBHOOK_URL, blob);
        console.log('[AJCG form] sendBeacon delivered:', delivered);
      } catch (e) {
        console.warn('[AJCG form] sendBeacon threw:', e);
      }
    }
    // Fallback: fetch in no-cors mode without setting Content-Type so it stays a simple request
    if (!delivered) {
      try {
        fetch(GHL_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: payload,
          keepalive: true,
        }).catch(() => {});
        console.log('[AJCG form] fallback fetch fired (no-cors, text/plain default)');
      } catch (e) {
        console.warn('[AJCG form] fallback fetch failed:', e);
      }
    }
    // Always show success to the user — beacon/fetch fired, GHL receives async.
    setTimeout(() => {
      showStatus(form, 'Thanks — we got it. A real broker will reach out within one business day.', false);
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }, 250);
  }

  function init() {
    document.querySelectorAll('form[data-ghl="true"]').forEach((form) => {
      form.addEventListener('submit', handleSubmit);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
