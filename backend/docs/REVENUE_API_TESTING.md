# Hướng dẫn Test API Báo cáo Doanh thu

## 1. Yêu cầu Authentication

Tất cả các endpoints yêu cầu:
- **Authentication**: JWT token (Bearer token)
- **Role**: Admin

### Bước 1: Lấy JWT Token

**POST** `/api/login`

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## 2. Các Endpoints

### 2.1. Dashboard Doanh thu Tổng quan

**GET** `/api/admin/revenue/dashboard`

**Query Parameters:**
- `period` (optional): `day` | `week` | `month` | `quarter` | `year` (default: `day`)
- `date` (optional): `YYYY-MM-DD` (default: today)

**Ví dụ:**
```bash
# Doanh thu hôm nay
GET /api/admin/revenue/dashboard?period=day

# Doanh thu tháng này
GET /api/admin/revenue/dashboard?period=month&date=2024-01-15

# Doanh thu quý này
GET /api/admin/revenue/dashboard?period=quarter&date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "day",
    "current_period": {
      "start": "2024-01-15 00:00:00",
      "end": "2024-01-15 23:59:59",
      "revenue": 5000000,
      "booking_count": 25
    },
    "previous_period": {
      "start": "2024-01-14 00:00:00",
      "end": "2024-01-14 23:59:59",
      "revenue": 4500000,
      "booking_count": 22
    },
    "comparison": {
      "revenue_change": 11.11,
      "revenue_change_amount": 500000,
      "booking_change": 13.64,
      "booking_change_amount": 3
    }
  },
  "message": "Lấy dữ liệu dashboard doanh thu thành công."
}
```

### 2.2. Biểu đồ Xu hướng Doanh thu

**GET** `/api/admin/revenue/trend`

**Query Parameters:**
- `period` (optional): `day` | `week` | `month` | `quarter` | `year` (default: `day`)
- `from_date` (optional): `YYYY-MM-DD` (default: 30 days ago)
- `to_date` (optional): `YYYY-MM-DD` (default: today)

**Ví dụ:**
```bash
# Xu hướng 30 ngày qua (theo ngày)
GET /api/admin/revenue/trend?period=day&from_date=2024-01-01&to_date=2024-01-31

# Xu hướng 12 tháng qua (theo tháng)
GET /api/admin/revenue/trend?period=month&from_date=2023-01-01&to_date=2024-01-31

# Xu hướng 4 quý qua (theo quý)
GET /api/admin/revenue/trend?period=quarter&from_date=2023-01-01&to_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "day",
    "from_date": "2024-01-01",
    "to_date": "2024-01-31",
    "trend": [
      {
        "label": "2024-01-01",
        "date": "2024-01-01",
        "revenue": 4500000,
        "booking_count": 20
      },
      {
        "label": "2024-01-02",
        "date": "2024-01-02",
        "revenue": 5000000,
        "booking_count": 25
      }
      // ... more data points
    ]
  },
  "message": "Lấy dữ liệu xu hướng doanh thu thành công."
}
```

### 2.3. Top Tuyến đường

**GET** `/api/admin/revenue/top-routes`

**Query Parameters:**
- `limit` (optional): số lượng kết quả (default: 10, max: 100)
- `from_date` (optional): `YYYY-MM-DD` (default: 30 days ago)
- `to_date` (optional): `YYYY-MM-DD` (default: today)

**Ví dụ:**
```bash
# Top 10 tuyến đường 30 ngày qua
GET /api/admin/revenue/top-routes?limit=10&from_date=2024-01-01&to_date=2024-01-31

# Top 5 tuyến đường tháng này
GET /api/admin/revenue/top-routes?limit=5&from_date=2024-01-01&to_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "from_date": "2024-01-01",
    "to_date": "2024-01-31",
    "top_routes": [
      {
        "route_id": 1,
        "route_name": "Hà Nội - Hồ Chí Minh",
        "from_city": 1,
        "to_city": 2,
        "revenue": 50000000,
        "booking_count": 150,
        "leg_count": 200
      },
      {
        "route_id": 2,
        "route_name": "Hà Nội - Đà Nẵng",
        "from_city": 1,
        "to_city": 3,
        "revenue": 30000000,
        "booking_count": 100,
        "leg_count": 120
      }
      // ... more routes
    ]
  },
  "message": "Lấy danh sách top tuyến đường thành công."
}
```

