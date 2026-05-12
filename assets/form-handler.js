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

    // POST to GoHighLevel webhook
    fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors', // GHL webhooks accept this without CORS preflight
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(() => {
        showStatus(form, 'Thanks — we got it. A real broker will reach out within one business day.', false);
        form.reset();
      })
      .catch((err) => {
        console.warn('Form submission error:', err);
        showStatus(form, 'Something went wrong. Please call (630) 895-7989 or email contact@ajcommercialgroup.com.', true);
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
  }

  function init() {
    document.querySelectorAll('form[data-ghl="true"]').forEach((form) => {
      form.addEventListener('submit', handleSubmit);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
