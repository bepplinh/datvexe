<?php

namespace App\Http\Controllers\Admin;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminBookingModificationRequest;
use App\Services\Admin\AdminBookingModification\AdminBookingModificationService;
use App\Services\UserNotificationService;
use Illuminate\Support\Facades\Log;

/**
 * Controller xử lý các thao tác thay đ​ổi booking (change seat, change trip)
 */
class AdminBookingModificationController extends Controller
{
    public function __construct(
        private AdminBookingModificationService $modificationService,
        private UserNotificationService $userNotification
    ) {}

    /**
     * Đổi ghế trong cùng chuyến
     * POST /api/admin/bookings/{booking}/change-seat
     */
    public function changeSeat(AdminBookingModificationRequest $request, int $booking): JsonResponse
    {
        try {
            $bookingModel = Booking::findOrFail($booking);
            
            // Get old seat label for notification
            $bookingItem = $bookingModel->legs->flatMap->items->firstWhere('id', $request->booking_item_id);
            $oldSeatLabel = $bookingItem?->seat_label ?? $bookingItem?->seat?->seat_number ?? 'N/A';
            
            $updatedBooking = $this->modificationService->changeSeat(
                booking: $bookingModel,
                bookingItemId: $request->booking_item_id,
                newSeatId: $request->new_seat_id,
                adminId: $request->user()->id
            );
            
            // Get new seat label and send notification
            $updatedItem = $updatedBooking->legs->flatMap->items->firstWhere('id', $request->booking_item_id);
            $newSeatLabel = $updatedItem?->seat_label ?? $updatedItem?->seat?->seat_number ?? 'N/A';
            $this->userNotification->notifySeatChanged($updatedBooking, $oldSeatLabel, $newSeatLabel);

            return response()->json([
                'success' => true,
                'message' => 'Đổi ghế thành công',
                'booking' => $updatedBooking,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Đổi vé sang chuyến khác/ngày khác
     * POST /api/admin/bookings/{booking}/change-trip
     */
    public function changeTrip(AdminBookingModificationRequest $request, int $booking): JsonResponse
    {
        try {
            $bookingModel = Booking::findOrFail($booking);
            
            // Get old trip info for notification
            $oldLeg = $bookingModel->legs->first();
            $oldTripInfo = $oldLeg?->trip?->departure_time?->format('H:i d/m/Y') ?? 'N/A';
            
            $result = $this->modificationService->changeTrip(
                booking: $bookingModel,
                bookingItemId: $request->booking_item_id,
                newTripId: $request->new_trip_id,
                newSeatId: $request->new_seat_id,
                options: [
                    'pickup_location_id' => $request->pickup_location_id,
                    'dropoff_location_id' => $request->dropoff_location_id,
                    'pickup_address' => $request->pickup_address,
                    'dropoff_address' => $request->dropoff_address,
                ],
                adminId: $request->user()->id
            );
            
            // Get new trip info and send notification
            $updatedBooking = $result['booking'];
            $newLeg = $updatedBooking->legs->first();
            $newTripInfo = $newLeg?->trip?->departure_time?->format('H:i d/m/Y') ?? 'N/A';
            $this->userNotification->notifyTripChanged($updatedBooking, $oldTripInfo, $newTripInfo);

            return response()->json([
                'success' => true,
                'message' => 'Đổi chuyến thành công',
                'booking' => $result['booking'],
                'price_difference' => $result['price_difference'],
                'requires_payment' => $result['requires_payment'],
                'requires_refund' => $result['requires_refund'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Xác nhận thanh toán bổ sung (khi đổi chuyến giá tăng)
     * POST /api/admin/bookings/{booking}/mark-additional-payment-paid
     */
    public function markAdditionalPaymentPaid(Request $request, int $booking): JsonResponse
    {
        try {
            $bookingModel = Booking::with('payments')->findOrFail($booking);
            $admin = $request->user();

            // Tìm payment pending (additional payment)
            $pendingPayment = $bookingModel->payments()
                ->where('status', 'pending')
                ->whereJsonContains('meta->type', 'additional_payment')
                ->orderByDesc('id')
                ->first();

            if (!$pendingPayment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy payment bổ sung cần xác nhận.',
                ], 404);
            }

            // Cập nhật payment thành succeeded
            $pendingPayment->update([
                'status' => 'succeeded',
                'paid_at' => now(),
                'meta' => array_merge($pendingPayment->meta ?? [], [
                    'marked_paid_by_admin_id' => $admin->id,
                    'marked_paid_at' => now()->toIso8601String(),
                ]),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã xác nhận thanh toán bổ sung thành công.',
                'data' => [
                    'payment' => $pendingPayment->fresh(),
                    'booking' => $bookingModel->fresh(['payments']),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Mark additional payment paid error', [
                'booking_id' => $booking,
                'admin_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xác nhận thanh toán.',
            ], 500);
        }
    }
}
