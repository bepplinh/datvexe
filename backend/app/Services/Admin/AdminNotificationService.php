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
        // Load relations nếu chưa có
        $booking->loadMissing(['user', 'legs.trip.route.fromCity', 'legs.trip.route.toCity']);
        
        // Lấy thông tin tuyến từ leg đầu tiên
        $firstLeg = $booking->legs->first();
        $trip = $firstLeg?->trip;
        $route = $trip?->route;
        
        $originName = $route?->fromCity?->name ?? '';
        $destinationName = $route?->toCity?->name ?? '';
        
        // Tạo thông báo với tên tuyến đầy đủ
        $routeDisplay = ($originName && $destinationName) 
            ? "{$originName} - {$destinationName}" 
            : ($route?->name ?? 'Không xác định');
        
        $notification = AdminNotification::create([
            'type' => 'booking.success',
            'title'       => 'Đơn mới #' . $booking->code,
            'message'     => sprintf(
                '%s đặt vé tuyến %s, tổng %sđ',
                optional($booking->user)->name ?? 'Khách lẻ',
                $routeDisplay,
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
