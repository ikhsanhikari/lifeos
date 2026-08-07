#!/bin/bash

# Exit on error
set -e

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
echo "🔄 Reloading PM2 services..."
pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js

# 6. Save PM2 Process List
pm2 save

echo "✅ Deployment completed successfully!"
