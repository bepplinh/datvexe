<?php

namespace Database\Seeders;

use App\Models\AdminNotification;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AdminNotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy một số booking và user để liên kết
        $bookings = Booking::limit(50)->get();
        $users = User::limit(50)->get();

        // Tạo thông báo chưa đọc (20 thông báo)
        for ($i = 0; $i < 20; $i++) {
            $booking = $bookings->isNotEmpty() ? $bookings->random() : null;
            $user = $users->isNotEmpty() ? $users->random() : null;
            $createdAt = Carbon::now()->subMinutes(rand(5, 1440)); // Từ 5 phút đến 24 giờ trước

            if ($booking && $user) {
                AdminNotification::create([
                    'type' => 'booking.success',
                    'title' => 'Đơn mới #' . $booking->code,
                    'message' => sprintf(
                        '%s đặt vé thành công, tổng tiền %sđ',
                        $user->name ?? $user->username ?? 'Khách lẻ',
                        number_format($booking->total_price, 0, ',', '.')
                    ),
                    'booking_id' => $booking->id,
                    'user_id' => $user->id,
                    'total_price' => $booking->total_price,
                    'is_read' => false,
                    'read_at' => null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            } else {
                // Tạo thông báo mẫu nếu không có booking/user
                $code = strtoupper(substr(md5(rand() . $i), 0, 6));
                $price = rand(300000, 2000000);
                AdminNotification::create([
                    'type' => 'booking.success',
                    'title' => 'Đơn mới #' . $code,
                    'message' => sprintf(
                        'Khách hàng đặt vé thành công, tổng tiền %sđ',
                        number_format($price, 0, ',', '.')
                    ),
                    'booking_id' => null,
                    'user_id' => null,
                    'total_price' => $price,
                    'is_read' => false,
                    'read_at' => null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }

        // Tạo thông báo đã đọc (30 thông báo)
        for ($i = 0; $i < 30; $i++) {
            $booking = $bookings->isNotEmpty() ? $bookings->random() : null;
            $user = $users->isNotEmpty() ? $users->random() : null;
            $readAt = Carbon::now()->subHours(rand(1, 168)); // Từ 1 giờ đến 7 ngày trước
            $createdAt = $readAt->copy()->subMinutes(rand(10, 60)); // Tạo trước khi đọc 10-60 phút

            if ($booking && $user) {
                AdminNotification::create([
                    'type' => 'booking.success',
                    'title' => 'Đơn mới #' . $booking->code,
                    'message' => sprintf(
                        '%s đặt vé thành công, tổng tiền %sđ',
                        $user->name ?? $user->username ?? 'Khách lẻ',
                        number_format($booking->total_price, 0, ',', '.')
                    ),
                    'booking_id' => $booking->id,
                    'user_id' => $user->id,
                    'total_price' => $booking->total_price,
                    'is_read' => true,
                    'read_at' => $readAt,
                    'created_at' => $createdAt,
                    'updated_at' => $readAt,
                ]);
            } else {
                // Tạo thông báo mẫu nếu không có booking/user
                $code = strtoupper(substr(md5(rand() . $i), 0, 6));
                $price = rand(300000, 2000000);
                AdminNotification::create([
                    'type' => 'booking.success',
                    'title' => 'Đơn mới #' . $code,
                    'message' => sprintf(
                        'Khách hàng đặt vé thành công, tổng tiền %sđ',
                        number_format($price, 0, ',', '.')
                    ),
                    'booking_id' => null,
                    'user_id' => null,
                    'total_price' => $price,
                    'is_read' => true,
                    'read_at' => $readAt,
                    'created_at' => $createdAt,
                    'updated_at' => $readAt,
                ]);
            }
        }
    }
}

