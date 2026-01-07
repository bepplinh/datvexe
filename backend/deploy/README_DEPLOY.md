# 🚀 Hướng Dẫn Deploy DatVeXeKhach Lên VPS

## 📋 **Tổng Quan**

Dự án DatVeXeKhach yêu cầu **VPS** (không phải shared hosting) vì cần chạy 3 long-running processes:
1. `queue:work` - Laravel queue worker
2. `reverb:start` - WebSocket server
3. `redis:listen-expired` - Redis expiration listener

---

## 🎯 **Bước 1: Chọn VPS**

### **Khuyến Nghị:**
- **DigitalOcean**: $6-12/tháng (2GB RAM, 1 CPU)
- **Linode**: $5-12/tháng
- **Vultr**: $6-12/tháng
- **Hetzner**: €4-10/tháng (châu Âu)

### **Yêu Cầu Tối Thiểu:**
- **RAM**: 2GB (khuyến nghị 4GB)
- **CPU**: 2 cores
- **Storage**: 25GB SSD
- **OS**: Ubuntu 22.04 LTS

---

## 🚀 **Bước 2: Setup VPS Tự Động**

### **Option 1: Sử dụng Script Tự Động (Khuyến Nghị)**

1. **SSH vào VPS:**
```bash
ssh root@your-vps-ip
```

2. **Upload script setup:**
```bash
# Từ máy local, upload file setup-vps.sh lên VPS
scp backend/deploy/setup-vps.sh root@your-vps-ip:/root/
```

3. **Chạy script:**
```bash
ssh root@your-vps-ip
chmod +x /root/setup-vps.sh
bash /root/setup-vps.sh
```

Script sẽ tự động cài đặt:
- ✅ PHP 8.2+ với các extensions
- ✅ Composer
- ✅ MySQL
- ✅ Redis (với keyspace notifications)
- ✅ Node.js
- ✅ Nginx
- ✅ Supervisor
- ✅ Firewall configuration

### **Option 2: Setup Thủ Công**

Xem chi tiết trong file `DEPLOYMENT_GUIDE.md`

---

## 📦 **Bước 3: Deploy Code**

### **1. Clone code:**
```bash
cd /var/www
git clone <your-repo-url> datve-backend
cd datve-backend
```

### **2. Cài đặt Backend Dependencies:**
```bash
cd backend
composer install --no-dev --optimize-autoloader
```

### **3. Cài đặt Frontend Dependencies:**
```bash
cd ../frontend
npm install
npm run build
```

### **4. Copy build frontend vào public:**
```bash
# Copy build files vào Laravel public directory
cp -r dist/* ../backend/public/
```

---

## ⚙️ **Bước 4: Cấu Hình Environment**

### **1. Tạo file .env:**
```bash
cd /var/www/datve-backend/backend
cp .env.example .env
nano .env
```

### **2. Cấu hình các biến quan trọng:**

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=datve_db
DB_USERNAME=datve_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0

# Queue
QUEUE_CONNECTION=redis

# Reverb (WebSocket)
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=yourdomain.com
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

# Broadcasting
BROADCAST_CONNECTION=reverb
```

### **3. Generate key:**
```bash
php artisan key:generate
```

### **4. Optimize:**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🗄️ **Bước 5: Setup Database**

### **1. Tạo database và user:**
```bash
sudo mysql
```

```sql
CREATE DATABASE datve_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'datve_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON datve_db.* TO 'datve_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **2. Chạy migrations:**
```bash
cd /var/www/datve-backend/backend
php artisan migrate --force
```

### **3. Seed data (nếu cần):**
```bash
php artisan db:seed --force
```

---

## 🔧 **Bước 6: Cấu Hình Supervisor**

### **1. Copy config:**
```bash
sudo cp /var/www/datve-backend/backend/supervisor/all-processes.conf /etc/supervisor/conf.d/
```

### **2. Cập nhật đường dẫn trong config:**
```bash
sudo nano /etc/supervisor/conf.d/all-processes.conf
```

Thay thế `/var/www/datve-backend` bằng đường dẫn thực tế nếu khác.

### **3. Reload và start:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

### **4. Kiểm tra status:**
```bash
sudo supervisorctl status
```

Bạn sẽ thấy:
```
laravel-worker:laravel-worker_00    RUNNING
laravel-worker:laravel-worker_01    RUNNING
laravel-scheduler:laravel-scheduler RUNNING
laravel-reverb:laravel-reverb       RUNNING
redis-listener:redis-listener       RUNNING
```

