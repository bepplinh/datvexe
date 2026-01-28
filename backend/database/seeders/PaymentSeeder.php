<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $bookings = Booking::all();

        if ($bookings->isEmpty()) {
            $this->command?->warn('⚠️ Cannot seed payments: no bookings found.');
            return;
        }

        $this->command?->info("🚀 Creating payments for {$bookings->count()} bookings...");

        foreach ($bookings as $booking) {
            // Avoid duplicate seeding
            if ($booking->payments()->exists()) {
                continue;
            }

            // --- 1. Main Payment ---
            $paymentStatus = match ($booking->status) {
                'paid' => 'succeeded',
                'cancelled' => 'canceled', // or refunded if fully refunded
                default => 'pending',
            };

            // Randomly decide if this booking has a refund or modification (only for paid bookings)
            $hasRefund = $paymentStatus === 'succeeded' && rand(1, 100) <= 10; // 10% chance
            $hasModification = $paymentStatus === 'succeeded' && rand(1, 100) <= 50; // 50% chance - increased for better data

            $refundAmount = 0;
            $meta = [
                'booking_code' => $booking->code,
                'generated_from_booking' => true,
            ];

            // Setup Refund Data
            if ($hasRefund) {
                $refundType = rand(1, 100) <= 30 ? 'full' : 'partial';
                
                if ($refundType === 'full') {
                    $refundAmount = $booking->total_price;
                    $paymentStatus = 'refunded'; // Mark payment as refunded
                    // Booking might be cancelled in real logic, but here we just simulate payment state
                    
                    $meta['refunds'][] = [
                        'amount' => $refundAmount,
                        'reason' => 'Khách yêu cầu hủy vé (Seeder)',
                        'refunded_by_admin_id' => 1,
                        'refunded_at' => now()->subHours(rand(1, 48))->toIso8601String(),
                        'method' => 'manual_bank_transfer',
                        'type' => 'full_booking_refund',
                    ];
                } else {
                    $refundAmount = round($booking->total_price * rand(10, 50) / 100, -3); // 10-50%
                    
                    $meta['refunds'][] = [
                        'amount' => $refundAmount,
                        'reason' => 'Hoàn tiền thiện chí / lỗi hệ thống (Seeder)',
                        'refunded_by_admin_id' => 1,
                        'refunded_at' => now()->subHours(rand(1, 48))->toIso8601String(),
                        'method' => 'manual_bank_transfer',
                        'type' => 'manual_refund',
                    ];
                }
                
                $meta['last_refund_at'] = now()->toIso8601String();
            }

            // Create Main Payment
            $mainPayment = Payment::create([
                'booking_id' => $booking->id,
                'amount' => $booking->total_price,
                'fee' => 0,
                'refund_amount' => $refundAmount,
                'currency' => 'VND',
                'provider' => $booking->payment_provider ?? 'payos',
                'provider_txn_id' => $booking->payment_intent_id ?? ('txn_' . Str::random(20)),
                'status' => $paymentStatus,
                'paid_at' => $booking->paid_at ?? ($paymentStatus === 'succeeded' || $paymentStatus === 'refunded' ? now()->subDays(rand(1, 10)) : null),
                'refunded_at' => $refundAmount > 0 ? now() : null,
                'meta' => $meta,
            ]);

            // --- 2. Modification Simulations ---
            if ($hasModification && !$hasRefund) {
                $modType = rand(1, 2) === 1 ? 'increase' : 'decrease';

                if ($modType === 'increase') {
                    // Scenario: Change Seat/Trip -> Price Increase -> Additional Payment
                    $additionalAmount = rand(50000, 150000);
                    
                    Payment::create([
                        'booking_id' => $booking->id,
                        'amount' => $additionalAmount,
                        'fee' => 0,
                        'refund_amount' => 0,
                        'currency' => 'VND',
                        'provider' => 'payos',
                        'status' => 'succeeded',
                        'paid_at' => now()->subHours(rand(1, 24)),
                        'meta' => [
                            'type' => 'additional_payment',
                            'reason' => 'booking_modification',
                            'modified_by_admin_id' => 1,
                            'description' => 'Thu thêm tiền đổi vé (Seeder)'
                        ],
                    ]);
                } else {
                    // Scenario: Change Seat/Trip -> Price Decrease -> Pending Refund in Meta
                    $diffAmount = rand(20000, 50000);
                    
                    $currentMeta = $mainPayment->meta ?? [];
                    
                    if (!isset($currentMeta['pending_refunds_from_modification'])) {
                        $currentMeta['pending_refunds_from_modification'] = [];
                    }
                    
                    $currentMeta['pending_refunds_from_modification'][] = [
                        'amount' => $diffAmount,
                        'reason' => 'booking_modification_price_difference',
                        'modified_by_admin_id' => 1,
                        'recorded_at' => now()->subHours(rand(1, 24))->toIso8601String(),
                        'status' => 'pending', // Simulate pending refund
                    ];
                    
                    $currentMeta['total_pending_refund_from_modification'] = $diffAmount;
                    
                    $mainPayment->update(['meta' => $currentMeta]);
                }
            }
        }

        // --- 3. Guaranteed Modification Records ---
        // Create 15 guaranteed modification records for testing/demo purposes
        $this->command?->info("📝 Creating guaranteed modification records...");
        
        $paidBookings = Booking::where('status', 'paid')
            ->whereHas('payments', function($q) {
                $q->where('status', 'succeeded');
            })
            ->limit(15)
            ->get();

        if ($paidBookings->count() >= 15) {
            foreach ($paidBookings->take(8) as $index => $booking) {
                // Price Increase: Additional Payment
                Payment::create([
                    'booking_id' => $booking->id,
                    'amount' => rand(50000, 200000),
                    'fee' => 0,
                    'refund_amount' => 0,
                    'currency' => 'VND',
                    'provider' => 'payos',
                    'status' => 'succeeded',
                    'paid_at' => now()->subHours(rand(1, 72)),
                    'meta' => [
                        'type' => 'additional_payment',
                        'reason' => 'booking_modification',
                        'modified_by_admin_id' => 1,
                        'description' => 'Đổi chuyến/ghế - Thu thêm tiền (Guaranteed Seeder)'
                    ],
                ]);
            }

            foreach ($paidBookings->skip(8)->take(7) as $booking) {
                // Price Decrease: Pending Refund in Meta
                $mainPayment = $booking->payments()->where('status', 'succeeded')->first();
                
                if ($mainPayment) {
                    $currentMeta = $mainPayment->meta ?? [];
                    
                    if (!isset($currentMeta['pending_refunds_from_modification'])) {
                        $currentMeta['pending_refunds_from_modification'] = [];
                    }
                    
                    $diffAmount = rand(30000, 100000);
                    $currentMeta['pending_refunds_from_modification'][] = [
                        'amount' => $diffAmount,
                        'reason' => 'booking_modification_price_difference',
                        'modified_by_admin_id' => 1,
                        'recorded_at' => now()->subHours(rand(1, 72))->toIso8601String(),
                        'status' => 'pending',
                    ];
                    
                    $currentMeta['total_pending_refund_from_modification'] = 
                        ($currentMeta['total_pending_refund_from_modification'] ?? 0) + $diffAmount;
                    
                    $mainPayment->update(['meta' => $currentMeta]);
                }
            }
            
            $this->command?->info("✅ Created 15 guaranteed modification records (8 increases, 7 decreases).");
        } else {
            $this->command?->warn("⚠️ Not enough paid bookings to create 15 guaranteed modifications.");
        }

        $this->command?->info("✅ Payment seeding completed with refunds and modifications.");
    }
}

