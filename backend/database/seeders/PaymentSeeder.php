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
            // Avoid duplicate seeding if payments already exist for this booking
            if ($booking->payments()->exists()) {
                continue;
            }

            // Map booking status to payment status
            $paymentStatus = match ($booking->status) {
                'paid' => 'succeeded',
                'cancelled' => 'canceled',
                default => 'pending',
            };

            Payment::create([
                'booking_id' => $booking->id,
                'amount' => $booking->total_price,
                'fee' => 0,
                'refund_amount' => 0,
                'currency' => 'VND',
                'provider' => $booking->payment_provider ?? 'cash',
                'provider_txn_id' => $booking->payment_intent_id ?? ('txn_' . Str::random(20)),
                'status' => $paymentStatus,
                'paid_at' => $booking->paid_at ?? ($paymentStatus === 'succeeded' ? now() : null),
                'refunded_at' => null,
                'meta' => [
                    'booking_code' => $booking->code,
                    'generated_from_booking' => true,
                ],
                'raw_request' => null,
                'raw_response' => null,
            ]);
        }

        $this->command?->info("✅ Payment seeding completed.");
    }
}
