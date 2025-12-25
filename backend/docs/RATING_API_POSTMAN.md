# Rating API - Postman Collection

## Base URL
```
http://localhost:8000/api
```
(Thay đổi theo domain của bạn)

## Variables
Tạo environment variables trong Postman:
- `base_url`: `http://localhost:8000/api`
- `token`: JWT token sau khi login

## 1. Login (Lấy Token)
**POST** `/login`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "identifier": "your_username",
  "password": "your_password"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Lưu token vào biến `token`**

---

## 2. Lấy danh sách trip cần đánh giá
**GET** `/ratings/pending`

Headers:
```
Authorization: Bearer {{token}}
Accept: application/json
```

Response (200):
```json
{
  "data": [
    {
      "trip_id": 1,
      "booking_leg_id": 5,
      "departure_time": "2025-01-15T08:00:00",
      "arrival_estimate": "2025-01-15T12:30:00",
      "duration_minutes": 270
    }
  ]
}
```

---

## 3. Tạo đánh giá
**POST** `/trips/{trip_id}/ratings`

Headers:
```
Authorization: Bearer {{token}}
Content-Type: application/json
Accept: application/json
```

Body:
```json
{
  "score": 5,
  "comment": "Chuyến đi rất tốt!"
}
```

**Validation Rules:**
- `score`: required, integer, between 1-5
- `comment`: optional, string, max 1000 characters

Response (201):
```json
{
  "rating": {
    "id": 1,
    "trip_id": 1,
    "booking_leg_id": 5,
    "user_id": 1,
    "score": 5,
    "comment": "Chuyến đi rất tốt!",
    "created_at": "2025-01-15T13:00:00",
    "updated_at": "2025-01-15T13:00:00"
  },
  "summary": {
    "average": 5.0,
    "count": 1
  }
}
```

---

## Error Responses

### 403 - Chưa đặt vé
```json
{
  "message": "Bạn chưa đặt ghế cho chuyến này."
}
```

### 400 - Chuyến chưa kết thúc
```json
{
  "message": "Chuyến chưa kết thúc, chưa thể đánh giá."
}
```

### 409 - Đã đánh giá
```json
{
  "message": "Bạn đã đánh giá cho chuyến này."
}
```

### 422 - Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "score": [
      "The score must be between 1 and 5."
    ]
  }
}
```

### 401 - Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

