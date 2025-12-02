<?php

namespace App\Services\Admin;

use App\Models\Booking;
use App\Models\AdminNotification;
use App\Events\AdminNotificationCreated;
use Illuminate\Support\Facades\Broadcast;

class AdminNotificationService
{
    public function notifyBookingPaid(Booking $booking)
    {
        $notification = AdminNotification::create([
            'type' => 'booking.success',
            'title'       => 'Đơn mới #' . $booking->code,
            'message'     => sprintf(
                '%s đặt vé tuyến %s - %s, tổng %sđ',
                optional($booking->user)->name ?? 'Khách lẻ',
                optional($booking->legs->first()?->trip)->origin_name,
                optional($booking->legs->first()?->trip)->destination_name,
                number_format($booking->total_price)
            ),
            'booking_id'  => $booking->id,
            'user_id'     => $booking->user_id,
            'total_price' => $booking->total_price,
        ]);

        event(new AdminNotificationCreated($notification->fresh()));

        return $notification;
    }

    public function markAsRead(AdminNotification $notification) 
    {
        if (!$notification->is_read) {
            $notification->forceFill([
                'is_read' => true,
                'read_at' => now(),
            ])->save();
        }

        return $notification;
    }
}