### 2.4. Top Chuyến xe

**GET** `/api/admin/revenue/top-trips`

**Query Parameters:**
- `limit` (optional): số lượng kết quả (default: 10, max: 100)
- `from_date` (optional): `YYYY-MM-DD` (default: 30 days ago)
- `to_date` (optional): `YYYY-MM-DD` (default: today)

**Ví dụ:**
```bash
# Top 10 chuyến xe 30 ngày qua
GET /api/admin/revenue/top-trips?limit=10&from_date=2024-01-01&to_date=2024-01-31

# Top 5 chuyến xe tháng này
GET /api/admin/revenue/top-trips?limit=5&from_date=2024-01-01&to_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "from_date": "2024-01-01",
    "to_date": "2024-01-31",
    "top_trips": [
      {
        "trip_id": 101,
        "route_id": 1,
        "route_name": "Hà Nội - Hồ Chí Minh",
        "from_city": 1,
        "to_city": 2,
        "departure_time": "2024-01-15 08:00:00",
        "revenue": 5000000,
        "booking_count": 25,
        "leg_count": 30
      },
      {
        "trip_id": 102,
        "route_id": 1,
        "route_name": "Hà Nội - Hồ Chí Minh",
        "from_city": 1,
        "to_city": 2,
        "departure_time": "2024-01-15 14:00:00",
        "revenue": 4500000,
        "booking_count": 22,
        "leg_count": 28
      }
      // ... more trips
    ]
  },
  "message": "Lấy danh sách top chuyến xe thành công."
}
```

## 3. Test với cURL

### Bước 1: Login và lấy token
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

### Bước 2: Test Dashboard
```bash
# Lưu token vào biến
TOKEN="your_access_token_here"

# Test dashboard hôm nay
curl -X GET "http://localhost:8000/api/admin/revenue/dashboard?period=day" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Test dashboard tháng này
curl -X GET "http://localhost:8000/api/admin/revenue/dashboard?period=month&date=2024-01-15" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Bước 3: Test Trend
```bash
curl -X GET "http://localhost:8000/api/admin/revenue/trend?period=day&from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Bước 4: Test Top Routes
```bash
curl -X GET "http://localhost:8000/api/admin/revenue/top-routes?limit=10&from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Bước 5: Test Top Trips
```bash
curl -X GET "http://localhost:8000/api/admin/revenue/top-trips?limit=10&from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

## 4. Test với Postman

### Setup Postman Collection

1. **Tạo Environment Variables:**
   - `base_url`: `http://localhost:8000`
   - `token`: (sẽ được set sau khi login)

2. **Request 1: Login**
   - Method: `POST`
   - URL: `{{base_url}}/api/login`
   - Body (raw JSON):
     ```json
     {
       "email": "admin@example.com",
       "password": "password"
     }
     ```
   - Tests (để lưu token):
     ```javascript
     if (pm.response.code === 200) {
         var jsonData = pm.response.json();
         pm.environment.set("token", jsonData.access_token);
     }
     ```

3. **Request 2: Dashboard**
   - Method: `GET`
   - URL: `{{base_url}}/api/admin/revenue/dashboard?period=day`
   - Headers:
     - `Authorization`: `Bearer {{token}}`
     - `Accept`: `application/json`

4. **Request 3: Trend**
   - Method: `GET`
   - URL: `{{base_url}}/api/admin/revenue/trend?period=day&from_date=2024-01-01&to_date=2024-01-31`
   - Headers:
     - `Authorization`: `Bearer {{token}}`
     - `Accept`: `application/json`

