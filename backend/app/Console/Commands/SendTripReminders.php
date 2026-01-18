<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use App\Models\BookingLeg;
use App\Mail\TripReminderMail;
use App\Models\UserNotification;
use App\Events\UserNotificationCreated;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendTripReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trips:send-reminders 
                            {--hours=2 : Hours before departure to send reminder}
                            {--dry-run : Run without actually sending}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send trip reminder notifications to passengers before departure';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $hours = (int) $this->option('hours');
        $dryRun = $this->option('dry-run');

        $now = Carbon::now();
        $reminderWindow = $now->copy()->addHours($hours);

        $this->info("🔍 Looking for trips departing between now and {$reminderWindow->format('Y-m-d H:i:s')}");

        // Find booking legs that:
        // 1. Have a trip departing within the reminder window
        // 2. Haven't been reminded yet
        // 3. Booking is paid/confirmed
        $legs = BookingLeg::query()
            ->whereNull('reminder_sent_at')
            ->whereHas('trip', function ($query) use ($now, $reminderWindow) {
                $query->where('departure_time', '>', $now)
                      ->where('departure_time', '<=', $reminderWindow);
            })
            ->whereHas('booking', function ($query) {
                $query->where('status', 'paid');
            })
            ->with([
                'booking.user',
                'trip.route',
                'trip.bus',
                'items.seat',
                'pickupLocation',
                'dropoffLocation',
            ])
            ->get();

        if ($legs->isEmpty()) {
            $this->info('✅ No reminders to send at this time.');
            return Command::SUCCESS;
        }

        $this->info("📧 Found {$legs->count()} leg(s) to remind");

        $successCount = 0;
        $failCount = 0;

        foreach ($legs as $leg) {
            $booking = $leg->booking;
            $user = $booking->user;
            $email = $booking->passenger_email ?? $user?->email;
            $passengerName = $booking->passenger_name ?? $user?->name ?? 'Quý khách';

            if (!$email) {
                $this->warn("⚠️ No email for booking #{$booking->code}, skipping...");
                continue;
            }

            $departureTime = $leg->trip?->departure_time;

            if ($dryRun) {
                $this->info("🔸 [DRY-RUN] Would send reminder to {$email} for booking #{$booking->code}");
                continue;
            }

            try {
                // Send email
                Mail::to($email)->send(new TripReminderMail($leg));

                // Create web notification if user exists
                if ($user) {
                    $notification = UserNotification::create([
                        'user_id' => $user->id,
                        'type' => 'trip.reminder',
                        'title' => '⏰ Chuyến xe sắp khởi hành',
                        'message' => "Chuyến xe của bạn sẽ khởi hành lúc {$departureTime?->format('H:i')} ngày {$departureTime?->format('d/m/Y')}. Vui lòng có mặt tại điểm đón trước 15-30 phút.",
                        'booking_id' => $booking->id,
                        'data' => [
                            'booking_code' => $booking->code,
                            'departure_time' => $departureTime?->toISOString(),
                            'pickup_address' => $leg->pickup_address,
                            'seat_count' => $leg->items?->count(),
                        ],
                    ]);

                    // Broadcast to user
                    event(new UserNotificationCreated($notification));
                }

                // Mark as reminded
                $leg->update(['reminder_sent_at' => now()]);

                $this->info("✅ Sent reminder to {$email} for booking #{$booking->code}");
                $successCount++;

            } catch (\Exception $e) {
                Log::error("Failed to send trip reminder", [
                    'booking_id' => $booking->id,
                    'leg_id' => $leg->id,
                    'email' => $email,
                    'error' => $e->getMessage(),
                ]);
                $this->error("❌ Failed to send to {$email}: {$e->getMessage()}");
                $failCount++;
            }
        }

        $this->newLine();
        $this->info("📊 Summary: {$successCount} sent, {$failCount} failed");

        return Command::SUCCESS;
    }
}
