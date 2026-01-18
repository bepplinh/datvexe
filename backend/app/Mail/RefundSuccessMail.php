<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Contracts\Queue\ShouldQueue;

class RefundSuccessMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Booking $booking;
    public float $refundAmount;
    
    public function __construct(Booking $booking, float $refundAmount)
    {
        $this->booking = $booking->load([
            'legs.trip.route',
            'legs.items.seat',
            'payments',
        ]);
        $this->refundAmount = $refundAmount;
    }

    public function envelope(): Envelope
    {
        $formattedAmount = number_format($this->refundAmount, 0, ',', '.') . ' đ';
        
        return new Envelope(
            subject: '💰 Xác nhận hoàn tiền ' . $formattedAmount . ' - Mã vé #' . $this->booking->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.refund_success',
            with: [
                'booking' => $this->booking,
                'refundAmount' => $this->refundAmount,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
