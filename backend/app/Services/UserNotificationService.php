<?php

namespace App\Services;

use App\Models\User;
use App\Models\Booking;
use App\Models\UserNotification;
use App\Events\UserNotificationCreated;
use App\Mail\SeatChangedMail;
use App\Mail\TripChangedMail;
use App\Mail\RefundSuccessMail;
use App\Mail\BookingCancelledMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class UserNotificationService
{
    /**
     * Notification type constants
     */
    const TYPE_BOOKING_SUCCESS = 'booking.success';
    const TYPE_BOOKING_CANCELLED = 'booking.cancelled';
    const TYPE_REFUND_SUCCESS = 'refund.success';
    const TYPE_TRIP_CHANGED = 'trip.changed';
    const TYPE_SEAT_CHANGED = 'seat.changed';
    const TYPE_TRIP_REMINDER = 'trip.reminder';

    /**
     * Create a notification for a user
     */
    public function create(
        User $user,
        string $type,
        string $title,
        string $message,
        ?Booking $booking = null,
        array $data = []
    ): UserNotification {
        $notification = UserNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'booking_id' => $booking?->id,
            'data' => array_merge($data, [
                'booking_code' => $booking?->code,
            ]),
        ]);

        // Broadcast to user via WebSocket
        event(new UserNotificationCreated($notification));

        return $notification;
    }

    /**
     * Get email address for booking
     */
    private function getBookingEmail(Booking $booking): ?string
    {
        return $booking->passenger_email ?? $booking->user?->email;
    }

    /**
     * Notify booking success (email already sent separately)
     */
    public function notifyBookingSuccess(Booking $booking): ?UserNotification
    {
        $user = $booking->user;
        if (!$user) return null;

        $ticketCount = $booking->legs->sum(fn($leg) => $leg->items->count());

        return $this->create(
            user: $user,
            type: self::TYPE_BOOKING_SUCCESS,
            title: '🎫 Đặt vé thành công!',
            message: "Bạn đã đặt thành công {$ticketCount} vé. Mã đặt vé: {$booking->code}. Vui lòng kiểm tra email để xem chi tiết.",
            booking: $booking,
            data: [
                'total_price' => $booking->total_price,
                'ticket_count' => $ticketCount,
            ]
        );
    }

    /**
     * Notify booking cancelled + send email
     */
    public function notifyBookingCancelled(Booking $booking, string $reason = ''): ?UserNotification
    {
        $user = $booking->user;
        
        // Send email
        $email = $this->getBookingEmail($booking);
        if ($email) {
            try {
                Mail::to($email)->send(new BookingCancelledMail($booking, $reason));
            } catch (\Exception $e) {
                Log::error('Failed to send booking cancelled email', [
                    'booking_id' => $booking->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!$user) return null;

        $message = "Đơn đặt vé #{$booking->code} đã được hủy.";
        if ($reason) {
            $message .= " Lý do: {$reason}";
        }

        return $this->create(
            user: $user,
            type: self::TYPE_BOOKING_CANCELLED,
            title: '❌ Đơn đặt vé đã hủy',
            message: $message,
            booking: $booking,
            data: [
                'reason' => $reason,
                'cancelled_at' => now()->toISOString(),
            ]
        );
    }

    /**
     * Notify refund success + send email
     */
    public function notifyRefundSuccess(Booking $booking, float $refundAmount): ?UserNotification
    {
        $user = $booking->user;
        
        // Send email
        $email = $this->getBookingEmail($booking);
        if ($email) {
            try {
                Mail::to($email)->send(new RefundSuccessMail($booking, $refundAmount));
            } catch (\Exception $e) {
                Log::error('Failed to send refund success email', [
                    'booking_id' => $booking->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!$user) return null;

        $formattedAmount = number_format($refundAmount, 0, ',', '.') . ' đ';

        return $this->create(
            user: $user,
            type: self::TYPE_REFUND_SUCCESS,
            title: '💰 Hoàn tiền thành công',
            message: "Đơn #{$booking->code} đã được hoàn tiền {$formattedAmount}. Tiền sẽ được chuyển về tài khoản của bạn trong 3-5 ngày làm việc.",
            booking: $booking,
            data: [
                'refund_amount' => $refundAmount,
                'refunded_at' => now()->toISOString(),
            ]
        );
    }

    /**
     * Notify trip changed + send email
     */
    public function notifyTripChanged(
        Booking $booking,
        string $oldTripInfo,
        string $newTripInfo
    ): ?UserNotification {
        $user = $booking->user;
        
        // Send email
        $email = $this->getBookingEmail($booking);
        if ($email) {
            try {
                Mail::to($email)->send(new TripChangedMail($booking, $oldTripInfo, $newTripInfo));
            } catch (\Exception $e) {
                Log::error('Failed to send trip changed email', [
                    'booking_id' => $booking->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!$user) return null;

        return $this->create(
            user: $user,
            type: self::TYPE_TRIP_CHANGED,
            title: '🔄 Chuyến xe đã được thay đổi',
            message: "Đơn #{$booking->code} đã được chuyển sang chuyến mới. Vui lòng kiểm tra lại thông tin chuyến đi.",
            booking: $booking,
            data: [
                'old_trip' => $oldTripInfo,
                'new_trip' => $newTripInfo,
                'changed_at' => now()->toISOString(),
            ]
        );
    }

    /**
     * Notify seat changed + send email
     */
    public function notifySeatChanged(
        Booking $booking,
        string $oldSeats,
        string $newSeats
    ): ?UserNotification {
        $user = $booking->user;
        
        // Send email
        $email = $this->getBookingEmail($booking);
        if ($email) {
            try {
                Mail::to($email)->send(new SeatChangedMail($booking, $oldSeats, $newSeats));
            } catch (\Exception $e) {
                Log::error('Failed to send seat changed email', [
                    'booking_id' => $booking->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!$user) return null;

        return $this->create(
            user: $user,
            type: self::TYPE_SEAT_CHANGED,
            title: '💺 Ghế đã được thay đổi',
            message: "Đơn #{$booking->code}: Ghế của bạn đã được đổi từ [{$oldSeats}] sang [{$newSeats}].",
            booking: $booking,
            data: [
                'old_seats' => $oldSeats,
                'new_seats' => $newSeats,
                'changed_at' => now()->toISOString(),
            ]
        );
    }

    /**
     * Notify trip reminder (used by SendTripReminders command)
     * Email is sent separately in the command
     */
    public function notifyTripReminder(Booking $booking, $departureTime, array $extraData = []): ?UserNotification
    {
        $user = $booking->user;
        if (!$user) return null;

        $timeStr = $departureTime?->format('H:i');
        $dateStr = $departureTime?->format('d/m/Y');

        return $this->create(
            user: $user,
            type: self::TYPE_TRIP_REMINDER,
            title: '⏰ Chuyến xe sắp khởi hành',
            message: "Chuyến xe của bạn sẽ khởi hành lúc {$timeStr} ngày {$dateStr}. Vui lòng có mặt tại điểm đón trước 15-30 phút.",
            booking: $booking,
            data: array_merge([
                'departure_time' => $departureTime?->toISOString(),
            ], $extraData)
        );
    }
}

