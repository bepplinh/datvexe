<?php

namespace App\Http\Controllers\Admin;

use DomainException;
use RuntimeException;
use App\Models\Booking;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Checkout\RefundService;
use App\Services\Admin\AdminBookingService;
use App\Services\Admin\AdminBookingModification\AdminBookingModificationService;

class AdminRefundController extends Controller
{
    public function __construct(
        private RefundService $refundService,
        private \App\Services\UserNotificationService $userNotification
    ) {}

    /**
     * Xem chính sách hoàn tiền (gợi ý)
     * GET /api/admin/bookings/{booking}/refund-policy
     */
    public function getRefundPolicy(int $booking)
    {
        try {
            $bookingModel = Booking::with(['legs.trip', 'payments'])->findOrFail($booking);
            $policy = $this->refundService->calculateRefundPolicy($bookingModel);

            return response()->json([
                'success' => true,
                'data' => $policy,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Get refund policy error', [
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
     * Hoàn tiền chênh lệch (từ booking modification)
     * POST /api/admin/bookings/{booking}/refund-price-difference
     */
    public function refundPriceDifference(Request $request, int $booking)
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
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Refund price difference error', [
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
    public function refund(Request $request, int $booking)
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
                refundAmount: $validated['refund_amount'] ?? null,
                reason: $validated['reason'] ?? null,
                bankInfo: $bankInfo
            );

            // Booking đã được fresh trong service, lấy payment từ đó
            $payment = $bookingModel->payments()
                ->whereIn('status', ['succeeded', 'refunded'])
                ->orderByDesc('id')
                ->first();

            if (!$payment) {
                throw new RuntimeException('Không tìm thấy payment sau khi hoàn tiền.');
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
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Refund booking error', [
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
