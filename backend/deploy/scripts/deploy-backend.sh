#!/bin/bash
# Deploy script cho Backend Laravel
# Sử dụng khi cần deploy thủ công

set -e

echo "=========================================="
echo "🚀 DEPLOYING BACKEND"
echo "=========================================="

cd /var/www/datvexe/backend

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction

echo "🔄 Running migrations..."
php artisan migrate --force

echo "🧹 Clearing caches..."
php artisan config:clear
php artisan route:clear  
php artisan view:clear

echo "🏗️ Rebuilding caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔧 Setting permissions..."
chown -R www-data:www-data /var/www/datvexe/backend
chmod -R 775 storage bootstrap/cache

echo "🔄 Restarting queue workers..."
php artisan queue:restart

echo "=========================================="
echo "✅ BACKEND DEPLOYMENT COMPLETED!"
echo "=========================================="
