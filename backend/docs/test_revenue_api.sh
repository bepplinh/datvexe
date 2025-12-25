#!/bin/bash

# Script để test Revenue API với cURL
# Usage: ./test_revenue_api.sh

BASE_URL="http://localhost:8000"
EMAIL="admin@example.com"
PASSWORD="password"

echo "=== Testing Revenue API ==="
echo ""

# Step 1: Login và lấy token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Test Dashboard
echo "2. Testing Dashboard (Day)..."
curl -s -X GET "$BASE_URL/api/admin/revenue/dashboard?period=day" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.'
echo ""

# Step 3: Test Dashboard (Month)
echo "3. Testing Dashboard (Month)..."
curl -s -X GET "$BASE_URL/api/admin/revenue/dashboard?period=month&date=2024-01-15" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.'
echo ""

# Step 4: Test Trend
echo "4. Testing Trend (Daily)..."
curl -s -X GET "$BASE_URL/api/admin/revenue/trend?period=day&from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.data.trend | length'
echo "Trend data points returned"
echo ""

# Step 5: Test Top Routes
echo "5. Testing Top Routes..."
curl -s -X GET "$BASE_URL/api/admin/revenue/top-routes?limit=10&from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.data.top_routes | length'
echo "Top routes returned"
echo ""

# Step 6: Test Top Trips
echo "6. Testing Top Trips..."
curl -s -X GET "$BASE_URL/api/admin/revenue/top-trips?limit=10&from_date=2024-01-01&to_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.data.top_trips | length'
echo "Top trips returned"
echo ""

echo "=== All tests completed! ==="


