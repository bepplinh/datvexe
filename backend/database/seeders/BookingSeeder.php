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
     * Danh sách địa chỉ ở Hà Nội
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
    ];

    /**
     * Danh sách địa chỉ ở Thanh Hóa
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

        // Lấy danh sách users không phải admin
        $nonAdminUsers = DB::table('users')
            ->where('role', '!=', 'admin')
            ->pluck('id')
            ->toArray();

        if (empty($nonAdminUsers)) {
            $this->command?->warn('⚠️ No non-admin users found.');
            return;
        }

        $this->command->info("👥 Found " . count($nonAdminUsers) . " non-admin users");

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

        // Tạo bookings từ tháng 10/2025 đến hôm nay
        $startDate = Carbon::create(2025, 10, 1, 0, 0, 0);
        $endDate = Carbon::now();
        
        $this->command->info("🚀 Creating bookings from {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}...");
        $this->command->info("📅 Date range: " . $startDate->diffInDays($endDate) . " days");

        // Tạo 500 bookings phân bổ đều trong khoảng thời gian và cho các users
        $numberOfBookings = 500;
        $this->createBookingsForDateRange(
            $startDate,
            $endDate,
            $numberOfBookings,
            $nonAdminUsers,
            $trips,
            $seats,
            $hanoiCity,
            $thanhhoaCity,
            $hanoiLocations,
            $thanhhoaLocations
        );

        $this->command->info("✅ Successfully created {$numberOfBookings} bookings!");
    }

    /**
     * Tạo bookings cho khoảng thời gian cụ thể, phân bổ cho nhiều users
     */
    private function createBookingsForDateRange(
        Carbon $startDate,
        Carbon $endDate,
        int $numberOfBookings,
        array $userIds,
        $trips,
        $seats,
        $hanoiCity,
        $thanhhoaCity,
        $hanoiLocations,
        $thanhhoaLocations
    ): void {
        $daysDiff = $startDate->diffInDays($endDate);

        for ($i = 0; $i < $numberOfBookings; $i++) {
            // Random user từ danh sách non-admin users
            $userId = $userIds[array_rand($userIds)];

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

            // Random ngày trong khoảng startDate - endDate
            $randomDays = rand(0, max(1, $daysDiff));
            $bookingDate = $startDate->copy()->addDays($randomDays)->setTime(rand(8, 20), rand(0, 59), 0);

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
                'passenger_name' => 'Hành khách ' . chr(65 + ($i % 26)),
                'passenger_phone' => '0' . rand(100000000, 999999999),
                'passenger_email' => 'passenger_' . $i . '@example.com',
                'source' => 'client',
                'booked_by_admin_id' => null,
                'paid_at' => $status === 'paid' ? $bookingDate->copy() : null,
                'cancelled_at' => $status === 'cancelled' ? $bookingDate->copy()->addDays(rand(1, 5)) : null,
                'created_at' => $bookingDate,
                'updated_at' => $bookingDate,
            ]);

            // Tạo booking legs
            foreach ($legTypes as $legType) {
                if ($legType === 'OUT') {
                    $trip = $trips->random();
                    $fromCityId = $trip->route->from_city;
                    $toCityId = $trip->route->to_city;
                } else {
                    // RETURN leg: tìm route ngược lại
                    $outFromCityId = $trip->route->from_city;
                    $outToCityId = $trip->route->to_city;
                    
                    $returnTrip = $trips->first(function ($t) use ($outFromCityId, $outToCityId) {
                        return $t->route->from_city == $outToCityId && $t->route->to_city == $outFromCityId;
                    });
                    
                    if (!$returnTrip) {
                        continue;
                    }
                    
                    $trip = $returnTrip;
                    $fromCityId = $trip->route->from_city;
                    $toCityId = $trip->route->to_city;
                }

                // Lấy location và address dựa theo city
                $pickupLocation = $this->getRandomLocationForCity($fromCityId, $hanoiCity->id, $hanoiLocations, $thanhhoaLocations);
                $dropoffLocation = $this->getRandomLocationForCity($toCityId, $hanoiCity->id, $hanoiLocations, $thanhhoaLocations);
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
                    'reminder_sent_at' => now(), // Đánh dấu đã gửi reminder
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

            // Tạo payment record cho booking đã paid
            if ($status === 'paid') {
                DB::table('payments')->insert([
                    'booking_id' => $booking->id,
                    'amount' => $subtotalPrice - $discountAmount,
                    'status' => 'succeeded',
                    'provider' => 'payos',
                    'provider_txn_id' => 'txn_' . Str::random(20),
                    'paid_at' => $bookingDate,
                    'fee' => 0,
                    'refund_amount' => 0,
                    'created_at' => $bookingDate,
                    'updated_at' => $bookingDate,
                ]);
            }

            if (($i + 1) % 50 === 0) {
                $this->command->info("  ✓ Created " . ($i + 1) . " bookings...");
            }
        }
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
}
