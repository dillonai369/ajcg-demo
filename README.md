# AJ Commercial Group — Momentum Demo Build

Static preview site for AJ Commercial Group, designed and built by Momentum.
Deployed at: `ajcg.momentumarketing.io`

## What's in this folder

- `index.html` — homepage (hero video, stats, recently sold, founders, services, culture, insights, CTA)
- `our-team.html`, `recently-sold.html`, `blog.html`, `buying.html`, `selling.html`, `exchange-1031.html`, `contact.html`, `careers.html` — main pages
- `property-*.html` — 14 individual property detail pages mirroring AJCG's actual sold listings
- `styles.css` — shared design system
- `assets/` — logo, video, team / city / creatives photos, form-handler.js
- `vercel.json` — deployment config (clean URLs, caching, security headers)
- `robots.txt` — blocks search engine indexing of this demo

## Local preview

Open `index.html` directly in any modern browser. No build step required.

## Deploy to Vercel

### One-time setup

1. Push this folder to a new GitHub repo:
   ```bash
   cd "/Users/dillai/Documents/Claude/Projects/AJcommercial"
   git init
   git add .
   git commit -m "Initial AJCG demo build"
   gh repo create momentum-ajcg-demo --public --source=. --push
   ```

2. In Vercel:
   - Import the GitHub repo
   - Framework preset: **Other** (it's static — no build step)
   - Output directory: `.` (root)
   - Click Deploy

### Connect the subdomain

1. In Vercel project → **Settings → Domains** → add `ajcg.momentumarketing.io`
2. Vercel gives you a CNAME target (looks like `cname.vercel-dns.com`)
3. In whichever DNS provider hosts `momentumarketing.io`, add a CNAME record:
   - Host / Name: `ajcg`
   - Value / Target: `cname.vercel-dns.com` (whatever Vercel showed)
4. DNS propagates in 5 – 30 min. Vercel auto-provisions SSL.

## Connect the forms to GoHighLevel

Open `assets/form-handler.js`. On line 26 you'll see:

```js
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/REPLACE_WITH_YOUR_GHL_HOOK_ID';
```

Replace with the real webhook URL from GoHighLevel:
1. In GHL → Workflows → New Workflow → trigger: **Inbound Webhook**
2. Copy the URL it generates
3. Paste it into `form-handler.js`
4. Commit + push — Vercel auto-redeploys

Each form sends a JSON payload that includes a `form_type` field (`quick_valuation`, `selling`, `buying`, `exchange_1031`, `contact`, `careers`) so you can route different forms to different pipelines / tags / sequences in GHL.

## Updating content

Built from `outputs/build_pages.py` (Python). The HTML in this folder is generated.

To rebuild after content changes:
```bash
python3 build_pages.py
```

(Build script and data files live outside this folder in the Cowork session — the rendered HTML in this folder is what ships to Vercel.)

## Production checklist before sharing externally

- [ ] Replace `GHL_WEBHOOK_URL` placeholder in `assets/form-handler.js`
- [ ] Confirm `robots.txt` is set to disallow (already done — only remove this for production launch on AJCG's actual domain)
- [ ] Test forms by submitting one of each — check that the lead lands in GHL
- [ ] Test on mobile (the design is responsive but verify on a real phone)
- [ ] Test the hero video on Safari (most likely to have autoplay quirks)
