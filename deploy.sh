#!/bin/bash

# Exit on error
set -e

# Load Environment & PATH for non-interactive SSH sessions
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

if [ -s "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
fi

# Load and sanitize variables from .env if present
if [ -f ".env" ]; then
  # Remove Windows CRLF carriage returns (\r)
  tr -d '\r' < .env > .env.tmp && mv .env.tmp .env

  # Parse DATABASE_URL safely without quotes or carriage returns
  RAW_DB_URL=$(grep -E '^DATABASE_URL=' .env | cut -d '=' -f 2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | tr -d '\r')
  if [ -n "$RAW_DB_URL" ]; then
    export DATABASE_URL="$RAW_DB_URL"
    echo "🔑 DATABASE_URL exported: ${DATABASE_URL:0:15}..."
  fi

  set -a
  source .env 2>/dev/null || true
  set +a
fi

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_ADMIN_CHAT_ID:-${TELEGRAM_CHAT_ID:-}}"
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null | head -n 1 || echo "Automatic Deployment")

send_telegram_status() {
  local status="$1"
  local details="$2"

  if [ -n "$BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
    local icon="✅"
    if [ "$status" != "SUCCESS" ]; then
      icon="❌"
    fi

    local text="${icon} *LifeOS Deploy Notification*\n\n"
    text+="*Status:* \`${status}\`\n"
    text+="*Commit:* \`${COMMIT_HASH}\` - _${COMMIT_MSG}_\n"
    text+="*Domain:* https://lifeos.nurikhsan.web.id\n\n"
    text+="${details}"

    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
      -d "chat_id=${CHAT_ID}" \
      -d "text=${text}" \
      -d "parse_mode=Markdown" > /dev/null || true
  fi
}

on_error() {
  echo "❌ Error occurred during deployment step!"
  send_telegram_status "FAILED" "⚠️ Deployment terhenti karena kesalahan saat proses install, build, atau PM2 reload."
  exit 1
}

trap 'on_error' ERR

# Detect PM2 executable location
PM2_CMD="pm2"
if ! command -v pm2 &> /dev/null; then
  if command -v npx &> /dev/null; then
    PM2_CMD="npx pm2"
  fi
fi

echo "🚀 Starting Deployment for Life OS (lifeos.nurikhsan.web.id)..."

# 1. Pull latest changes from Git
echo "📦 Pulling latest changes from repository..."
git pull origin main

# 2. Install Dependencies
echo "📥 Installing npm packages..."
npm install --production=false

# 3. Prisma Database Migration & Client Generation
echo "🗄️ Generating Prisma Client & Running DB push..."
npx prisma generate
npx prisma db push

# 4. Build TypeScript Backend & Next.js Frontend
echo "🏗️ Building Backend & Frontend..."
npm run build

# 5. Restart PM2 Services
echo "🔄 Reloading PM2 services via ($PM2_CMD)..."
$PM2_CMD reload ecosystem.config.js || $PM2_CMD start ecosystem.config.js

# 6. Save PM2 Process List
$PM2_CMD save

echo "✅ Deployment completed successfully!"
send_telegram_status "SUCCESS" "🎉 Aplikasi berhasil di-build dan di-deploy ke VPS!"
