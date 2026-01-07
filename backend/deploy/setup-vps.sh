#!/bin/bash

# 🚀 Script Tự Động Setup VPS Cho Dự Án DatVeXeKhach
# Chạy script này trên VPS mới để setup toàn bộ môi trường

set -e  # Exit on error

echo "🚀 Bắt đầu setup VPS cho DatVeXeKhach..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/var/www/datve-backend"
PROJECT_USER="www-data"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Vui lòng chạy script này với quyền root (sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Đang cập nhật hệ thống...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}✅ Đang cài đặt các packages cơ bản...${NC}"
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# ============================================
# 1. Cài đặt PHP 8.2+
# ============================================
echo -e "${GREEN}✅ Đang cài đặt PHP 8.2...${NC}"
apt install -y php8.2-fpm php8.2-cli php8.2-common php8.2-mysql php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath php8.2-intl php8.2-redis

# Verify PHP version
PHP_VERSION=$(php -v | head -n 1 | cut -d " " -f 2 | cut -c 1-3)
echo -e "${GREEN}✅ PHP version: $PHP_VERSION${NC}"

# ============================================
# 2. Cài đặt Composer
# ============================================
echo -e "${GREEN}✅ Đang cài đặt Composer...${NC}"
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
    echo -e "${GREEN}✅ Composer đã được cài đặt${NC}"
else
    echo -e "${YELLOW}⚠️  Composer đã được cài đặt${NC}"
fi

# ============================================
# 3. Cài đặt MySQL
# ============================================
echo -e "${GREEN}✅ Đang cài đặt MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
    echo -e "${GREEN}✅ MySQL đã được cài đặt${NC}"
    echo -e "${YELLOW}⚠️  Vui lòng chạy 'sudo mysql_secure_installation' để bảo mật MySQL${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL đã được cài đặt${NC}"
fi

# ============================================
# 4. Cài đặt Redis với Keyspace Notifications
# ============================================
echo -e "${GREEN}✅ Đang cài đặt Redis...${NC}"
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server
    
    # Enable keyspace notifications
    sed -i 's/^# notify-keyspace-events ""/notify-keyspace-events Ex/' /etc/redis/redis.conf
    sed -i 's/^notify-keyspace-events ""/notify-keyspace-events Ex/' /etc/redis/redis.conf
    
    systemctl restart redis-server
    systemctl enable redis-server
    echo -e "${GREEN}✅ Redis đã được cài đặt và cấu hình keyspace notifications${NC}"
else
    echo -e "${YELLOW}⚠️  Redis đã được cài đặt${NC}"
    # Vẫn cần enable keyspace notifications
    if ! grep -q "notify-keyspace-events Ex" /etc/redis/redis.conf; then
        sed -i 's/^# notify-keyspace-events ""/notify-keyspace-events Ex/' /etc/redis/redis.conf
        sed -i 's/^notify-keyspace-events ""/notify-keyspace-events Ex/' /etc/redis/redis.conf
        systemctl restart redis-server
        echo -e "${GREEN}✅ Đã enable keyspace notifications cho Redis${NC}"
    fi
fi

# ============================================
# 5. Cài đặt Node.js (cho frontend build)
# ============================================
echo -e "${GREEN}✅ Đang cài đặt Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js đã được cài đặt: $(node -v)${NC}"
fi

# ============================================
# 6. Cài đặt Nginx
# ============================================
echo -e "${GREEN}✅ Đang cài đặt Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✅ Nginx đã được cài đặt${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx đã được cài đặt${NC}"
fi

# ============================================
# 7. Cài đặt Supervisor
# ============================================
echo -e "${GREEN}✅ Đang cài đặt Supervisor...${NC}"
if ! command -v supervisorctl &> /dev/null; then
    apt install -y supervisor
    systemctl start supervisor
    systemctl enable supervisor
    echo -e "${GREEN}✅ Supervisor đã được cài đặt${NC}"
else
    echo -e "${YELLOW}⚠️  Supervisor đã được cài đặt${NC}"
fi

# ============================================
# 8. Tạo thư mục project
# ============================================
echo -e "${GREEN}✅ Đang tạo thư mục project...${NC}"
mkdir -p $PROJECT_DIR
chown -R $PROJECT_USER:$PROJECT_USER $PROJECT_DIR

# ============================================
# 9. Cấu hình Firewall
# ============================================
echo -e "${GREEN}✅ Đang cấu hình firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 8080/tcp  # Reverb WebSocket
    echo -e "${GREEN}✅ Firewall đã được cấu hình${NC}"
else
    echo -e "${YELLOW}⚠️  UFW chưa được cài đặt, bỏ qua firewall setup${NC}"
fi

# ============================================
# 10. Summary
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup VPS hoàn tất!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Các bước tiếp theo:"
echo ""
echo "1. Clone code vào $PROJECT_DIR:"
echo "   cd $PROJECT_DIR"
echo "   git clone <your-repo-url> ."
echo ""
echo "2. Cài đặt dependencies:"
echo "   cd $PROJECT_DIR"
echo "   composer install --no-dev --optimize-autoloader"
echo "   cd ../frontend  # nếu frontend ở thư mục riêng"
echo "   npm install && npm run build"
echo ""
echo "3. Cấu hình .env:"
echo "   cp $PROJECT_DIR/.env.example $PROJECT_DIR/.env"
echo "   nano $PROJECT_DIR/.env"
echo ""
echo "4. Generate key và optimize:"
echo "   cd $PROJECT_DIR"
echo "   php artisan key:generate"
echo "   php artisan config:cache"
echo "   php artisan route:cache"
echo "   php artisan view:cache"
echo ""
echo "5. Chạy migrations:"
echo "   php artisan migrate --force"
echo ""
echo "6. Setup Supervisor:"
echo "   sudo cp $PROJECT_DIR/supervisor/all-processes.conf /etc/supervisor/conf.d/"
echo "   # Cập nhật đường dẫn trong file config nếu cần"
echo "   sudo nano /etc/supervisor/conf.d/all-processes.conf"
echo "   sudo supervisorctl reread"
echo "   sudo supervisorctl update"
echo "   sudo supervisorctl start all"
echo ""
echo "7. Cấu hình Nginx:"
echo "   # Tạo file config cho Nginx"
echo "   # Xem hướng dẫn trong deploy/NGINX_CONFIG.md"
echo ""
echo "8. Setup SSL (Let's Encrypt):"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo -e "${YELLOW}⚠️  Lưu ý:${NC}"
echo "   - Cần cấu hình MySQL database và user"
echo "   - Cần cấu hình Redis connection trong .env"
echo "   - Cần cấu hình Reverb trong .env"
echo "   - Cần setup cron job cho Laravel scheduler"
echo ""
echo -e "${GREEN}🎉 Chúc bạn deploy thành công!${NC}"

