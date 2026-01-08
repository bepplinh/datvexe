# Hướng Dẫn Deploy Project Vận Tải Đức Anh

Tài liệu này hướng dẫn deploy project lên VPS (Ubuntu 20.04/22.04) sử dụng Nginx, PHP 8.2, MySQL và SSL Cloudflare.

**Domains:**
- Frontend: `vantaiducanh.io.vn`
- Backend: `api.vantaiducanh.io.vn`

---

## 1. Chuẩn Bị Server (VPS)

Đảm bảo bạn đã cài đặt các thành phần cần thiết trên VPS:

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Nginx, MySQL, PHP 8.2, Redis và Supervisor
sudo apt install nginx mysql-server redis-server supervisor php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-bcmath php8.2-curl php8.2-zip php8.2-redis unzip git -y
```

---

## 2. Cấu Hình SSL Cloudflare

Bạn đã có chứng chỉ Cloudflare (Origin CA). Hãy upload chúng lên server.

1.  Tạo thư mục chứa SSL:
    ```bash
    sudo mkdir -p /etc/nginx/ssl
    ```
2.  Tạo file certificate và private key:
    -   `sudo nano /etc/nginx/ssl/vantaiducanh.io.vn.pem` (Dán nội dung Certificate vào đây)
    -   `sudo nano /etc/nginx/ssl/vantaiducanh.io.vn.key` (Dán nội dung Private Key vào đây)

---

## 3. Deploy Backend (Laravel)

### Bước 3.1: Upload Code
Upload code lên thư mục `/var/www/datvexe/backend`. Bạn có thể dùng Git clone hoặc upload file zip.

```bash
sudo mkdir -p /var/www/datvexe
# Clone hoặc copy code vào đây
```

### Bước 3.2: Cài Đặt Dependencies
```bash
cd /var/www/datvexe/backend
composer install --optimize-autoloader --no-dev
```

### Bước 3.3: Cấu Hình Environment
1.  Copy file `.env.production` (đã tạo) thành `.env`:
    ```bash
    cp .env.production.example .env
    ```
2.  Chỉnh sửa file `.env` và điền thông tin Database, Redis, App Key, v.v.
    ```bash
    nano .env
    ```
    **Lưu ý Redis:**
    - `REDIS_HOST=127.0.0.1`
    - `REDIS_PASSWORD=null` (hoặc mật khẩu nếu có)
    - `REDIS_PORT=6379`

3.  Generate Key (nếu chưa có):
    ```bash
    php artisan key:generate
    ```
4.  Cache config:
    ```bash
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ```

### Bước 3.4: Phân Quyền
```bash
sudo chown -R www-data:www-data /var/www/datvexe/backend
sudo chmod -R 775 /var/www/datvexe/backend/storage
sudo chmod -R 775 /var/www/datvexe/backend/bootstrap/cache
```

### Bước 3.5: Cấu Hình Nginx (Backend)
1.  Tạo file config từ file mẫu tôi đã tạo: `backend/deploy/nginx/api.vantaiducanh.io.vn.conf`.
2.  Copy vào thư mục cấu hình Nginx:
    ```bash
    sudo cp /var/www/datvexe/backend/deploy/nginx/api.vantaiducanh.io.vn.conf /etc/nginx/sites-available/api.vantaiducanh.io.vn
    ```
3.  Kích hoạt site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/api.vantaiducanh.io.vn /etc/nginx/sites-enabled/
    ```

### Bước 3.6: Cấu Hình Supervisor (Worker, Queue, Reverb)
1.  Tạo file config từ file mẫu tôi đã tạo: `backend/deploy/supervisor/vantaiducanh-worker.conf`.
2.  Copy vào thư mục cấu hình Supervisor:
    ```bash
    sudo cp /var/www/datvexe/backend/deploy/supervisor/vantaiducanh-worker.conf /etc/supervisor/conf.d/vantaiducanh-worker.conf
    ```
3.  Load và Start các process:
    ```bash
    sudo supervisorctl reread
    sudo supervisorctl update
    sudo supervisorctl start all
    ```
4.  Kiểm tra status:
    ```bash
    sudo supervisorctl status
    ```

---

## 4. Deploy Frontend (React)

### Bước 4.1: Build Project
Lưu ý: Frontend nên được **build ở máy local** (hoặc CI/CD) rồi upload trọn bộ thư mục `dist` lên server để tiết kiệm resource cho VPS.

**Tại máy local:**
1.  Chỉnh sửa `.env.production`:
    ```env
    VITE_API_BASE_URL=https://api.vantaiducanh.io.vn
    ```
2.  Chạy lệnh build:
    ```bash
    npm run build
    ```
    (Lệnh này sẽ tạo ra thư mục `dist`).

### Bước 4.2: Upload Code
Upload toàn bộ nội dung trong thư mục `dist` (local) lên thư mục `/var/www/datvexe/frontend/dist` trên VPS.

```bash
mkdir -p /var/www/datvexe/frontend/dist
# Upload files vào đây
```

### Bước 4.3: Cấu Hình Nginx (Frontend)
1.  Tạo file config từ file mẫu tôi đã tạo: `frontend/deploy/nginx/vantaiducanh.io.vn.conf`.
2.  Copy vào thư mục cấu hình Nginx:
    ```bash
    sudo cp /var/www/datvexe/frontend/deploy/nginx/vantaiducanh.io.vn.conf /etc/nginx/sites-available/vantaiducanh.io.vn
    ```
3.  Kích hoạt site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/vantaiducanh.io.vn /etc/nginx/sites-enabled/
    ```

---

## 5. Hoàn Tất

1.  Kiểm tra cấu hình Nginx:
    ```bash
    sudo nginx -t
    ```
2.  Khởi động lại Nginx:
    ```bash
    sudo systemctl restart nginx
    ```
3.  Kiểm tra truy cập:
    -   Backend: `https://api.vantaiducanh.io.vn`
    -   Frontend: `https://vantaiducanh.io.vn`

Chúc bạn thành công!
