<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingLeg;
use App\Models\BookingItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy dữ liệu cần thiết
        $trips = DB::table('trips')->get();
        $seats = DB::table('seats')->get();
        // Lấy cả wards và districts (vì một số districts không có wards)
        $locations = DB::table('locations')
            ->whereIn('type', ['ward', 'district'])
            ->get();

        $userId = 3;
        $numberOfBookings = 10; // Số lượng booking muốn tạo
        $numberOfRoundTripBookings = 3; // Ít nhất bao nhiêu booking sẽ có cả chiều đi và về

        if ($trips->isEmpty() || $seats->isEmpty() || $locations->isEmpty()) {
            $this->command?->warn('⚠️ Cannot seed bookings: missing trips, seats, or locations.');
            return;
        }

        $this->command->info("📊 Found {$trips->count()} trips, {$seats->count()} seats, {$locations->count()} locations");

        $this->command->info("🚀 Creating {$numberOfBookings} bookings for user_id = {$userId}...");

        for ($i = 0; $i < $numberOfBookings; $i++) {
            // Tạo booking code unique
            do {
                $bookingCode = strtoupper(Str::random(6));
            } while (Booking::where('code', $bookingCode)->exists());

            // Random status: 70% paid, 30% cancelled
            $isCancelled = rand(1, 100) <= 30;
            $status = $isCancelled ? 'cancelled' : 'paid';

            // Xác định leg types cho booking này
            // - Một vài booking đầu chắc chắn có cả OUT + RETURN
            // - Các booking còn lại giữ nguyên random như cũ
            if ($i < $numberOfRoundTripBookings) {
                $legTypes = ['OUT', 'RETURN'];
            } else {
                // Random số lượng legs (1 hoặc 2 - OUT hoặc OUT+RETURN)
                $hasReturn = rand(1, 100) <= 50; // 50% có return leg
                $legTypes = ['OUT'];
                if ($hasReturn) {
                    $legTypes[] = 'RETURN';
                }
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

            // Tạo booking
            $booking = Booking::create([
                'code' => $bookingCode,
                'user_id' => $userId,
                'coupon_id' => $couponId,
                'subtotal_price' => 0, // Sẽ cập nhật sau
                'total_price' => 0, // Sẽ cập nhật sau
                'discount_amount' => 0, // Sẽ cập nhật sau
                'status' => $status,
                'payment_provider' => 'payos',
                'payment_intent_id' => 'payos_' . Str::random(20),
                'passenger_name' => 'Nguyễn Văn ' . ['A', 'B', 'C', 'D', 'E'][rand(0, 4)],
                'passenger_phone' => '0' . rand(100000000, 999999999),
                'passenger_email' => 'passenger' . ($i + 1) . '@example.com',
                'source' => 'client',
                'booked_by_admin_id' => null,
                'paid_at' => $status === 'paid' ? now()->subDays(rand(1, 30)) : null,
                'cancelled_at' => $status === 'cancelled' ? now()->subDays(rand(1, 10)) : null,
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now()->subDays(rand(1, 30)),
            ]);

            // Tạo booking legs
            foreach ($legTypes as $legType) {
                // Random chọn trip
                $trip = $trips->random();

                // Random chọn pickup và dropoff locations
                $pickupLocation = $locations->random();
                $dropoffLocation = $locations->random();

                // Đảm bảo pickup và dropoff khác nhau
                while ($pickupLocation->id === $dropoffLocation->id) {
                    $dropoffLocation = $locations->random();
                }

                // Helper function để tạo địa chỉ đầy đủ
                $buildAddress = function($location) use ($locations) {
                    $parts = [$location->name];
                    $parentId = $location->parent_id;
                    
                    while ($parentId) {
                        $parent = DB::table('locations')->where('id', $parentId)->first();
                        if ($parent) {
                            $parts[] = $parent->name;
                            $parentId = $parent->parent_id;
                        } else {
                            break;
                        }
                    }
                    
                    return implode(', ', $parts);
                };

                // Random số lượng ghế (1-4 ghế)
                $numberOfSeats = rand(1, 4);
                $selectedSeats = $seats->random(min($numberOfSeats, $seats->count()));

                // Tính giá cho leg (mỗi ghế có giá random từ 100k đến 500k)
                $legTotalPrice = 0;

                $bookingLeg = BookingLeg::create([
                    'booking_id' => $booking->id,
                    'leg_type' => $legType,
                    'trip_id' => $trip->id,
                    'pickup_location_id' => $pickupLocation->id,
                    'dropoff_location_id' => $dropoffLocation->id,
                    'pickup_snap' => null,
                    'dropoff_snap' => null,
                    'pickup_address' => $buildAddress($pickupLocation),
                    'dropoff_address' => $buildAddress($dropoffLocation),
                    'total_price' => 0, // Sẽ cập nhật sau
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                ]);

                // Tạo booking items (ghế)
                foreach ($selectedSeats as $seat) {
                    $seatPrice = rand(100000, 500000); // 100k - 500k
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

            $this->command->info("✓ Created booking #{$booking->code} ({$status}) with " . count($legTypes) . " leg(s)");
        }

        $this->command->info("✅ Successfully created {$numberOfBookings} bookings!");
    }
}