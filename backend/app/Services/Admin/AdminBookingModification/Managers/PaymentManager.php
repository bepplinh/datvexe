<?php

namespace App\Services\Admin\AdminBookingModification\Managers;

use App\Models\Booking;
use App\Models\Payment;

class PaymentManager
{
    public function updateBookingPrice(Booking $booking, array $priceInfo, int $adminId): void
    {
        $difference = $priceInfo['difference'];

        $booking->update([
            'subtotal_price' => $booking->subtotal_price + $difference,
            'total_price' => $booking->total_price + $difference,
        ]);

        if ($difference > 0) {
            $this->createAdditionalPayment($booking, $difference, $adminId);
        } elseif ($difference < 0) {
            $this->createRefund($booking, abs($difference), $adminId);
        }
    }

    private function createAdditionalPayment(Booking $booking, float $amount, int $adminId): void
    {
        Payment::create([
            'booking_id' => $booking->id,
            'amount' => $amount,
            'fee' => 0,
            'refund_amount' => 0,
            'currency' => $booking->currency ?? 'VND',
            'provider' => $booking->payment_provider ?? 'cash',
            'status' => 'pending',
            'meta' => [
                'type' => 'additional_payment',
                'reason' => 'booking_modification',
                'modified_by_admin_id' => $adminId,
            ],
        ]);
    }

    /**
     * Ghi nhận chênh lệch cần hoàn khi đổi chuyến giá giảm
     * CHỈ GHI NHẬN trong meta, KHÔNG cập nhật refund_amount
     * refund_amount chỉ được cập nhật khi admin thực sự hoàn tiền
     */
    private function createRefund(Booking $booking, float $amount, int $adminId): void
    {
        $payment = $booking->payments()
            ->where('status', 'succeeded')
            ->orderBy('id') // Lấy payment gốc
            ->first();

        if ($payment) {
            $meta = $payment->meta ?? [];
            
            // Ghi nhận chênh lệch cần hoàn (chưa thực sự hoàn)
            if (!isset($meta['pending_refunds_from_modification'])) {
                $meta['pending_refunds_from_modification'] = [];
            }

            $meta['pending_refunds_from_modification'][] = [
                'amount' => $amount,
                'reason' => 'booking_modification_price_difference',
                'modified_by_admin_id' => $adminId,
                'recorded_at' => now()->toIso8601String(),
                'status' => 'pending', // Chưa hoàn thực tế
            ];

            // Tính tổng chênh lệch cần hoàn
            $totalPendingRefund = array_sum(
                array_column($meta['pending_refunds_from_modification'], 'amount')
            );

            $meta['total_pending_refund_from_modification'] = $totalPendingRefund;
            $meta['last_modification_refund_recorded_at'] = now()->toIso8601String();

            // KHÔNG cập nhật refund_amount ở đây
            // Chỉ cập nhật meta để track
            $payment->update([
                'meta' => $meta,
            ]);

            // KHÔNG cập nhật booking status ở đây
            // Vì chưa thực sự hoàn tiền, chỉ ghi nhận chênh lệch
        }
    }
}

