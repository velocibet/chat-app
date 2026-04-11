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
pm2 restart index || pm2 start .output/server/index.mjs --name "index"
