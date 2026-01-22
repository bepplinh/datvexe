<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingLeg;
use App\Models\BookingItem;
use App\Models\Trip;
use App\Models\Route;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingSeeder extends Seeder
{
    /**
     * Danh sách địa điểm ở Hà Nội
     */
    private array $hanoiAddresses = [
        'Đại học Xây dựng, 55 đường Giải Phóng, Hai Bà Trưng, Hà Nội',
        'Vincom Nguyễn Chí Thanh, 54A Nguyễn Chí Thanh, Đống Đa, Hà Nội',
        '126 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        'Đại học Bách Khoa, 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
        'Bến xe Mỹ Đình, Phạm Hùng, Nam Từ Liêm, Hà Nội',
        'Bến xe Giáp Bát, Giải Phóng, Hoàng Mai, Hà Nội',
        'BigC Thăng Long, 222 Trần Duy Hưng, Cầu Giấy, Hà Nội',
        'Aeon Mall Long Biên, 27 Cổ Linh, Long Biên, Hà Nội',
        'Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội',
        'Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội',
        'Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội',
        'Vincom Bà Triệu, 191 Bà Triệu, Hai Bà Trưng, Hà Nội',
        'Đại học Kinh tế Quốc dân, 207 đường Giải Phóng, Hai Bà Trưng, Hà Nội',
        'Đại học Sư phạm Hà Nội, 136 Xuân Thủy, Cầu Giấy, Hà Nội',
        'Học viện Bưu chính Viễn thông, Trần Phú, Hà Đông, Hà Nội',
        'Bệnh viện Bạch Mai, 78 Giải Phóng, Đống Đa, Hà Nội',
        'Bệnh viện Việt Đức, 40 Tràng Thi, Hoàn Kiếm, Hà Nội',
        'Ga Hà Nội, 120 Lê Duẩn, Hoàn Kiếm, Hà Nội',
        'Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội',
        'Văn Miếu - Quốc Tử Giám, 58 Quốc Tử Giám, Đống Đa, Hà Nội',
        'Công viên Thống Nhất, Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
        'IPH Indochina Plaza, 241 Xuân Thủy, Cầu Giấy, Hà Nội',
        'The Garden Mall, Mễ Trì, Nam Từ Liêm, Hà Nội',
        'Vincom Mega Mall Ocean Park, Gia Lâm, Hà Nội',
        'Savico MegaMall, 7-9 Nguyễn Văn Linh, Long Biên, Hà Nội',
        'Học viện Nông nghiệp Việt Nam, Trâu Quỳ, Gia Lâm, Hà Nội',
        'Đại học Thương Mại, Mai Dịch, Cầu Giấy, Hà Nội',
        'Đại học Ngoại Ngữ - ĐHQGHN, Cầu Giấy, Hà Nội',
        'Trung tâm Hội nghị Quốc gia, Mễ Trì, Nam Từ Liêm, Hà Nội',
        'Công viên Hòa Bình, Xuân Đỉnh, Bắc Từ Liêm, Hà Nội',
    ];

    /**
     * Danh sách địa điểm ở Thanh Hóa
     */
    private array $thanhhoaAddresses = [
        'Bến xe phía Bắc Thanh Hóa, Quốc lộ 1A, TP Thanh Hóa',
        'Bến xe phía Nam Thanh Hóa, Quốc lộ 1A, TP Thanh Hóa',
        '78 Nguyễn Trãi, Phường Ba Đình, TP Thanh Hóa',
        '25 Lê Lợi, Phường Lam Sơn, TP Thanh Hóa',
        'Sân vận động Lam Sơn, Phường Trường Thi, TP Thanh Hóa',
        'Ngã tư Bỉm Sơn, Thị xã Bỉm Sơn, Thanh Hóa',
        'Ga Thanh Hóa, Phường Tân Sơn, TP Thanh Hóa',
        'Vincom Thanh Hóa, 30/4 Lê Hoàn, TP Thanh Hóa',
        'BigC Thanh Hóa, Đại Lộ Lê Lợi, TP Thanh Hóa',
        'Quảng trường Lam Sơn, Phường Lam Sơn, TP Thanh Hóa',
        'Chợ Tây Thành, Phường Tân Sơn, TP Thanh Hóa',
        'Đại học Hồng Đức, Quốc lộ 45, TP Thanh Hóa',
        'Bệnh viện Đa khoa tỉnh Thanh Hóa, 181 Hải Thượng Lãn Ông, TP Thanh Hóa',
        'UBND TP Thanh Hóa, Trần Phú, TP Thanh Hóa',
        'Công viên Hội An, Phường Đông Vệ, TP Thanh Hóa',
        'Khu đô thị FLC Sầm Sơn, Sầm Sơn, Thanh Hóa',
        'Biển Sầm Sơn, Thị xã Sầm Sơn, Thanh Hóa',
        'Trạm dừng Hải Tiến, Hoằng Hóa, Thanh Hóa',
        'Ngã ba Voi, TP Thanh Hóa',
        'Cầu Hàm Rồng, TP Thanh Hóa',
        'Lotte Mart Thanh Hóa, Đại lộ Hùng Vương, TP Thanh Hóa',
        'Trường THPT Lam Sơn, Phường Đông Sơn, TP Thanh Hóa',
        'Trung tâm thương mại Vinmart Thanh Hóa, Phan Chu Trinh, TP Thanh Hóa',
        'Khu công nghiệp Lễ Môn, TP Thanh Hóa',
        'Đền thờ Lê Hoàn, Thọ Xuân, Thanh Hóa',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy dữ liệu cần thiết
        $trips = Trip::with(['route.fromCity', 'route.toCity'])->get();
        $seats = DB::table('seats')->get();

        if ($trips->isEmpty() || $seats->isEmpty()) {
            $this->command?->warn('⚠️ Cannot seed bookings: missing trips or seats.');
            return;
        }

        // Lấy thông tin về cities
        $hanoiCity = Location::where('name', 'Hà Nội')->where('type', 'city')->first();
        $thanhhoaCity = Location::where('name', 'Thanh Hóa')->where('type', 'city')->first();

        if (!$hanoiCity || !$thanhhoaCity) {
            $this->command?->warn('⚠️ Cannot find Hà Nội or Thanh Hóa cities.');
            return;
        }

        // Lấy locations cho mỗi city
        $hanoiLocations = Location::where('parent_id', $hanoiCity->id)->get();
        $thanhhoaLocations = Location::where('parent_id', $thanhhoaCity->id)->get();

        if ($hanoiLocations->isEmpty()) {
            $hanoiLocations = collect([$hanoiCity]);
        }
        if ($thanhhoaLocations->isEmpty()) {
            $thanhhoaLocations = collect([$thanhhoaCity]);
        }

        $this->command->info("📊 Found {$trips->count()} trips, {$seats->count()} seats");
        $this->command->info("📍 Hà Nội locations: {$hanoiLocations->count()}, Thanh Hóa locations: {$thanhhoaLocations->count()}");

        // Tạo 50 booking cho năm 2024
        $this->command->info("🚀 Creating 50 bookings for year 2024...");
        $this->createBookingsForYear(2024, 50, $trips, $seats, $hanoiCity, $thanhhoaCity, $hanoiLocations, $thanhhoaLocations);

        // Tạo 500 booking cho năm 2025, phân bổ đều các tháng
        $this->command->info("🚀 Creating 500 bookings for year 2025 (distributed across 12 months)...");
        $bookingsPerMonth = intval(500 / 12);
        $remainingBookings = 500 % 12;

        for ($month = 1; $month <= 12; $month++) {
            $bookingsThisMonth = $bookingsPerMonth;
            if ($month <= $remainingBookings) {
                $bookingsThisMonth++;
            }
            $this->command->info("  Creating {$bookingsThisMonth} bookings for month {$month}/2025...");
            $this->createBookingsForYear(2025, $bookingsThisMonth, $trips, $seats, $hanoiCity, $thanhhoaCity, $hanoiLocations, $thanhhoaLocations, $month);
        }

        // Tạo bookings cho ngày 23/01/2026 với tuyến Thanh Hóa - Hà Nội
        $this->command->info("🚀 Creating bookings for 23/01/2026 (Thanh Hóa - Hà Nội route)...");
        $this->createBookingsForJan232026($trips, $seats, $hanoiCity, $thanhhoaCity, $hanoiLocations, $thanhhoaLocations);

        $this->command->info("✅ Successfully created all bookings!");
    }

    /**
     * Lấy địa chỉ random dựa theo city
     */
    private function getRandomAddressForCity(int $cityId, int $hanoiCityId, int $thanhhoaCityId): string
    {
        if ($cityId === $hanoiCityId) {
            return $this->hanoiAddresses[array_rand($this->hanoiAddresses)];
        } elseif ($cityId === $thanhhoaCityId) {
            return $this->thanhhoaAddresses[array_rand($this->thanhhoaAddresses)];
        }
        
        // Fallback
        return 'Địa điểm không xác định';
    }

    /**
     * Lấy location random dựa theo city
     */
    private function getRandomLocationForCity(int $cityId, int $hanoiCityId, $hanoiLocations, $thanhhoaLocations)
    {
        if ($cityId === $hanoiCityId) {
            return $hanoiLocations->random();
        }
        return $thanhhoaLocations->random();
    }

    /**
     * Tạo bookings cho một năm cụ thể
     */
    private function createBookingsForYear(
        int $year,
        int $numberOfBookings,
        $trips,
        $seats,
        $hanoiCity,
        $thanhhoaCity,
        $hanoiLocations,
        $thanhhoaLocations,
        ?int $specificMonth = null
    ): void {
        $userId = 3;

        for ($i = 0; $i < $numberOfBookings; $i++) {
            // Tạo booking code unique
            do {
                $bookingCode = strtoupper(Str::random(6));
            } while (Booking::where('code', $bookingCode)->exists());

            // Random status: 70% paid, 30% cancelled
            $isCancelled = rand(1, 100) <= 30;
            $status = $isCancelled ? 'cancelled' : 'paid';

            // Random số lượng legs (1 hoặc 2 - OUT hoặc OUT+RETURN)
            $hasReturn = rand(1, 100) <= 50;
            $legTypes = ['OUT'];
            if ($hasReturn) {
                $legTypes[] = 'RETURN';
            }

            // Tính toán giá
            $subtotalPrice = 0;
            $discountAmount = 0;
            $couponId = null;

            // Random có dùng coupon không (20% chance)
            if (rand(1, 100) <= 20) {
                $coupon = DB::table('coupons')->inRandomOrder()->first();
                if ($coupon) {
                    $couponId = $coupon->id;
                }
            }

            // Tạo ngày tháng cho booking
            if ($specificMonth !== null) {
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $specificMonth, $year);
                $day = rand(1, $daysInMonth);
                $bookingDate = Carbon::create($year, $specificMonth, $day, rand(8, 20), rand(0, 59), 0);
            } else {
                $startOfYear = Carbon::create($year, 1, 1);
                $endOfYear = Carbon::create($year, 12, 31);
                $daysDiff = $startOfYear->diffInDays($endOfYear);
                $randomDays = rand(0, $daysDiff);
                $bookingDate = $startOfYear->copy()->addDays($randomDays)->setTime(rand(8, 20), rand(0, 59), 0);
            }

            // Tạo booking
            $booking = Booking::create([
                'code' => $bookingCode,
                'user_id' => $userId,
                'coupon_id' => $couponId,
                'subtotal_price' => 0,
                'total_price' => 0,
                'discount_amount' => 0,
                'status' => $status,
                'payment_provider' => 'payos',
                'payment_intent_id' => 'payos_' . Str::random(20),
                'passenger_name' => 'Nguyễn Văn ' . ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'][rand(0, 9)],
                'passenger_phone' => '0' . rand(100000000, 999999999),
                'passenger_email' => 'passenger' . $year . '_' . ($i + 1) . '@example.com',
                'source' => 'client',
                'booked_by_admin_id' => null,
                'paid_at' => $status === 'paid' ? $bookingDate->copy() : null,
                'cancelled_at' => $status === 'cancelled' ? $bookingDate->copy()->addDays(rand(1, 5)) : null,
                'created_at' => $bookingDate,
                'updated_at' => $bookingDate,
            ]);

            // Tạo booking legs
            foreach ($legTypes as $legType) {
                // Với OUT leg, random chọn trip
                // Với RETURN leg, tìm trip của route ngược lại
                if ($legType === 'OUT') {
                    $trip = $trips->random();
                    $fromCityId = $trip->route->from_city;
                    $toCityId = $trip->route->to_city;
                } else {
                    // RETURN leg: tìm route ngược lại
                    // Lấy trip đã dùng cho OUT leg (trip cuối cùng đã dùng)
                    $outFromCityId = $trip->route->from_city;
                    $outToCityId = $trip->route->to_city;
                    
                    // Tìm trip có route ngược lại (to -> from)
                    $returnTrip = $trips->first(function ($t) use ($outFromCityId, $outToCityId) {
                        return $t->route->from_city == $outToCityId && $t->route->to_city == $outFromCityId;
                    });
                    
                    // Nếu không tìm thấy trip ngược lại, bỏ qua RETURN leg
                    if (!$returnTrip) {
                        continue;
                    }
                    
                    $trip = $returnTrip;
                    $fromCityId = $trip->route->from_city;
                    $toCityId = $trip->route->to_city;
                }

                // Lấy location dựa theo city
                $pickupLocation = $this->getRandomLocationForCity($fromCityId, $hanoiCity->id, $hanoiLocations, $thanhhoaLocations);
                $dropoffLocation = $this->getRandomLocationForCity($toCityId, $hanoiCity->id, $hanoiLocations, $thanhhoaLocations);

                // Lấy địa chỉ dựa theo city
                $pickupAddress = $this->getRandomAddressForCity($fromCityId, $hanoiCity->id, $thanhhoaCity->id);
                $dropoffAddress = $this->getRandomAddressForCity($toCityId, $hanoiCity->id, $thanhhoaCity->id);

                // Random số lượng ghế (1-4 ghế)
                $numberOfSeats = rand(1, 4);
                $selectedSeats = $seats->random(min($numberOfSeats, $seats->count()));

                $legTotalPrice = 0;

                $bookingLeg = BookingLeg::create([
                    'booking_id' => $booking->id,
                    'leg_type' => $legType,
                    'trip_id' => $trip->id,
                    'pickup_location_id' => $pickupLocation->id,
                    'dropoff_location_id' => $dropoffLocation->id,
                    'pickup_snap' => null,
                    'dropoff_snap' => null,
                    'pickup_address' => $pickupAddress,
                    'dropoff_address' => $dropoffAddress,
                    'total_price' => 0,
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                ]);

                // Tạo booking items (ghế)
                foreach ($selectedSeats as $seat) {
                    $seatPrice = rand(180000, 280000);
                    $legTotalPrice += $seatPrice;

                    BookingItem::create([
                        'booking_leg_id' => $bookingLeg->id,
                        'seat_id' => $seat->id,
                        'seat_label' => $seat->seat_number,
                        'price' => $seatPrice,
                        'created_at' => $booking->created_at,
                        'updated_at' => $booking->updated_at,
                    ]);
                }

                // Cập nhật total_price cho leg
                $bookingLeg->update(['total_price' => $legTotalPrice]);
                $subtotalPrice += $legTotalPrice;
            }

            // Tính discount nếu có coupon
            if ($couponId) {
                $coupon = DB::table('coupons')->where('id', $couponId)->first();
                if ($coupon) {
                    if ($coupon->discount_type === 'percentage') {
                        $discountAmount = ($subtotalPrice * $coupon->discount_value) / 100;
                    } else {
                        $discountAmount = min($coupon->discount_value, $subtotalPrice);
                    }
                }
            }

            // Cập nhật giá cho booking
            $booking->update([
                'subtotal_price' => $subtotalPrice,
                'total_price' => $subtotalPrice - $discountAmount,
                'discount_amount' => $discountAmount,
            ]);

            if (($i + 1) % 50 === 0) {
                $this->command->info("  ✓ Created " . ($i + 1) . " bookings...");
            }
        }
    }

    /**
     * Tạo bookings cho ngày 23/01/2026 với tuyến Thanh Hóa - Hà Nội
     */
    private function createBookingsForJan232026(
        $trips,
        $seats,
        $hanoiCity,
        $thanhhoaCity,
        $hanoiLocations,
        $thanhhoaLocations
    ): void {
        $userId = 3;

        // Tìm route Thanh Hóa - Hà Nội
        $route = Route::where('from_city', $thanhhoaCity->id)
            ->where('to_city', $hanoiCity->id)
            ->first();

        if (!$route) {
            $this->command->warn('⚠️ Cannot find Thanh Hóa - Hà Nội route.');
            return;
        }

        // Tìm các trips thuộc route này
        $routeTrips = $trips->where('route_id', $route->id);

        if ($routeTrips->isEmpty()) {
            $this->command->warn('⚠️ Cannot find trips for Thanh Hóa - Hà Nội route.');
            return;
        }

        $bookingDate = Carbon::create(2026, 1, 23);
        $numberOfBookings = 20;

        for ($i = 0; $i < $numberOfBookings; $i++) {
            // Tạo booking code unique
            do {
                $bookingCode = 'THHN' . strtoupper(Str::random(4));
            } while (Booking::where('code', $bookingCode)->exists());

            // Random status: 80% paid, 20% cancelled
            $isCancelled = rand(1, 100) <= 20;
            $status = $isCancelled ? 'cancelled' : 'paid';

            $bookingDateTime = $bookingDate->copy()->setTime(rand(5, 22), rand(0, 59), 0);

            // Random coupon (20% chance)
            $couponId = null;
            if (rand(1, 100) <= 20) {
                $coupon = DB::table('coupons')->inRandomOrder()->first();
                if ($coupon) {
                    $couponId = $coupon->id;
                }
            }

            // Tạo booking
            $booking = Booking::create([
                'code' => $bookingCode,
                'user_id' => $userId,
                'coupon_id' => $couponId,
                'subtotal_price' => 0,
                'total_price' => 0,
                'discount_amount' => 0,
                'status' => $status,
                'payment_provider' => 'payos',
                'payment_intent_id' => 'payos_' . Str::random(20),
                'passenger_name' => 'Hành khách Hà Nội ' . ($i + 1),
                'passenger_phone' => '09' . rand(10000000, 99999999),
                'passenger_email' => 'hn2026_' . ($i + 1) . '@example.com',
                'source' => 'client',
                'booked_by_admin_id' => null,
                'paid_at' => $status === 'paid' ? $bookingDateTime->copy() : null,
                'cancelled_at' => $status === 'cancelled' ? $bookingDateTime->copy()->addHours(rand(1, 3)) : null,
                'created_at' => $bookingDateTime,
                'updated_at' => $bookingDateTime,
            ]);

            // Chọn trip random từ route Thanh Hóa - Hà Nội
            $trip = $routeTrips->random();

            // Pickup từ Thanh Hóa, dropoff ở Hà Nội
            $pickupLocation = $thanhhoaLocations->random();
            $dropoffLocation = $hanoiLocations->random();

            // Địa chỉ thực tế
            $pickupAddress = $this->thanhhoaAddresses[array_rand($this->thanhhoaAddresses)];
            $dropoffAddress = $this->hanoiAddresses[array_rand($this->hanoiAddresses)];

            // Random số lượng ghế (1-3 ghế)
            $numberOfSeats = rand(1, 3);
            $selectedSeats = $seats->random(min($numberOfSeats, $seats->count()));

            $legTotalPrice = 0;

            $bookingLeg = BookingLeg::create([
                'booking_id' => $booking->id,
                'leg_type' => 'OUT',
                'trip_id' => $trip->id,
                'pickup_location_id' => $pickupLocation->id,
                'dropoff_location_id' => $dropoffLocation->id,
                'pickup_snap' => null,
                'dropoff_snap' => null,
                'pickup_address' => $pickupAddress,
                'dropoff_address' => $dropoffAddress,
                'total_price' => 0,
                'created_at' => $booking->created_at,
                'updated_at' => $booking->updated_at,
            ]);

            // Tạo booking items (ghế)
            foreach ($selectedSeats as $seat) {
                $seatPrice = rand(180000, 280000);
                $legTotalPrice += $seatPrice;

                BookingItem::create([
                    'booking_leg_id' => $bookingLeg->id,
                    'seat_id' => $seat->id,
                    'seat_label' => $seat->seat_number,
                    'price' => $seatPrice,
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                ]);
            }

            // Cập nhật total_price cho leg
            $bookingLeg->update(['total_price' => $legTotalPrice]);

            // Tính discount nếu có coupon
            $discountAmount = 0;
            if ($couponId) {
                $coupon = DB::table('coupons')->where('id', $couponId)->first();
                if ($coupon) {
                    if ($coupon->discount_type === 'percentage') {
                        $discountAmount = ($legTotalPrice * $coupon->discount_value) / 100;
                    } else {
                        $discountAmount = min($coupon->discount_value, $legTotalPrice);
                    }
                }
            }

            // Cập nhật giá cho booking
            $booking->update([
                'subtotal_price' => $legTotalPrice,
                'total_price' => $legTotalPrice - $discountAmount,
                'discount_amount' => $discountAmount,
            ]);
        }

        $this->command->info("  ✓ Created {$numberOfBookings} bookings for 23/01/2026 (Thanh Hóa - Hà Nội route)");
    }
}
