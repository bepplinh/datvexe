<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Booking;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class UserNotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find user "ducanh"
        $user = User::where('username', 'ducanh')->first();
        
        if (!$user) {
            $this->command->warn('User "ducanh" not found, skipping UserNotificationSeeder');
            return;
        }

        // Get some bookings for this user (if any)
        $bookings = Booking::where('user_id', $user->id)->limit(3)->get();
        $booking = $bookings->first();

        // Clear existing notifications for this user
        UserNotification::where('user_id', $user->id)->delete();

        $now = Carbon::now();

        $notifications = [
            // Booking success notification
            [
                'user_id' => $user->id,
                'type' => 'booking.success',
                'title' => '🎫 Đặt vé thành công!',
                'message' => 'Bạn đã đặt thành công 2 vé. Mã đặt vé: #ABC123. Vui lòng kiểm tra email để xem chi tiết.',
                'booking_id' => $booking?->id,
                'data' => json_encode([
                    'booking_code' => $booking?->code ?? 'ABC123',
                    'total_price' => 350000,
                    'ticket_count' => 2,
                ]),
                'is_read' => true,
                'read_at' => $now->copy()->subHours(1),
                'created_at' => $now->copy()->subHours(2),
            ],
            // Trip reminder notification
            [
                'user_id' => $user->id,
                'type' => 'trip.reminder',
                'title' => '⏰ Chuyến xe sắp khởi hành',
                'message' => 'Chuyến xe của bạn sẽ khởi hành lúc 14:00 ngày 18/01/2026. Vui lòng có mặt tại điểm đón trước 15-30 phút.',
                'booking_id' => $booking?->id,
                'data' => json_encode([
                    'booking_code' => $booking?->code ?? 'ABC123',
                    'departure_time' => $now->copy()->addHours(2)->toISOString(),
                    'pickup_address' => 'Bến xe Miền Đông',
                ]),
                'is_read' => true,
                'read_at' => $now->copy()->subMinutes(20),
                'created_at' => $now->copy()->subMinutes(30),
            ],
            // Seat changed notification
            [
                'user_id' => $user->id,
                'type' => 'seat.changed',
                'title' => '💺 Ghế đã được thay đổi',
                'message' => 'Đơn #DEF456: Ghế của bạn đã được đổi từ [A01] sang [B05].',
                'booking_id' => $bookings->get(1)?->id,
                'data' => json_encode([
                    'booking_code' => $bookings->get(1)?->code ?? 'DEF456',
                    'old_seats' => 'A01',
                    'new_seats' => 'B05',
                ]),
                'is_read' => true,
                'read_at' => $now->copy()->subHours(1),
                'created_at' => $now->copy()->subDays(1),
            ],
            // Trip changed notification
            [
                'user_id' => $user->id,
                'type' => 'trip.changed',
                'title' => '🔄 Chuyến xe đã được thay đổi',
                'message' => 'Đơn #GHI789 đã được chuyển sang chuyến mới. Vui lòng kiểm tra lại thông tin chuyến đi.',
                'booking_id' => $bookings->get(2)?->id,
                'data' => json_encode([
                    'booking_code' => $bookings->get(2)?->code ?? 'GHI789',
                    'old_trip' => '08:00 - 15/01/2026',
                    'new_trip' => '14:00 - 16/01/2026',
                ]),
                'is_read' => true,
                'read_at' => $now->copy()->subHours(3),
                'created_at' => $now->copy()->subDays(2),
            ],
            // Refund success notification
            [
                'user_id' => $user->id,
                'type' => 'refund.success',
                'title' => '💰 Hoàn tiền thành công',
                'message' => 'Đơn #JKL012 đã được hoàn tiền 175.000 đ. Tiền sẽ được chuyển về tài khoản của bạn trong 3-5 ngày làm việc.',
                'booking_id' => null,
                'data' => json_encode([
                    'booking_code' => 'JKL012',
                    'refund_amount' => 175000,
                ]),
                'is_read' => true,
                'read_at' => $now->copy()->subDays(3),
                'created_at' => $now->copy()->subDays(5),
            ],
        ];

        foreach ($notifications as $notif) {
            UserNotification::create($notif);
        }

        $this->command->info('Created ' . count($notifications) . ' notifications for user "ducanh" (all marked as read)');

        // Mark ALL booking legs as reminder_sent so scheduler doesn't send
        $this->markAllRemindersAsSent();
    }

    /**
     * Mark ALL paid booking legs as already reminded
     */
    protected function markAllRemindersAsSent(): void
    {
        $count = \App\Models\BookingLeg::query()
            ->whereNull('reminder_sent_at')
            ->whereHas('booking', fn($q) => $q->where('status', 'paid'))
            ->update(['reminder_sent_at' => Carbon::now()]);

        $this->command->info("Marked ALL {$count} paid booking legs as reminder_sent");
    }
}
