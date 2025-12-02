<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\BookingLeg;
use App\Models\Location;
use App\Models\Seat;
use App\Models\Trip;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class Route8BookingSeeder extends Seeder
{
    /**
     * Seed 15 bookings for the Thanh Hóa → Hà Nội route (route_id = 8).
     */
    public function run(): void
    {
        $routeId = 8;
        $userId = 3;

        $trips = Trip::where('route_id', $routeId)->get();
        $seats = Seat::all();

        if ($trips->isEmpty()) {
            $this->command?->warn('⚠️ Route8BookingSeeder: Không tìm thấy trip nào cho route_id = 8.');
            return;
        }

        if ($seats->isEmpty()) {
            $this->command?->warn('⚠️ Route8BookingSeeder: Không có ghế nào để gán cho booking.');
            return;
        }

        // Lấy thông tin route để suy ra city cho pickup/dropoff
        $sampleTrip = Trip::with('route')->where('route_id', $routeId)->first();
        if (!$sampleTrip || !$sampleTrip->route) {
            $this->command?->warn('⚠️ Route8BookingSeeder: Không tìm thấy route hợp lệ cho route_id = 8.');
            return;
        }

        $pickupLocations = $this->getLocationsForCity($sampleTrip->route->from_city);
        $dropoffLocations = $this->getLocationsForCity($sampleTrip->route->to_city);

        if ($pickupLocations->isEmpty() || $dropoffLocations->isEmpty()) {
            $this->command?->warn('⚠️ Route8BookingSeeder: Thiếu dữ liệu locations cho from_city/to_city.');
            return;
        }

        $pickupLocations = $pickupLocations->values();
        $dropoffLocations = $dropoffLocations->values();

        $pickupAddresses = [
            'Bến xe phía Bắc Thanh Hóa, Quốc lộ 1A, TP Thanh Hóa',
            'Bến xe phía Nam Thanh Hóa, Quốc lộ 1A, TP Thanh Hóa',
            '78 Nguyễn Trãi, Phường Ba Đình, TP Thanh Hóa',
            '25 Lê Lợi, Phường Lam Sơn, TP Thanh Hóa',
            'Sân vận động Lam Sơn, Phường Trường Thi, TP Thanh Hóa',
            'Ngã tư Bỉm Sơn, Thị xã Bỉm Sơn, Thanh Hóa',
            'Trạm dừng Hải Tiến, Hoằng Hóa, Thanh Hóa',
            'Ga Thanh Hóa, Phường Tân Sơn, TP Thanh Hóa',
        ];

        $dropoffAddresses = [
            'Bến xe Giáp Bát, Giải Phóng, Hoàng Mai, Hà Nội',
            'Số 1 Trần Nhân Tông, Hai Bà Trưng, Hà Nội',
            '35 Lê Duẩn, Hoàn Kiếm, Hà Nội',
            '165 Thái Hà, Đống Đa, Hà Nội',
            '123 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
            '273 Kim Ngưu, Hai Bà Trưng, Hà Nội',
            '18 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
            '68 Lạc Long Quân, Tây Hồ, Hà Nội',
            '89 Phạm Hùng, Nam Từ Liêm, Hà Nội',
            '25 Nguyễn Xiển, Thanh Xuân, Hà Nội',
            '192 Giải Phóng, Thanh Xuân, Hà Nội',
            '45 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội',
            '82 Xuân Thủy, Cầu Giấy, Hà Nội',
            '12 Lê Trọng Tấn, Thanh Xuân, Hà Nội',
            '50 Phố Huế, Hai Bà Trưng, Hà Nội',
        ];

        $this->command?->info('🚍 Route8BookingSeeder: Đang tạo bookings cho tuyến Thanh Hóa → Hà Nội...');

        foreach ($dropoffAddresses as $index => $dropAddress) {
            $pickupAddress = $pickupAddresses[$index % count($pickupAddresses)];
            $trip = $trips[$index % $trips->count()];
            $seat = $seats->random();

            $pickupLocation = $pickupLocations[$index % $pickupLocations->count()];
            $dropoffLocation = $dropoffLocations[$index % $dropoffLocations->count()];

            // Bảo đảm code unique
            do {
                $bookingCode = 'THHN' . strtoupper(Str::random(4));
            } while (Booking::where('code', $bookingCode)->exists());

            $booking = Booking::create([
                'code' => $bookingCode,
                'user_id' => $userId,
                'coupon_id' => null,
                'subtotal_price' => 0,
                'total_price' => 0,
                'discount_amount' => 0,
                'status' => 'paid',
                'payment_provider' => 'cash',
                'payment_intent_id' => 'cash_' . Str::random(10),
                'passenger_name' => 'Hành khách ' . ($index + 1),
                'passenger_phone' => '09' . rand(10000000, 99999999),
                'passenger_email' => 'hanoi' . ($index + 1) . '@example.com',
                'source' => 'admin',
                'booked_by_admin_id' => 1,
                'paid_at' => now()->subHours(rand(1, 48)),
                'cancelled_at' => null,
            ]);

            $bookingLeg = BookingLeg::create([
                'booking_id' => $booking->id,
                'leg_type' => 'OUT',
                'trip_id' => $trip->id,
                'pickup_location_id' => $pickupLocation->id,
                'dropoff_location_id' => $dropoffLocation->id,
                'pickup_address' => $pickupAddress ?? $this->buildAddress($pickupLocation),
                'dropoff_address' => $dropAddress ?? $this->buildAddress($dropoffLocation),
                'total_price' => 0,
            ]);

            $seatPrice = rand(180_000, 260_000);

            BookingItem::create([
                'booking_leg_id' => $bookingLeg->id,
                'seat_id' => $seat->id,
                'seat_label' => $seat->seat_number,
                'price' => $seatPrice,
            ]);

            $bookingLeg->update(['total_price' => $seatPrice]);
            $booking->update([
                'subtotal_price' => $seatPrice,
                'total_price' => $seatPrice,
            ]);

            $this->command?->line("✓ Booking {$bookingCode} → {$dropAddress}");
        }

        $this->command?->info('✅ Route8BookingSeeder: Hoàn tất tạo 15 bookings cho tuyến Thanh Hóa → Hà Nội.');
    }

    private function getLocationsForCity(int $cityId): Collection
    {
        $districts = Location::where('parent_id', $cityId)
            ->where('type', 'district')
            ->get();

        $wards = $districts->isEmpty()
            ? collect()
            : Location::whereIn('parent_id', $districts->pluck('id'))
                ->where('type', 'ward')
                ->get();

        return $districts->concat($wards);
    }

    private function buildAddress(Location $location): string
    {
        return $location->full_path ?? $location->name;
    }
}

