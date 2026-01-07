# 🌐 Cấu Hình Nginx Cho DatVeXeKhach

## 📋 **Tổng Quan**

Dự án cần cấu hình Nginx để:
1. Serve Laravel backend (PHP-FPM)
2. Serve React frontend (static files)
3. Reverse proxy cho Reverb WebSocket server (port 8080)

---

## 🔧 **Cấu Hình Nginx**

### **File: `/etc/nginx/sites-available/datve-backend`**

```nginx
# Upstream cho Reverb WebSocket
upstream reverb {
    server 127.0.0.1:8080;
    keepalive 64;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/datve-backend/public;
    index index.php index.html;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/datve-backend-access.log;
    error_log /var/log/nginx/datve-backend-error.log;

    # Max upload size
    client_max_body_size 20M;

    # ============================================
    # Reverb WebSocket Proxy
    # ============================================
    location /app/ {
        proxy_pass http://reverb;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # ============================================
    # API Routes (Laravel Backend)
    # ============================================
    location /api/ {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # ============================================
    # Laravel Application
    # ============================================
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM Configuration
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Deny access to storage and bootstrap/cache
    location ~ ^/(storage|bootstrap/cache) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

---

## 📝 **Các Bước Setup**

### **1. Tạo file config:**
```bash
sudo nano /etc/nginx/sites-available/datve-backend
```

Copy nội dung config ở trên vào file.

### **2. Thay thế các giá trị:**
- `yourdomain.com` → domain thực tế của bạn
- `/var/www/datve-backend` → đường dẫn thực tế đến project
- `php8.2-fpm` → version PHP của bạn (kiểm tra: `php -v`)

### **3. Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/datve-backend /etc/nginx/sites-enabled/
```

### **4. Test config:**
```bash
sudo nginx -t
```

### **5. Reload Nginx:**
```bash
sudo systemctl reload nginx
```

---

## 🔒 **Setup SSL với Let's Encrypt**

### **1. Cài đặt Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

### **2. Lấy SSL certificate:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **3. Auto-renewal (đã được setup tự động):**
```bash
sudo certbot renew --dry-run
```

---

## 🧪 **Test Cấu Hình**

### **1. Test Backend API:**
```bash
curl https://yourdomain.com/api/health
```

### **2. Test Reverb WebSocket:**
Mở browser console và test:
```javascript
// Test WebSocket connection
const echo = new Echo({
    broadcaster: 'reverb',
    key: 'your-reverb-key',
    wsHost: 'yourdomain.com',
    wsPort: 443,
    wssPort: 443,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
});
```

### **3. Check logs:**
```bash
# Nginx access log
sudo tail -f /var/log/nginx/datve-backend-access.log

# Nginx error log
sudo tail -f /var/log/nginx/datve-backend-error.log

# Reverb log
tail -f /var/www/datve-backend/storage/logs/reverb.log
```

---

## 🚨 **Troubleshooting**

### **502 Bad Gateway:**
- Kiểm tra PHP-FPM đang chạy: `sudo systemctl status php8.2-fpm`
- Kiểm tra socket path trong Nginx config
- Kiểm tra permissions: `sudo chown -R www-data:www-data /var/www/datve-backend`

### **WebSocket không kết nối được:**
- Kiểm tra Reverb đang chạy: `sudo supervisorctl status laravel-reverb`
- Kiểm tra port 8080: `sudo netstat -tulpn | grep 8080`
- Kiểm tra firewall: `sudo ufw status`
- Kiểm tra Nginx proxy config cho `/app/`

### **403 Forbidden:**
- Kiểm tra file permissions: `ls -la /var/www/datve-backend/public`
- Đảm bảo `www-data` có quyền đọc: `sudo chmod -R 755 /var/www/datve-backend`

### **404 Not Found:**
- Kiểm tra `root` path trong Nginx config
- Kiểm tra Laravel routes: `php artisan route:list`
- Clear cache: `php artisan config:clear && php artisan route:clear`

---

## 📊 **Performance Tuning**

### **1. Enable Gzip:**
Thêm vào `http` block trong `/etc/nginx/nginx.conf`:
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### **2. PHP-FPM Pool Tuning:**
Edit `/etc/php/8.2/fpm/pool.d/www.conf`:
```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

Reload: `sudo systemctl reload php8.2-fpm`

---

## ✅ **Checklist**

- [ ] Nginx config đã được tạo
- [ ] Site đã được enable
- [ ] Nginx config test thành công
- [ ] SSL certificate đã được cài đặt
- [ ] Backend API hoạt động
- [ ] Reverb WebSocket hoạt động
- [ ] Frontend static files được serve đúng
- [ ] Logs đang được ghi đúng
- [ ] Firewall đã mở các ports cần thiết

---

**🎉 Hoàn thành! Nginx đã được cấu hình đúng cách.**

