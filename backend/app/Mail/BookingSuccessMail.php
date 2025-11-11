<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Contracts\Queue\ShouldQueue;

class BookingSuccessMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;
    
    public function __construct(Booking $booking)
    {
        $this->booking = $booking->load([
            'legs.items',
            'legs.trip',
            'legs',
        ]);
    }

      /**
     * Tiêu đề (subject) + người gửi.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Xác nhận đặt vé thành công #' . $this->booking->code,
        );
    }

    /**
     * View + dữ liệu gửi sang Blade.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.booking_success',
            with: [
                'booking' => $this->booking,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
