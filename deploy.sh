#!/bin/bash
set -e

# Backend
cd /var/www/chat-app/Backend
git pull origin main
npm install
npm run build
pm2 restart chat-app || pm2 start dist/main.js  --name "chat-app"

# Frontend
cd /var/www/chat-app/Frontend
git pull origin main
npm install
npm run build
pm2 restart frontend || pm2 start ecosystem.config.cjs --only frontend


