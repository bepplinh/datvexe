<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Contracts\Queue\ShouldQueue;

class BookingCancelledMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;
    public string $reason;
    
    public function __construct(Booking $booking, string $reason = '')
    {
        $this->booking = $booking->load([
            'legs.trip.route',
            'legs.items.seat',
            'legs.pickupLocation',
            'legs.dropoffLocation',
        ]);
        $this->reason = $reason;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '❌ Thông báo hủy vé - Mã vé #' . $this->booking->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking_cancelled',
            with: [
                'booking' => $this->booking,
                'reason' => $this->reason,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