5. **Request 4: Top Routes**
   - Method: `GET`
   - URL: `{{base_url}}/api/admin/revenue/top-routes?limit=10&from_date=2024-01-01&to_date=2024-01-31`
   - Headers:
     - `Authorization`: `Bearer {{token}}`
     - `Accept`: `application/json`

6. **Request 5: Top Trips**
   - Method: `GET`
   - URL: `{{base_url}}/api/admin/revenue/top-trips?limit=10&from_date=2024-01-01&to_date=2024-01-31`
   - Headers:
     - `Authorization`: `Bearer {{token}}`
     - `Accept`: `application/json`

## 5. Test với PHPUnit (nếu cần)

Tạo file test: `tests/Feature/Admin/RevenueControllerTest.php`

```php
<?php

namespace Tests\Feature\Admin;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RevenueControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Tạo user admin và login
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($this->admin, 'api');
    }

    public function test_dashboard_endpoint()
    {
        $response = $this->getJson('/api/admin/revenue/dashboard?period=day');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'period',
                         'current_period' => ['start', 'end', 'revenue', 'booking_count'],
                         'previous_period' => ['start', 'end', 'revenue', 'booking_count'],
                         'comparison'
                     ]
                 ]);
    }

    public function test_trend_endpoint()
    {
        $response = $this->getJson('/api/admin/revenue/trend?period=day&from_date=2024-01-01&to_date=2024-01-31');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'period',
                         'from_date',
                         'to_date',
                         'trend' => [
                             '*' => ['label', 'date', 'revenue', 'booking_count']
                         ]
                     ]
                 ]);
    }

    public function test_top_routes_endpoint()
    {
        $response = $this->getJson('/api/admin/revenue/top-routes?limit=10');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'from_date',
                         'to_date',
                         'top_routes' => [
                             '*' => ['route_id', 'route_name', 'revenue', 'booking_count']
                         ]
                     ]
                 ]);
    }

    public function test_top_trips_endpoint()
    {
        $response = $this->getJson('/api/admin/revenue/top-trips?limit=10');
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'from_date',
                         'to_date',
                         'top_trips' => [
                             '*' => ['trip_id', 'route_name', 'revenue', 'booking_count']
                         ]
                     ]
                 ]);
    }
}
```

## 6. Lưu ý

1. **Authentication**: Tất cả endpoints yêu cầu JWT token và role admin
2. **Date Format**: Sử dụng format `YYYY-MM-DD` cho các tham số date
3. **Period**: Chỉ chấp nhận: `day`, `week`, `month`, `quarter`, `year`
4. **Limit**: Tối đa 100 cho top routes/trips
5. **Error Handling**: Tất cả endpoints có error handling và trả về message rõ ràng

## 7. Ví dụ Test Cases

### Test Case 1: Dashboard với period khác nhau
```bash
# Day
GET /api/admin/revenue/dashboard?period=day

# Week
GET /api/admin/revenue/dashboard?period=week&date=2024-01-15

# Month
GET /api/admin/revenue/dashboard?period=month&date=2024-01-15

# Quarter
GET /api/admin/revenue/dashboard?period=quarter&date=2024-01-15

# Year
GET /api/admin/revenue/dashboard?period=year&date=2024-01-15
```

### Test Case 2: Trend với các period khác nhau
```bash
# Daily trend
GET /api/admin/revenue/trend?period=day&from_date=2024-01-01&to_date=2024-01-31

# Weekly trend
GET /api/admin/revenue/trend?period=week&from_date=2024-01-01&to_date=2024-03-31

# Monthly trend
GET /api/admin/revenue/trend?period=month&from_date=2023-01-01&to_date=2024-01-31
```

### Test Case 3: Top với limit khác nhau
```bash
# Top 5
GET /api/admin/revenue/top-routes?limit=5

# Top 10 (default)
GET /api/admin/revenue/top-routes?limit=10

# Top 20
GET /api/admin/revenue/top-routes?limit=20
```

