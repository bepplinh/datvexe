# Hướng dẫn cấu hình Google OAuth

## Lỗi "redirect_uri_mismatch"

Lỗi này xảy ra khi redirect URI trong Google Cloud Console không khớp với origin của ứng dụng.

## Các bước cấu hình

### 1. Tạo OAuth 2.0 Client ID trong Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn hoặc tạo project mới
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Application type**: **Web application**
6. Đặt tên cho OAuth client (ví dụ: "DatVeXeKhach Web Client")

### 2. Cấu hình Authorized redirect URIs

**QUAN TRỌNG**: Thêm các redirect URI sau vào **Authorized redirect URIs**:

#### Development (Local):
```
http://localhost:5173
http://localhost:5173/
http://localhost:3000
http://localhost:3000/
```

#### Production:
```
https://yourdomain.com
https://yourdomain.com/
https://www.yourdomain.com
https://www.yourdomain.com/
```

**Lưu ý**: 
- Với Google OAuth 2.0 sử dụng `initTokenClient`, redirect URI chính là **origin** của trang web (protocol + domain + port)
- Không cần thêm đường dẫn cụ thể như `/login` hoặc `/callback`
- Chỉ cần thêm origin: `http://localhost:5173` hoặc `https://yourdomain.com`

### 3. Lấy Client ID

Sau khi tạo OAuth client, bạn sẽ nhận được:
- **Client ID** (ví dụ: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Client Secret** (không cần cho frontend, chỉ backend cần)

### 4. Cấu hình trong Backend

Thêm vào file `.env` trong thư mục `backend/` (nếu chưa có):

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

**Ví dụ:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

**Lưu ý**: Frontend sẽ tự động lấy Google Client ID từ backend API (`/api/auth/google/client-id`). Bạn không cần cấu hình trong frontend `.env` nữa.

**Tùy chọn**: Nếu muốn override, bạn vẫn có thể thêm vào file `.env` trong thư mục `frontend/`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 5. Cấu hình trong Backend (nếu cần)

Thêm vào file `.env` trong thư mục `backend/`:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

### 6. Restart ứng dụng

Sau khi thêm biến môi trường:
- Restart frontend dev server
- Restart backend server (nếu có)

## Kiểm tra cấu hình

1. Mở Developer Console (F12)
2. Click nút "Đăng nhập bằng Google"
3. Kiểm tra xem có lỗi trong console không
4. Nếu vẫn lỗi `redirect_uri_mismatch`, kiểm tra lại:
   - Redirect URI trong Google Cloud Console có đúng origin không
   - Client ID trong `.env` có đúng không
   - Đã restart server sau khi thêm biến môi trường chưa

## Lưu ý quan trọng

- **Origin** = `protocol://domain:port` (không có đường dẫn)
- Ví dụ: `http://localhost:5173` ✅ (đúng)
- Ví dụ: `http://localhost:5173/login` ❌ (sai)
- Ví dụ: `https://example.com` ✅ (đúng)
- Ví dụ: `https://example.com/callback` ❌ (sai)

## Troubleshooting

### Lỗi "redirect_uri_mismatch"
- Kiểm tra redirect URI trong Google Cloud Console có đúng origin không
- Đảm bảo protocol (http/https) khớp
- Đảm bảo port khớp (nếu có)
- Đảm bảo domain khớp chính xác

### Lỗi "invalid_client"
- Kiểm tra Client ID có đúng không
- Kiểm tra Client ID đã được thêm vào `.env` chưa
- Đảm bảo đã restart server sau khi thêm biến môi trường

### Lỗi "access_denied"
- User đã từ chối quyền truy cập
- Có thể thử lại hoặc kiểm tra quyền trong Google Account

