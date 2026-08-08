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
