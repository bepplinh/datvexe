<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Contracts\Queue\ShouldQueue;

class SeatChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;
    public string $oldSeats;
    public string $newSeats;
    
    public function __construct(Booking $booking, string $oldSeats, string $newSeats)
    {
        $this->booking = $booking->load([
            'legs.trip.route',
            'legs.items.seat',
            'legs.pickupLocation',
            'legs.dropoffLocation',
        ]);
        $this->oldSeats = $oldSeats;
        $this->newSeats = $newSeats;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '💺 Thông báo thay đổi ghế - Mã vé #' . $this->booking->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.seat_changed',
            with: [
                'booking' => $this->booking,
                'oldSeats' => $this->oldSeats,
                'newSeats' => $this->newSeats,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
