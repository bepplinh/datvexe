<?php

namespace App\Services\Checkout;

use DomainException;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\TripSeatStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RefundService
{
    /**
     * Hoàn tiền chênh lệch (từ booking modification - đổi chuyến giá giảm)
     * 
     * @param Booking $booking
     * @param int $adminId
     * @param string|null $reason
     * @param array|null $bankInfo
     * @return Booking
     */
    public function refundPriceDifference(
        Booking $booking,
        int $adminId,
        ?string $reason = null,
        ?array $bankInfo = null
    ) {
        return DB::transaction(function () use ($booking, $adminId, $reason, $bankInfo) {
            if ($booking->status !== 'paid') {
                throw new DomainException('Chỉ cho phép hoàn tiền đơn đã thanh toán.');
            }

            // Lấy payment gốc
            $payment = $booking->payments()
                ->where('status', 'succeeded')
                ->orderBy('id')
                ->first();

            if (!$payment) {
                throw new DomainException('Không tìm thấy payment thành công cho đơn này.');
            }

            $meta = $payment->meta ?? [];
            $pendingRefundFromModification = (int) ($meta['total_pending_refund_from_modification'] ?? 0);

            if ($pendingRefundFromModification <= 0) {
                throw new DomainException('Không có chênh lệch cần hoàn từ booking modification.');
            }

            // Tính tổng đã trả
            $totalPaid = (int) $booking->payments()
                ->where('status', 'succeeded')
                ->sum('amount');

            // Số tiền đã hoàn thực tế
            $alreadyRefunded = (int) ($payment->refund_amount ?? 0);

            // Hoàn phần chênh lệch
            $refundAmount = $pendingRefundFromModification;
            $newRefundAmount = $alreadyRefunded + $refundAmount;
            $isFullRefund = $newRefundAmount >= $totalPaid;

            // Đánh dấu các pending refunds đã được hoàn
            if (isset($meta['pending_refunds_from_modification'])) {
                foreach ($meta['pending_refunds_from_modification'] as &$pendingRefund) {
                    if (($pendingRefund['status'] ?? 'pending') === 'pending') {
                        $pendingRefund['status'] = 'refunded';
                        $pendingRefund['refunded_at'] = now()->toIso8601String();
                        $pendingRefund['refunded_by_admin_id'] = $adminId;
                    }
                }
                unset($pendingRefund);
            }

            // Ghi refund record
            if (!isset($meta['refunds'])) {
                $meta['refunds'] = [];
            }

            $refundRecord = [
                'amount' => $refundAmount,
                'reason' => $reason ?? 'refund_price_difference',
                'refunded_by_admin_id' => $adminId,
                'refunded_at' => now()->toIso8601String(),
                'method' => 'manual_bank_transfer',
                'type' => 'price_difference', // Đánh dấu là hoàn chênh lệch
                'includes_modification_refund' => true,
                'modification_refund_amount' => $refundAmount,
                'manual_refund_amount' => 0,
            ];

            if ($bankInfo) {
                $refundRecord['bank_info'] = $bankInfo;
            }

            $meta['refunds'][] = $refundRecord;
            $meta['total_pending_refund_from_modification'] = 0; // Reset
            $meta['refund_reason'] = $reason ?? 'refund_price_difference';
            $meta['refunded_by_admin_id'] = $adminId;
            $meta['last_refund_at'] = now()->toIso8601String();

            // Cập nhật payment
            $payment->update([
                'refund_amount' => $newRefundAmount,
                'refunded_at' => now(),
                'status' => $isFullRefund ? 'refunded' : $payment->status,
                'meta' => $meta,
            ]);

            // Nếu full refund, cập nhật booking
            if ($isFullRefund) {
                $booking->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

                TripSeatStatus::where('booking_id', $booking->id)
                    ->update([
                        'is_booked' => false,
                        'booked_by_user_id' => null,
                        'booked_at' => null,
                    ]);
            }

            return $booking->fresh(['legs.items', 'payments']);
        });
    }

    /**
     * Hoàn tiền cả vé (hoàn toàn bộ booking)
     *
     * @param Booking $booking
     * @param int $adminId
     * @param int|null $refundAmount Số tiền hoàn (null = hoàn toàn bộ)
     * @param string|null $reason Lý do hoàn tiền
     * @param array|null $bankInfo Thông tin chuyển khoản
     * @return Booking
     * @throws DomainException
     * @throws RuntimeException
     */
    public function refundFullBooking(
        Booking $booking,
        int $adminId,
        ?int $refundAmount = null,
        ?string $reason = null,
        ?array $bankInfo = null
    ) {
        return DB::transaction(function () use ($booking, $adminId, $refundAmount, $bankInfo) {
            if ($booking->status !== 'paid') {
                throw new DomainException('Chỉ cho phép hoàn tiền đơn đã thanh toán.');
            }

            // Lấy payment gốc (initial payment) - payment đầu tiên succeeded
            $payment = $booking->payments()
                ->where('status', 'succeeded')
                ->orderBy('id') // Lấy payment đầu tiên (initial payment)
                ->first();

            if (!$payment) {
                throw new DomainException('Không tìm thấy payment thành công cho đơn này.');
            }

            // Tính tổng đã trả (initial + additional payments đã succeeded)
            $totalPaid = (int) $booking->payments()
                ->where('status', 'succeeded')
                ->sum('amount');

            // Số tiền đã hoàn thực tế
            $alreadyRefunded = (int) ($payment->refund_amount ?? 0);
            
            // Nếu không chỉ định số tiền, hoàn toàn bộ
            if ($refundAmount === null) {
                $refundAmount = $totalPaid - $alreadyRefunded;
            }

            if ($refundAmount <= 0) {
                throw new DomainException('Số tiền hoàn phải lớn hơn 0.');
            }
            
            // Số tiền có thể hoàn = tổng đã trả - đã hoàn thực tế
            $maxRefundable = $totalPaid - $alreadyRefunded;

            if ($refundAmount > $maxRefundable) {
                throw new DomainException(
                    "Số tiền hoàn ({$refundAmount}) vượt quá số tiền có thể hoàn ({$maxRefundable})."
                );
            }

            $newRefundAmount = $alreadyRefunded + $refundAmount;
            // Full refund khi tổng đã hoàn >= tổng đã trả (không chỉ payment gốc)
            $isFullRefund = $newRefundAmount >= $totalPaid;

            $meta = $payment->meta ?? [];
            if (!isset($meta['refunds'])) {
                $meta['refunds'] = [];
            }

            // Kiểm tra xem số tiền hoàn có bao gồm phần chênh lệch từ modification không
            $pendingRefundFromModification = (int) ($meta['total_pending_refund_from_modification'] ?? 0);
            $refundedFromModification = 0;
            $refundedFromManual = $refundAmount;

            // Nếu có pending refund từ modification và số tiền hoàn >= pending
            if ($pendingRefundFromModification > 0 && $refundAmount >= $pendingRefundFromModification) {
                // Đánh dấu đã hoàn phần chênh lệch
                $refundedFromModification = $pendingRefundFromModification;
                $refundedFromManual = $refundAmount - $pendingRefundFromModification;
                
                // Cập nhật status của các pending refunds
                if (isset($meta['pending_refunds_from_modification'])) {
                    foreach ($meta['pending_refunds_from_modification'] as &$pendingRefund) {
                        if (($pendingRefund['status'] ?? 'pending') === 'pending') {
                            $pendingRefund['status'] = 'refunded';
                            $pendingRefund['refunded_at'] = now()->toIso8601String();
                            $pendingRefund['refunded_by_admin_id'] = $adminId;
                        }
                    }
                    unset($pendingRefund);
                }
                
                // Reset pending refund
                $meta['total_pending_refund_from_modification'] = 0;
            }

            $refundRecord = [
                'amount' => $refundAmount,
                'reason' => $reason ?? 'admin_manual_refund',
                'refunded_by_admin_id' => $adminId,
                'refunded_at' => now()->toIso8601String(),
                'method' => 'manual_bank_transfer',
                'type' => 'full_booking_refund', // Đánh dấu là hoàn cả vé
                'includes_modification_refund' => $refundedFromModification > 0,
                'modification_refund_amount' => $refundedFromModification,
                'manual_refund_amount' => $refundedFromManual,
            ];

            if ($bankInfo) {
                $refundRecord['bank_info'] = $bankInfo;
            }

            if (!isset($meta['refunds'])) {
                $meta['refunds'] = [];
            }
            $meta['refunds'][] = $refundRecord;
            $meta['refund_reason'] = $reason ?? 'admin_manual_refund';
            $meta['refunded_by_admin_id'] = $adminId;
            $meta['last_refund_at'] = now()->toIso8601String();

            // Update payment trong transaction
            $paymentUpdated = $payment->update([
                'refund_amount' => $newRefundAmount,
                'refunded_at' => now(),
                'status' => $isFullRefund ? 'refunded' : $payment->status,
                'meta' => $meta,
            ]);

            if (!$paymentUpdated) {
                throw new \RuntimeException('Không thể cập nhật payment. Vui lòng thử lại.');
            }

            // Nếu full refund, cập nhật booking và giải phóng ghế
            if ($isFullRefund) {
                $bookingUpdated = $booking->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

                if (!$bookingUpdated) {
                    throw new \RuntimeException('Không thể cập nhật booking. Vui lòng thử lại.');
                }

                // Giải phóng ghế - chỉ update is_booked, không xóa booking_id để giữ lịch sử
                $seatsUpdated = TripSeatStatus::where('booking_id', $booking->id)
                    ->update([
                        'is_booked' => false,
                        'booked_by_user_id' => null,
                        'booked_at' => null,
                    ]);

                // Log nếu không update được ghế (không throw exception vì không critical)
                if ($seatsUpdated === false) {
                    Log::warning('Failed to update TripSeatStatus on refund', [
                        'booking_id' => $booking->id,
                    ]);
                }
            }

            // Return booking đã được refresh - tất cả trong transaction
            return $booking->fresh(['legs.items', 'payments']);
        });
    }

    /**
     * Tính % hoàn tiền theo chính sách (dùng để gợi ý cho admin)
     * 
     * @param Booking $booking
     * @return array ['percent' => int, 'max_refundable' => int, 'hours_until_departure' => int]
     */
    public function calculateRefundPolicy(Booking $booking): array
    {
        $booking->loadMissing(['legs.trip', 'payments']);

        // Lấy giờ xuất bến từ leg đầu tiên (outbound)
        $firstLeg = $booking->legs
            ->sortBy(function ($leg) {
                return match ($leg->leg_type ?? null) {
                    'OUT' => 0,
                    'RETURN' => 1,
                    default => 2,
                };
            })
            ->first();

        $hoursUntilDeparture = null;
        $departureTime = null;

        if ($firstLeg && $firstLeg->trip && $firstLeg->trip->departure_time) {
            $departureTime = Carbon::parse($firstLeg->trip->departure_time);
            $now = Carbon::now();
            $hoursUntilDeparture = $now->diffInHours($departureTime, false);
        }

        // Tính % theo chính sách
        $percent = 0;
        if ($hoursUntilDeparture !== null) {
            if ($hoursUntilDeparture < 0) {
                $percent = 0; // Đã quá giờ xuất bến
            } elseif ($hoursUntilDeparture >= 24) {
                $percent = 100; // Trước 24h: 100%
            } elseif ($hoursUntilDeparture >= 4) {
                $percent = 50;  // Trước 4-24h: 50%
            } else {
                $percent = 0;   // < 4h: 0%
            }
        }

        // Tính số tiền có thể hoàn tối đa
        // Lấy payment gốc (initial payment)
        $payment = $booking->payments()
            ->where('status', 'succeeded')
            ->orderBy('id')
            ->first();

        $totalPaid = 0;
        $totalAlreadyRefunded = 0;
        $paymentAmount = 0;
        $pendingRefundFromModification = 0;

        if ($payment) {
            $paymentMeta = $payment->meta ?? [];
            $paymentAmount = (int) $payment->amount;
            $totalAlreadyRefunded = (int) ($payment->refund_amount ?? 0);
            
            // Lấy số tiền chênh lệch cần hoàn (từ booking modification, chưa hoàn thực tế)
            $pendingRefundFromModification = (int) ($paymentMeta['total_pending_refund_from_modification'] ?? 0);
        }

        // Tính tổng đã trả (initial + additional payments đã succeeded)
        $totalPaid = (int) $booking->payments()
            ->where('status', 'succeeded')
            ->sum('amount');

        // Số tiền có thể hoàn tối đa = tổng đã trả - đã hoàn thực tế
        // (KHÔNG trừ pending_refund vì chưa hoàn thực tế)
        $maxRefundable = max(0, $totalPaid - $totalAlreadyRefunded);

        // Suggested refund amount: tính dựa trên số tiền còn lại có thể hoàn
        // Có thể bao gồm cả phần chênh lệch chưa hoàn nếu admin muốn
        $suggestedRefundAmount = 0;
        if ($percent > 0 && $maxRefundable > 0) {
            $suggestedRefundAmount = (int) floor($maxRefundable * $percent / 100);
        }

        return [
            'percent' => $percent,
            'max_refundable' => $maxRefundable,
            'suggested_refund_amount' => $suggestedRefundAmount,
            'hours_until_departure' => $hoursUntilDeparture,
            'departure_time' => $departureTime?->toIso8601String(),
            'total_price' => (int) ($booking->total_price ?? 0),
            'payment_amount' => $paymentAmount,
            'total_paid' => $totalPaid, // Tổng đã trả (initial + additional)
            'already_refunded' => $totalAlreadyRefunded, // Tổng đã hoàn thực tế
            'pending_refund_from_modification' => $pendingRefundFromModification, // Chênh lệch chưa hoàn
        ];
    }
}
