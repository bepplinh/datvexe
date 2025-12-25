<?php

namespace App\Services\Checkout;

use App\Models\Booking;
use App\Models\BookingLeg;
use App\Models\BookingItem;
use App\Models\CouponUsage;
use App\Models\Payment;
use Illuminate\Support\Str;
use App\Models\DraftCheckout;
use App\Models\TripSeatStatus;

class BookingService
{
    private function generateBookingCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (Booking::where('code', $code)->exists()); // Lặp lại nếu mã đã tồn tại

        return $code;
    }

    public function createFromDraft(DraftCheckout $draft)
    {
        // 0) Chuẩn bị dữ liệu / idempotency guard
        if (!$draft->relationLoaded('items') || !$draft->relationLoaded('legs')) {
            $draft->load(['items', 'legs']);
        }

        if ($draft->booking_id) {
            $existing = Booking::with(['legs.items'])->findOrFail($draft->booking_id);
            return $existing;
        }

        $booking = Booking::create([
            'user_id'           => $draft->user_id,
            'code'              => $this->generateBookingCode(),
            'status'            => 'paid',
            'payment_provider'  => $draft->payment_provider,
            'payment_intent_id' => $draft->payment_intent_id,
            'passenger_name'    => $draft->passenger_name,
            'passenger_phone'   => $draft->passenger_phone,
            'passenger_email'   => $draft->passenger_email,
            'currency'          => $draft->currency ?? 'VND',
            'total_price'       => $draft->total_price,
            'subtotal_price'    => $draft->subtotal_price,
            'discount_amount'   => $draft->discount_amount,
            'coupon_id'         => $draft->coupon_id,
            'completed_at'      => now(),
        ]);

        // Map draft_leg_id → booking_leg_id
        $legIdMap = [];

        // 2️⃣ Copy các leg sang booking_legs
        $mapByDraftLegId = [];
        $mapByTripId     = [];
        foreach ($draft->legs as $leg) {
            $bookingLeg = BookingLeg::create([
                'booking_id'            => $booking->id,
                'leg_type'              => $leg->leg,
                'trip_id'               => $leg->trip_id,
                'pickup_location_id'    => $leg->pickup_location_id,
                'dropoff_location_id'   => $leg->dropoff_location_id,
                'pickup_snapshot'       => $leg->pickup_snapshot,
                'dropoff_snapshot'      => $leg->dropoff_snapshot,
                'pickup_address'        => $leg->pickup_address,
                'dropoff_address'       => $leg->dropoff_address,
                'total_price'           => $leg->total_price,
            ]);


            // map theo draft_leg_id và theo trip_id (fallback)
            $mapByDraftLegId[$leg->id]   = $bookingLeg->id;
            $mapByTripId[$leg->trip_id]  = $bookingLeg->id;
        }

        // 3) Tạo booking_items: phải chọn đúng booking_leg_id cho từng item
        foreach ($draft->items as $item) {
            // ưu tiên dùng draft_checkout_leg_id nếu có
            $bookingLegId = null;

            if (!empty($item->draft_checkout_leg_id) && isset($mapByDraftLegId[$item->draft_checkout_leg_id])) {
                $bookingLegId = $mapByDraftLegId[$item->draft_checkout_leg_id];
            } elseif (!empty($item->trip_id) && isset($mapByTripId[$item->trip_id])) {
                // fallback theo trip_id
                $bookingLegId = $mapByTripId[$item->trip_id];
            }

            if (!$bookingLegId) {
                throw new \RuntimeException(
                    "Không tìm thấy booking_leg cho item seat {$item->seat_id} (trip {$item->trip_id})."
                );
            }

            BookingItem::create([
                // nếu bảng booking_items có cả booking_id thì thêm vào:
                // 'booking_id'     => $booking->id,
                'booking_leg_id' => $bookingLegId,
                'seat_id'        => $item->seat_id,
                'seat_label'     => $item->seat_label,
                'price'          => $item->price ?? 0,
            ]);
        }

        // 4️⃣ Record coupon usage (chỉ gọi 1 lần sau khi tạo xong booking)
        $this->recordCouponUsage($booking);

        // 5️⃣ Tạo payment record nếu booking đã được thanh toán
        if ($booking->status === 'paid') {
            $this->createPaymentRecord($booking, $draft);
        }

        // 6️⃣ Load lại toàn bộ quan hệ
        $booking->load(['legs.items']);

        return $booking;
    }

    public function markBooked(int $tripId, array $seatIds, Booking $booking)
    {
        $seatIds = array_values(array_unique(array_map('intval', $seatIds)));
        if (empty($seatIds)) return 0;

        $now  = now();
        $rows = [];

        foreach ($seatIds as $seatId) {
            $rows[] = [
                'trip_id'            => $tripId,
                'seat_id'            => $seatId,
                'booking_id'         => $booking->id,
                'is_booked'          => true,
                'booked_by_user_id'  => (int) $booking->user_id,
                'booked_at'          => $now,
                'created_at'         => $now,
                'updated_at'         => $now,
            ];
        }

        // Upsert theo unique (trip_id, seat_id)
        // - Nếu bản ghi chưa có → insert
        // - Nếu đã có → cập nhật sang trạng thái booked + gắn booking_id
        TripSeatStatus::upsert(
            $rows,
            ['trip_id', 'seat_id'],
            ['booking_id', 'is_booked', 'booked_by_user_id', 'booked_at', 'updated_at']
        );

        return count($rows);
    }

    public function recordCouponUsage(Booking $booking)
    {
        if (!$booking->coupon_id || $booking->discount_amount <= 0) {
            return null;
        }

        // Kiểm tra xem đã có record chưa để tránh duplicate
        $existingUsage = CouponUsage::where('booking_id', $booking->id)
            ->where('coupon_id', $booking->coupon_id)
            ->first();

        if ($existingUsage) {
            return $existingUsage;
        }

        $usageCoupon = CouponUsage::create([
            'coupon_id' => $booking->coupon_id,
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'discount_amount' => $booking->discount_amount
        ]);

        return $usageCoupon;
    }

    /**
     * Tạo payment record cho booking đã thanh toán
     */
    private function createPaymentRecord(Booking $booking, DraftCheckout $draft): ?Payment
    {
        // Kiểm tra xem đã có payment record chưa để tránh duplicate
        $existingPayment = Payment::where('booking_id', $booking->id)->first();
        if ($existingPayment) {
            return $existingPayment;
        }

        // Xác định status của payment dựa trên booking status
        $paymentStatus = match ($booking->status) {
            'paid' => 'succeeded',
            'cancelled' => 'canceled',
            default => 'pending',
        };

        // Tạo payment record
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'amount' => $booking->total_price,
            'fee' => 0,
            'refund_amount' => 0,
            'currency' => $booking->currency ?? 'VND',
            'provider' => $booking->payment_provider ?? 'cash',
            'provider_txn_id' => $booking->payment_intent_id,
            'status' => $paymentStatus,
            'paid_at' => $paymentStatus === 'succeeded' ? ($booking->paid_at ?? now()) : null,
            'refunded_at' => null,
            'meta' => [
                'booking_code' => $booking->code,
                'created_from_draft' => true,
                'draft_id' => $draft->id ?? null,
            ],
            'raw_request' => null,
            'raw_response' => null,
        ]);

        return $payment;
    }
}
