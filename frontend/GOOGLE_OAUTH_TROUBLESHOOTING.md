# Hướng dẫn Kiểm tra và Sửa lỗi Google OAuth

## ✅ Đã cập nhật code

Code đã được cập nhật để:
1. ✅ Thêm `redirect_uri` parameter rõ ràng vào `initTokenClient`
2. ✅ Cải thiện logging để debug dễ dàng hơn
3. ✅ Hiển thị thông báo lỗi chi tiết hơn

## 🔍 Cách kiểm tra nguyên nhân lỗi

### Bước 1: Mở Developer Console
1. Mở trang Login trong trình duyệt
2. Nhấn `F12` hoặc `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
3. Chuyển sang tab **Console**

### Bước 2: Click nút "Đăng nhập bằng Google"
Khi bạn click nút, trong Console sẽ hiển thị thông tin debug:
```
🔍 Debug Google OAuth:
  - Current origin: http://localhost:5173
  - Full URL: http://localhost:5173/login
  - Google Client ID: 123456789-abcdefgh...
  - Redirect URI sẽ sử dụng: http://localhost:5173
  - ⚠️  Đảm bảo redirect URI sau đã được thêm vào Google Cloud Console:
     http://localhost:5173
```

**Ghi lại giá trị "Redirect URI sẽ sử dụng"** - đây chính là redirect URI bạn cần thêm vào Google Cloud Console.

### Bước 3: Kiểm tra lỗi trong Console
Nếu có lỗi, bạn sẽ thấy:
```
❌ Redirect URI mismatch!
  - Redirect URI đang sử dụng: http://localhost:5173
  - Hãy thêm redirect URI này vào Google Cloud Console
```

## 🔧 Cách sửa lỗi "redirect_uri_mismatch"

### Bước 1: Xác định Redirect URI cần thêm
Từ Console log ở Bước 2, ghi lại redirect URI (ví dụ: `http://localhost:5173`)

### Bước 2: Vào Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Click vào **OAuth 2.0 Client ID** của bạn (loại "Web application")

### Bước 3: Thêm Redirect URI
1. Cuộn xuống phần **Authorized redirect URIs**
2. Click **+ ADD URI**
3. Nhập **chính xác** redirect URI bạn đã ghi lại (ví dụ: `http://localhost:5173`)
4. Click **SAVE**

**⚠️ QUAN TRỌNG:**
- ✅ Chỉ thêm **origin** (protocol + domain + port)
- ❌ KHÔNG thêm đường dẫn như `/login`, `/callback`, etc.
- ✅ Protocol phải khớp: `http://` hoặc `https://`
- ✅ Port phải khớp chính xác (nếu có)
- ✅ Domain phải khớp chính xác

### Bước 4: Đợi và thử lại
1. **Đợi 1-2 phút** để Google cập nhật cấu hình
2. **Refresh trang** Login
3. **Thử lại** đăng nhập bằng Google

## 📋 Checklist kiểm tra

Kiểm tra các điểm sau:

- [ ] **Google Client ID đã được cấu hình**
  - Backend `.env` có `GOOGLE_CLIENT_ID`
  - Hoặc frontend `.env` có `VITE_GOOGLE_CLIENT_ID`
  - Hoặc backend API `/api/auth/google/client-id` trả về Client ID

- [ ] **Google OAuth script đã load**
  - Mở Console, kiểm tra không có lỗi load script
  - `window.google` đã được định nghĩa

- [ ] **Redirect URI đã được thêm vào Google Cloud Console**
  - Origin hiện tại (từ Console log) đã có trong Authorized redirect URIs
  - Redirect URI khớp chính xác 100% (không có dấu `/` thừa, protocol đúng, port đúng)

- [ ] **Đã đợi đủ thời gian**
  - Sau khi thêm redirect URI, đợi 1-2 phút
  - Có thể cần clear cache trình duyệt (Ctrl+Shift+Delete)

## 🐛 Các lỗi thường gặp

### Lỗi 1: "Google Client ID chưa được cấu hình"
**Nguyên nhân:** Không lấy được Google Client ID

**Cách sửa:**
1. Kiểm tra backend `.env` có `GOOGLE_CLIENT_ID` không
2. Hoặc thêm `VITE_GOOGLE_CLIENT_ID` vào frontend `.env`
3. Restart server sau khi thêm biến môi trường

### Lỗi 2: "Google OAuth chưa sẵn sàng"
**Nguyên nhân:** Google Identity Services script chưa load xong

**Cách sửa:**
1. Đợi vài giây rồi thử lại
2. Kiểm tra kết nối internet
3. Kiểm tra Console xem có lỗi load script không

### Lỗi 3: "redirect_uri_mismatch"
**Nguyên nhân:** Redirect URI không khớp với cấu hình trong Google Cloud Console

**Cách sửa:**
1. Xem Console log để biết redirect URI đang sử dụng
2. Thêm redirect URI đó vào Google Cloud Console
3. Đợi 1-2 phút và thử lại

### Lỗi 4: "access_denied"
**Nguyên nhân:** User đã từ chối quyền truy cập

**Cách sửa:**
1. Thử lại và chấp nhận quyền truy cập
2. Kiểm tra Google Account có bị chặn không

## 🔗 Tài liệu tham khảo

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## 💡 Tips

1. **Luôn kiểm tra Console** khi gặp lỗi - thông tin debug sẽ giúp bạn tìm nguyên nhân
2. **Redirect URI phải khớp chính xác** - chỉ cần sai một ký tự là sẽ lỗi
3. **Đợi đủ thời gian** - Google cần 1-2 phút để cập nhật cấu hình
4. **Test trên nhiều trình duyệt** - có thể một số trình duyệt cache redirect URI cũ

