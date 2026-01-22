<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingLeg;
use App\Models\BookingItem;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BookingPaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Tạo dữ liệu booking và payment từ 05/2025 đến 24/01/2026
     * Các trạng thái: paid (đã thanh toán), completed (đã đi), cancelled (đã huỷ)
     */
    public function run(): void
    {
        // Lấy dữ liệu cần thiết
        $trips = DB::table('trips')->get();
        $seats = DB::table('seats')->get();
        $locations = DB::table('locations')
            ->whereIn('type', ['ward', 'district'])
            ->get();
        $users = DB::table('users')->pluck('id');
        $coupons = DB::table('coupons')->pluck('id');

        if ($trips->isEmpty() || $seats->isEmpty() || $locations->isEmpty()) {
            $this->command?->warn('⚠️ Cannot seed bookings: missing trips, seats, or locations.');
            return;
        }

        $this->command->info("📊 Found {$trips->count()} trips, {$seats->count()} seats, {$locations->count()} locations");

        // Xóa dữ liệu cũ
        $this->command->info("🗑️ Deleting old booking and payment data...");
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        BookingItem::truncate();
        BookingLeg::truncate();
        Payment::truncate();
        Booking::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->command->info("✅ Old data deleted.");

        // Ngày hiện tại để xác định completed/upcoming
        $today = Carbon::create(2026, 1, 22); // Ngày hiện tại theo yêu cầu

        // Tạo dữ liệu từ tháng 5/2025 đến 24/01/2026
        $startDate = Carbon::create(2025, 5, 1);
        $endDate = Carbon::create(2026, 1, 24);

        // Tạo danh sách các tháng
        $months = [];
        $currentMonth = $startDate->copy();
        while ($currentMonth <= $endDate) {
            $months[] = [
                'year' => $currentMonth->year,
                'month' => $currentMonth->month,
            ];
            $currentMonth->addMonth();
        }

        $this->command->info("📅 Will create bookings for " . count($months) . " months (05/2025 - 01/2026)");

        $totalBookings = 0;
        foreach ($months as $index => $monthData) {
            // Số booking mỗi tháng: 40-60 (random để tạo sự đa dạng)
            $bookingsThisMonth = rand(45, 65);

            // Tháng 5/2025 và tháng 1/2026 có thể ít hơn
            if ($monthData['year'] == 2025 && $monthData['month'] == 5) {
                $bookingsThisMonth = rand(35, 50);
            }
            if ($monthData['year'] == 2026 && $monthData['month'] == 1) {
                $bookingsThisMonth = rand(30, 45); // Chỉ đến ngày 24
            }

            $this->command->info("  📆 Creating {$bookingsThisMonth} bookings for {$monthData['month']}/{$monthData['year']}...");

            $this->createBookingsForMonth(
                $monthData['year'],
                $monthData['month'],
                $bookingsThisMonth,
                $trips,
                $seats,
                $locations,
                $users,
                $coupons,
                $today,
                $endDate
            );

            $totalBookings += $bookingsThisMonth;
        }

        $this->command->info("✅ Successfully created {$totalBookings} bookings with payments!");

        // Thống kê
        $paidCount = Booking::where('status', 'paid')->count();
        $cancelledCount = Booking::where('status', 'cancelled')->count();

        $this->command->info("📊 Statistics:");
        $this->command->info("   - Paid (đã thanh toán + đã đi): {$paidCount}");
        $this->command->info("   - Cancelled (đã huỷ): {$cancelledCount}");
    }

    /**
     * Tạo bookings cho một tháng cụ thể
     */
    private function createBookingsForMonth(
        int $year,
        int $month,
        int $numberOfBookings,
        $trips,
        $seats,
        $locations,
        $users,
        $coupons,
        Carbon $today,
        Carbon $endDate
    ): void {
        // Xác định ngày tối đa trong tháng
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);

        // Nếu tháng 1/2026, chỉ tạo đến ngày 24
        if ($year == 2026 && $month == 1) {
            $daysInMonth = 24;
        }

        for ($i = 0; $i < $numberOfBookings; $i++) {
            // Tạo booking code unique
            do {
                $bookingCode = strtoupper(Str::random(6));
            } while (Booking::where('code', $bookingCode)->exists());

            // Random user
            $userId = $users->random();

            // Random ngày trong tháng
            $day = rand(1, $daysInMonth);
            $hour = rand(6, 22);
            $minute = rand(0, 59);
            $bookingDate = Carbon::create($year, $month, $day, $hour, $minute, 0);

            // Ngày khởi hành của trip (có thể là ngày đặt hoặc sau vài ngày)
            $tripDepartureDate = $bookingDate->copy()->addDays(rand(0, 7));

            // Đảm bảo không vượt quá ngày kết thúc
            if ($tripDepartureDate > $endDate) {
                $tripDepartureDate = $endDate->copy();
            }

            // Xác định status dựa trên ngày khởi hành so với ngày hiện tại
            // Vé trong quá khứ: 70% đã đi (paid), 30% đã huỷ (cancelled)
            // Vé trong tương lai hoặc gần đây: 80% đã thanh toán (paid), 20% đã huỷ (cancelled)
            $isPastTrip = $tripDepartureDate < $today;

            if ($isPastTrip) {
                // Trip đã qua - 75% completed (paid), 25% cancelled
                $isCancelled = rand(1, 100) <= 25;
            } else {
                // Trip sắp tới - 85% paid, 15% cancelled
                $isCancelled = rand(1, 100) <= 15;
            }

            $status = $isCancelled ? 'cancelled' : 'paid';

            // Random số lượng legs (1 hoặc 2 - OUT hoặc OUT+RETURN)
            $hasReturn = rand(1, 100) <= 40; // 40% có return leg
            $legTypes = ['OUT'];
            if ($hasReturn) {
                $legTypes[] = 'RETURN';
            }

            // Random có dùng coupon không (15% chance)
            $couponId = null;
            if (rand(1, 100) <= 15 && $coupons->isNotEmpty()) {
                $couponId = $coupons->random();
            }

            // Random payment provider
            $paymentProvider = rand(1, 100) <= 80 ? 'payos' : 'cash';

            // Random source
            $source = rand(1, 100) <= 85 ? 'client' : 'admin';
            $bookedByAdminId = $source === 'admin' ? 1 : null;

            $subtotalPrice = 0;
            $discountAmount = 0;

            // Tạo booking
            $booking = Booking::create([
                'code' => $bookingCode,
                'user_id' => $userId,
                'coupon_id' => $couponId,
                'subtotal_price' => 0,
                'total_price' => 0,
                'discount_amount' => 0,
                'status' => $status,
                'payment_provider' => $paymentProvider,
                'payment_intent_id' => $paymentProvider === 'payos' ? 'payos_' . Str::random(20) : null,
                'passenger_name' => $this->randomVietnameseName(),
                'passenger_phone' => $this->randomPhoneNumber(),
                'passenger_email' => 'passenger_' . Str::random(8) . '@example.com',
                'source' => $source,
                'booked_by_admin_id' => $bookedByAdminId,
                'paid_at' => $status === 'paid' ? $bookingDate->copy() : null,
                'cancelled_at' => $status === 'cancelled' ? $bookingDate->copy()->addHours(rand(1, 48)) : null,
                'created_at' => $bookingDate,
                'updated_at' => $bookingDate,
            ]);

            // Tạo booking legs
            foreach ($legTypes as $legIndex => $legType) {
                // Random chọn trip thực sự từ database
                $trip = $trips->random();

                $pickupLocation = $locations->random();
                $dropoffLocation = $locations->where('id', '!=', $pickupLocation->id)->random();

                // Random số lượng ghế (1-4 ghế)
                $numberOfSeats = rand(1, 4);
                $selectedSeats = $seats->random(min($numberOfSeats, $seats->count()));
                if (!is_iterable($selectedSeats) || (is_object($selectedSeats) && !($selectedSeats instanceof \Illuminate\Support\Collection))) {
                    $selectedSeats = collect([$selectedSeats]);
                }

                $legTotalPrice = 0;

                $bookingLeg = BookingLeg::create([
                    'booking_id' => $booking->id,
                    'leg_type' => $legType,
                    'trip_id' => $trip->id,
                    'pickup_location_id' => $pickupLocation->id,
                    'dropoff_location_id' => $dropoffLocation->id,
                    'pickup_snap' => null,
                    'dropoff_snap' => null,
                    'pickup_address' => $this->buildAddress($pickupLocation),
                    'dropoff_address' => $this->buildAddress($dropoffLocation),
                    'total_price' => 0,
                    'created_at' => $booking->created_at,
                    'updated_at' => $booking->updated_at,
                ]);

                // Tạo booking items (ghế)
                foreach ($selectedSeats as $seat) {
                    $seatPrice = rand(150000, 450000); // 150k - 450k
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

                $bookingLeg->update(['total_price' => $legTotalPrice]);
                $subtotalPrice += $legTotalPrice;
            }

            // Tính discount nếu có coupon
            if ($couponId) {
                $coupon = DB::table('coupons')->where('id', $couponId)->first();
                if ($coupon) {
                    if ($coupon->discount_type === 'percentage') {
                        $discountAmount = ($subtotalPrice * $coupon->discount_value) / 100;
                        // Giới hạn max discount nếu có
                        if (!empty($coupon->max_discount)) {
                            $discountAmount = min($discountAmount, $coupon->max_discount);
                        }
                    } else {
                        $discountAmount = min($coupon->discount_value, $subtotalPrice);
                    }
                }
            }

            $totalPrice = max(0, $subtotalPrice - $discountAmount);

            // Cập nhật giá cho booking
            $booking->update([
                'subtotal_price' => $subtotalPrice,
                'total_price' => $totalPrice,
                'discount_amount' => $discountAmount,
            ]);

            // Tạo payment record
            $this->createPayment($booking, $bookingDate);
        }
    }

    /**
     * Tạo payment cho booking
     */
    private function createPayment(Booking $booking, Carbon $bookingDate): void
    {
        $paymentStatus = match ($booking->status) {
            'paid' => 'succeeded',
            'cancelled' => 'canceled',
            default => 'pending',
        };

        // Random fee cho PayOS (1.1% + 1900đ)
        $fee = 0;
        if ($booking->payment_provider === 'payos' && $paymentStatus === 'succeeded') {
            $fee = round($booking->total_price * 0.011 + 1900);
        }

        // Random refund cho một số booking cancelled
        $refundAmount = 0;
        $refundedAt = null;
        if ($paymentStatus === 'canceled' && rand(1, 100) <= 50) {
            $refundAmount = $booking->total_price;
            $refundedAt = $booking->cancelled_at;
        }

        Payment::create([
            'booking_id' => $booking->id,
            'amount' => $booking->total_price,
            'fee' => $fee,
            'refund_amount' => $refundAmount,
            'currency' => 'VND',
            'provider' => $booking->payment_provider ?? 'cash',
            'provider_txn_id' => $booking->payment_intent_id ?? ('cash_' . Str::random(16)),
            'status' => $paymentStatus,
            'paid_at' => $booking->paid_at,
            'refunded_at' => $refundedAt,
            'meta' => [
                'booking_code' => $booking->code,
                'generated_by' => 'BookingPaymentSeeder',
                'seeded_at' => now()->toISOString(),
            ],
            'raw_request' => null,
            'raw_response' => null,
            'created_at' => $bookingDate,
            'updated_at' => $bookingDate,
        ]);
    }

    /**
     * Tạo tên tiếng Việt ngẫu nhiên
     */
    private function randomVietnameseName(): string
    {
        $ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
        $tenDem = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Thanh', 'Quang', 'Thu', 'Anh', 'Hoàng', 'Ngọc', 'Kim', 'Phương', 'Hồng'];
        $ten = ['An', 'Bình', 'Cường', 'Dung', 'Em', 'Hà', 'Hùng', 'Hương', 'Khánh', 'Linh', 'Long', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Tùng', 'Vy', 'Yến'];

        return $ho[array_rand($ho)] . ' ' . $tenDem[array_rand($tenDem)] . ' ' . $ten[array_rand($ten)];
    }

    /**
     * Tạo số điện thoại ngẫu nhiên
     */
    private function randomPhoneNumber(): string
    {
        $prefixes = ['09', '08', '07', '03', '05'];
        return $prefixes[array_rand($prefixes)] . rand(10000000, 99999999);
    }

    /**
     * Xây dựng địa chỉ đầy đủ từ location
     */
    private function buildAddress($location): string
    {
        $parts = [$location->name];
        $parentId = $location->parent_id;

        $depth = 0;
        while ($parentId && $depth < 5) {
            $parent = DB::table('locations')->where('id', $parentId)->first();
            if ($parent) {
                $parts[] = $parent->name;
                $parentId = $parent->parent_id;
            } else {
                break;
            }
            $depth++;
        }

        return implode(', ', $parts);
    }
}
