<?php

namespace App\Http\Controllers\Admin;

use RuntimeException;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminBookingService;
use App\Http\Requests\Admin\AdminBookingRequest;
use App\Http\Requests\Admin\AdminBookingModificationRequest;
use App\Services\Admin\AdminBookingModification\AdminBookingModificationService;
use App\Services\Checkout\RefundService;
use App\Services\UserNotificationService;
use Illuminate\Support\Facades\Log;
use DomainException;

class AdminBookingController extends Controller
{
    public function __construct(
        private AdminBookingService $adminBookingService,
        private AdminBookingModificationService $modificationService,
        private RefundService $refundService,
        private UserNotificationService $userNotification
    ) {}

    /**
     * Danh sách booking (có thể filter theo user_id)
     * GET /api/admin/bookings?user_id=123
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::query()
            ->with([
                'legs.trip.route',
                'legs.trip.bus',
                'legs.items.seat',
                'legs.pickupLocation',
                'legs.dropoffLocation',
            ])
            ->orderBy('created_at', 'desc');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $bookings = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $bookings
        ]);
    }

    /**
     * Tra cứu booking theo mã code.
     * GET /api/admin/bookings/lookup?code=ABC123
     */
    public function lookupByCode(Request $request): JsonResponse
    {
        $code = trim((string) $request->get('code', ''));
        if ($code === '') {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng nhập mã booking',
            ], 400);
        }

        $booking = Booking::with([
            'legs.items.seat',
            'legs.pickupLocation',
            'legs.dropoffLocation',
            'legs.trip',
            'payments', // Thêm payments để check pending additional payment
        ])->where('code', $code)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy booking với mã đã nhập',
            ], 404);
        }

        // Chuẩn hóa payload cho FE
        $legs = $booking->legs->map(function ($leg) {
            $departureTime = null;
            if ($leg->trip && $leg->trip->departure_time) {
                $departureTime = $leg->trip->departure_time instanceof \Carbon\Carbon
                    ? $leg->trip->departure_time->toIso8601String()
                    : (string) $leg->trip->departure_time;
            }

            return [
                'id' => $leg->id,
                'trip_id' => $leg->trip_id,
                'leg_type' => $leg->leg_type,
                'pickup_location_id' => $leg->pickup_location_id,
                'dropoff_location_id' => $leg->dropoff_location_id,
                'pickup_location_name' => optional($leg->pickupLocation)->name,
                'dropoff_location_name' => optional($leg->dropoffLocation)->name,
                'pickup_address' => $leg->pickup_address,
                'dropoff_address' => $leg->dropoff_address,
                'departure_time' => $departureTime,
                'items' => $leg->items->map(function ($item) {
                    return [
                        'booking_item_id' => $item->id,
                        'seat_id' => $item->seat_id,
                        'seat_label' => $item->seat_label ?? optional($item->seat)->seat_number,
                    ];
                })->values(),
            ];
        })
            // Sắp xếp: OUT trước, sau đó đến RETURN (chiều về) để hiển thị trái/phải đẹp
            ->sortBy(function ($leg) {
                // OUT -> 0, RETURN -> 1, các loại khác nếu có -> 2
                return match ($leg['leg_type'] ?? null) {
                    'OUT' => 0,
                    'RETURN' => 1,
                    default => 2,
                };
            })->values();

        // Kiểm tra có pending additional payment không
        $hasPendingAdditionalPayment = $booking->payments()
            ->where('status', 'pending')
            ->whereJsonContains('meta->type', 'additional_payment')
            ->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'booking' => [
                    'id' => $booking->id,
                    'code' => $booking->code,
                    'status' => $booking->status,
                    'passenger_name' => $booking->passenger_name,
                    'passenger_phone' => $booking->passenger_phone,
                    'passenger_email' => $booking->passenger_email,
                    'total_price' => $booking->total_price,
                    'has_pending_additional_payment' => $hasPendingAdditionalPayment,
                    'legs' => $legs,
                ],
            ],
        ]);
    }

    public function store(AdminBookingRequest $request): JsonResponse
    {
        $adminId = $request->user()->id;
        $data = $request->validated();

        try {
            $booking = $this->adminBookingService->createBookingFromAdmin(
                data: $data,
                adminId: $adminId
            );

            return response()->json([
                'success' => true,
                'booking' => $booking,
            ], 201);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 409);
        }
    }

    public function markAsPaid(Booking $booking): JsonResponse
    {
        $adminId = request()->user()->id;

        try {
            $updatedBooking = $this->adminBookingService->markBookingAsPaidManually(
                bookingId: $booking->id,
                adminId: $adminId,
            );

            return response()->json([
                'success' => true,
                'booking' => $updatedBooking,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

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
     * Xem chính sách hoàn tiền (gợi ý)
     * GET /api/admin/bookings/{booking}/refund-policy
     */
    public function getRefundPolicy(int $booking): JsonResponse
    {
        try {
            $bookingModel = Booking::with(['legs.trip', 'payments'])->findOrFail($booking);
            $policy = $this->refundService->calculateRefundPolicy($bookingModel);

            return response()->json([
                'success' => true,
                'data' => $policy,
            ]);
        } catch (\Exception $e) {
            Log::error('Get refund policy error', [
                'booking_id' => $booking,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể tính toán chính sách hoàn tiền.',
            ], 500);
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

    /**
     * Hoàn tiền chênh lệch (từ booking modification)
     * POST /api/admin/bookings/{booking}/refund-price-difference
     */
    public function refundPriceDifference(Request $request, int $booking): JsonResponse
    {
        try {
            $bookingModel = Booking::with(['payments', 'legs.trip'])->findOrFail($booking);
            $admin = $request->user();

            $validated = $request->validate([
                'reason' => 'nullable|string|max:500',
                'bank_account' => 'nullable|string|max:100',
                'bank_name' => 'nullable|string|max:100',
                'transfer_date' => 'nullable|date',
                'transfer_reference' => 'nullable|string|max:100',
                'note' => 'nullable|string|max:1000',
            ]);

            // Chuẩn bị thông tin chuyển khoản
            $bankInfo = null;
            if ($validated['bank_account'] || $validated['bank_name'] || $validated['transfer_date']) {
                $bankInfo = [
                    'bank_account' => $validated['bank_account'] ?? null,
                    'bank_name' => $validated['bank_name'] ?? null,
                    'transfer_date' => $validated['transfer_date'] ?? null,
                    'transfer_reference' => $validated['transfer_reference'] ?? null,
                    'note' => $validated['note'] ?? null,
                ];
            }

            // Gọi refund service cho chênh lệch
            $bookingModel = $this->refundService->refundPriceDifference(
                booking: $bookingModel,
                adminId: $admin->id,
                reason: $validated['reason'] ?? null,
                bankInfo: $bankInfo
            );

            // Load lại payment
            $payment = $bookingModel->payments()
                ->where('status', 'succeeded')
                ->orderBy('id')
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Đã xác nhận hoàn tiền chênh lệch thành công.',
                'data' => [
                    'booking' => [
                        'id' => $bookingModel->id,
                        'code' => $bookingModel->code,
                        'status' => $bookingModel->status,
                    ],
                    'payment' => [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'refund_amount' => $payment->refund_amount,
                        'status' => $payment->status,
                    ],
                ],
            ]);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            Log::error('Refund price difference error', [
                'booking_id' => $booking,
                'admin_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi hoàn tiền chênh lệch. Vui lòng thử lại.',
            ], 500);
        }
    }

    /**
     * Hoàn tiền cả vé (hoàn toàn bộ booking)
     * POST /api/admin/bookings/{booking}/refund
     */
    public function refund(Request $request, int $booking): JsonResponse
    {
        try {
            $bookingModel = Booking::with(['payments', 'legs.trip'])->findOrFail($booking);
            $admin = $request->user();

            $validated = $request->validate([
                'refund_amount' => 'nullable|integer|min:1', // Null = hoàn toàn bộ
                'reason' => 'nullable|string|max:500',
                'bank_account' => 'nullable|string|max:100',
                'bank_name' => 'nullable|string|max:100',
                'transfer_date' => 'nullable|date',
                'transfer_reference' => 'nullable|string|max:100',
                'note' => 'nullable|string|max:1000',
            ]);

            // Chuẩn bị thông tin chuyển khoản
            $bankInfo = null;
            if ($validated['bank_account'] || $validated['bank_name'] || $validated['transfer_date']) {
                $bankInfo = [
                    'bank_account' => $validated['bank_account'] ?? null,
                    'bank_name' => $validated['bank_name'] ?? null,
                    'transfer_date' => $validated['transfer_date'] ?? null,
                    'transfer_reference' => $validated['transfer_reference'] ?? null,
                    'note' => $validated['note'] ?? null,
                ];
            }

            // Gọi refund service cho hoàn cả vé
            $bookingModel = $this->refundService->refundFullBooking(
                booking: $bookingModel,
                adminId: $admin->id,
                refundAmount: $validated['refund_amount'] ?? null, // null = hoàn toàn bộ
                reason: $validated['reason'] ?? null,
                bankInfo: $bankInfo
            );

            // Booking đã được fresh trong service, lấy payment từ đó
            $payment = $bookingModel->payments()
                ->whereIn('status', ['succeeded', 'refunded'])
                ->orderByDesc('id')
                ->first();

            if (!$payment) {
                throw new \RuntimeException('Không tìm thấy payment sau khi hoàn tiền.');
            }
            
            // Send refund notification
            $refundAmount = $validated['refund_amount'] ?? $payment->refund_amount ?? 0;
            $this->userNotification->notifyRefundSuccess($bookingModel, $refundAmount);

            return response()->json([
                'success' => true,
                'message' => 'Đã đánh dấu hoàn tiền thành công.',
                'data' => [
                    'booking' => [
                        'id' => $bookingModel->id,
                        'code' => $bookingModel->code,
                        'status' => $bookingModel->status,
                    ],
                    'payment' => [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'refund_amount' => $payment->refund_amount,
                        'status' => $payment->status,
                    ],
                    'refund_info' => [
                        'refunded_amount' => $validated['refund_amount'] ?? $payment->refund_amount,
                        'total_refunded' => $payment->refund_amount,
                    ],
                ],
            ]);
        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            Log::error('Refund booking error', [
                'booking_id' => $booking,
                'admin_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi đánh dấu hoàn tiền. Vui lòng thử lại.',
            ], 500);
        }
    }
}
