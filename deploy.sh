#!/bin/bash
# AJ Commercial Group · Momentum demo · Deploy helper
# Usage: ./deploy.sh

set -e
cd "$(dirname "$0")"

# ─────────────────────────────────────────────────────────────────────
# Step 1: Initialize the local git repo (one-time)
# ─────────────────────────────────────────────────────────────────────
if [ ! -d ".git" ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  STEP 1 / 3 — Initializing local git repo"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  git init -b main
  git add .
  git commit -m "Initial AJCG demo build (Momentum)"
  echo ""
  echo "✓ Local repo created and committed."
  echo ""

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  STEP 2 / 3 — Create the empty repo on GitHub"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cat <<'EOF'

  Open this URL in your browser:

    https://github.com/new

  Fill in:
    - Repository name:  momentum-ajcg-demo
    - Visibility:       Private  (recommended — it's a client demo)
    - Initialize with:  LEAVE ALL UNCHECKED
                        (no README, no .gitignore, no license)

  Click "Create repository".

  GitHub then shows a page with commands. Ignore them — we'll use the
  ones below instead.

  When the repo is created, paste your GitHub username here and hit Enter:
EOF
  read -p "  GitHub username: " GH_USER
  REPO_URL="https://github.com/${GH_USER}/momentum-ajcg-demo.git"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  STEP 3 / 3 — Pushing to GitHub"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  git remote add origin "$REPO_URL"
  git push -u origin main
  echo ""
  echo "✓ Pushed to ${REPO_URL}"
  echo ""

  cat <<EOF
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NEXT — Import the repo into Vercel
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Go to: https://vercel.com/new
  2. Find "momentum-ajcg-demo" in your repo list (you may need to grant
     Vercel access to it first).
  3. Click "Import".
  4. Settings:
       Framework Preset:    Other
       Root Directory:      .  (leave blank / default)
       Build Command:       (leave blank)
       Output Directory:    (leave blank)
  5. Click "Deploy".

  Site goes live in 30–60s on a momentum-ajcg-demo.vercel.app URL.

  THEN — connect the subdomain:
  6. In Vercel project: Settings → Domains → Add  ajcg.momentumarketing.io
  7. Vercel gives a CNAME target. In your DNS provider (where
     momentumarketing.io lives), add:
       Type:   CNAME
       Host:   ajcg
       Value:  (whatever Vercel showed — usually cname.vercel-dns.com)
  8. Wait 5–30 min. SSL auto-issues.

  Live at:  https://ajcg.momentumarketing.io
EOF
  exit 0
fi

# ─────────────────────────────────────────────────────────────────────
# Subsequent runs: just commit + push the latest changes
# ─────────────────────────────────────────────────────────────────────
echo "→ Repo already initialized. Committing latest changes…"
git add .
if git diff --cached --quiet; then
  echo "✓ Nothing to commit. Working tree clean."
else
  read -p "Commit message: " msg
  git commit -m "${msg:-Update}"
  git push
  echo "✓ Pushed. Vercel will auto-redeploy."
fi
