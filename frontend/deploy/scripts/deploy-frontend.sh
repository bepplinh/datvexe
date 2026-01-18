#!/bin/bash
# Deploy script cho Frontend React/Vite
# LƯU Ý: Script này chạy trên VPS để swap folder dist sau khi upload

set -e

echo "=========================================="
echo "🎨 DEPLOYING FRONTEND"
echo "=========================================="

cd /var/www/datvexe/frontend

# Kiểm tra xem dist-new có tồn tại không
if [ ! -d "dist-new" ]; then
    echo "❌ dist-new folder not found!"
    echo "   Hãy upload thư mục dist từ local/CI lên dist-new trước."
    exit 1
fi

echo "🔄 Swapping dist folders..."
rm -rf dist-old 2>/dev/null || true
mv dist dist-old 2>/dev/null || true  
mv dist-new dist

echo "🔧 Setting permissions..."
chown -R www-data:www-data dist

echo "=========================================="
echo "✅ FRONTEND DEPLOYMENT COMPLETED!"
echo "=========================================="

# Cleanup old folder (optional)
# rm -rf dist-old
