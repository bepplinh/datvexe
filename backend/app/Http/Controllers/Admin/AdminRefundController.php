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
        private AdminBookingService $adminBookingService,
        private RefundService $refundService,
        private AdminBookingModificationService $modificationService,
    ) {}

    public function refund(Request $request, int $booking)
    {
        try {
            $bookingModel = Booking::with(['payments', 'legs.trip'])->findOrFail($booking);
            $admin = $request->user();

            $validated = $request->validate([
                'refund_amount' => 'required|integer|min:1',
                'reason' => 'nullable|string|max:500',
                'bank_account' => 'nullable|string|max:100', // Số tài khoản đã chuyển
                'bank_name' => 'nullable|string|max:100',   // Tên ngân hàng
                'transfer_date' => 'nullable|date',           // Ngày chuyển khoản
                'transfer_reference' => 'nullable|string|max:100', // Mã tham chiếu giao dịch
                'note' => 'nullable|string|max:1000',        // Ghi chú thêm
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

            $bookingModel = $this->refundService->refundByAdmin(
                booking: $bookingModel,
                adminId: $admin->id,
                refundAmount: $validated['refund_amount'],
                reason: $validated['reason'] ?? null,
                bankInfo: $bankInfo
            );

            // Load lại payment để trả về thông tin đầy đủ
            $bookingModel->load('payments');

            $payment = $bookingModel->payments()
                ->where('status', 'succeeded')
                ->orderByDesc('id')
                ->first();

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
                        'refunded_amount' => $validated['refund_amount'],
                        'total_refunded' => $payment->refund_amount,
                        'remaining_paid' => $payment->amount - $payment->refund_amount,
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
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi đánh dấu hoàn tiền. Vui lòng thử lại.',
            ], 500);
        }
    }
}