---

## 🌐 **Bước 7: Cấu Hình Nginx**

### **1. Tạo config:**
Xem chi tiết trong file `NGINX_CONFIG.md`

```bash
sudo nano /etc/nginx/sites-available/datve-backend
```

### **2. Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/datve-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Xóa default nếu cần
```

### **3. Test và reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 **Bước 8: Setup SSL (Let's Encrypt)**

### **1. Cài đặt Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

### **2. Lấy SSL certificate:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **3. Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## ⏰ **Bước 9: Setup Cron Jobs**

### **1. Mở crontab:**
```bash
crontab -e
```

### **2. Thêm Laravel scheduler:**
```
* * * * * cd /var/www/datve-backend/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🔐 **Bước 10: File Permissions**

```bash
cd /var/www/datve-backend
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 775 backend/storage backend/bootstrap/cache
```

---

## ✅ **Bước 11: Kiểm Tra**

### **1. Kiểm tra các services:**
```bash
# Supervisor
sudo supervisorctl status

# Nginx
sudo systemctl status nginx

# PHP-FPM
sudo systemctl status php8.2-fpm

# Redis
sudo systemctl status redis-server

# MySQL
sudo systemctl status mysql
```

### **2. Test API:**
```bash
curl https://yourdomain.com/api/health
```

### **3. Test WebSocket:**
Mở browser console và test kết nối Reverb.

### **4. Kiểm tra logs:**
```bash
# Laravel logs
tail -f /var/www/datve-backend/backend/storage/logs/laravel.log

# Queue worker logs
tail -f /var/www/datve-backend/backend/storage/logs/worker.log

# Reverb logs
tail -f /var/www/datve-backend/backend/storage/logs/reverb.log

# Redis listener logs
tail -f /var/www/datve-backend/backend/storage/logs/redis-listener.log
```

---

## 🚨 **Troubleshooting**

### **Queue không chạy:**
```bash
sudo supervisorctl restart laravel-worker:*
```

### **Reverb không kết nối:**
- Kiểm tra port 8080: `sudo netstat -tulpn | grep 8080`
- Kiểm tra firewall: `sudo ufw status`
- Kiểm tra Nginx proxy config

### **Redis listener không hoạt động:**
- Kiểm tra Redis keyspace notifications: `redis-cli CONFIG GET notify-keyspace-events`
- Phải có: `Ex` hoặc `Exe`
- Nếu không, sửa `/etc/redis/redis.conf` và restart Redis

### **502 Bad Gateway:**
- Kiểm tra PHP-FPM: `sudo systemctl status php8.2-fpm`
- Kiểm tra permissions: `ls -la /var/www/datve-backend/backend/public`

---

## 📊 **Monitoring**

### **1. System Resources:**
```bash
htop
df -h
free -h
```

### **2. Application Logs:**
```bash
# Tất cả logs
tail -f /var/www/datve-backend/backend/storage/logs/*.log

# Supervisor logs
sudo tail -f /var/log/supervisor/supervisord.log
```

### **3. Queue Status:**
```bash
php artisan queue:failed
php artisan queue:work --once  # Test queue
```

---

## 🔄 **Update Code**

```bash
cd /var/www/datve-backend
git pull origin main

# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
cd ../frontend
npm install
npm run build
cp -r dist/* ../backend/public/

# Restart services
sudo supervisorctl restart all
sudo systemctl reload nginx
```

---

## 📚 **Tài Liệu Tham Khảo**

- `HOSTING_RECOMMENDATION.md` - Phân tích chi tiết về hosting
- `NGINX_CONFIG.md` - Cấu hình Nginx chi tiết
- `DEPLOYMENT_GUIDE.md` - Hướng dẫn deploy chi tiết
- `setup-vps.sh` - Script tự động setup VPS

---

## 🎉 **Hoàn Thành!**

Sau khi hoàn thành tất cả các bước, hệ thống của bạn sẽ:
- ✅ Chạy queue worker tự động
- ✅ Chạy Reverb WebSocket server
- ✅ Chạy Redis expiration listener
- ✅ Serve Laravel backend qua HTTPS
- ✅ Serve React frontend
- ✅ Tự động renew SSL certificate

**Chúc bạn deploy thành công! 🚀**

