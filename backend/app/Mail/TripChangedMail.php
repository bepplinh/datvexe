<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Contracts\Queue\ShouldQueue;

class TripChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;
    public string $oldTripInfo;
    public string $newTripInfo;
    
    public function __construct(Booking $booking, string $oldTripInfo, string $newTripInfo)
    {
        $this->booking = $booking->load([
            'legs.trip.route',
            'legs.trip.bus',
            'legs.items.seat',
            'legs.pickupLocation',
            'legs.dropoffLocation',
        ]);
        $this->oldTripInfo = $oldTripInfo;
        $this->newTripInfo = $newTripInfo;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔄 Thông báo thay đổi chuyến xe - Mã vé #' . $this->booking->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.trip_changed',
            with: [
                'booking' => $this->booking,
                'oldTripInfo' => $this->oldTripInfo,
                'newTripInfo' => $this->newTripInfo,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
