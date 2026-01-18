<?php

namespace App\Mail;

use App\Models\BookingLeg;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Contracts\Queue\ShouldQueue;

class TripReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public BookingLeg $leg;
    
    public function __construct(BookingLeg $leg)
    {
        $this->leg = $leg->load([
            'booking',
            'trip.route',
            'trip.bus',
            'items.seat',
            'pickupLocation',
            'dropoffLocation',
        ]);
    }

    /**
     * Tiêu đề email
     */
    public function envelope(): Envelope
    {
        $departureTime = $this->leg->trip?->departure_time;
        $timeStr = $departureTime ? $departureTime->format('H:i d/m/Y') : '';
        
        return new Envelope(
            subject: '⏰ Nhắc nhở: Chuyến xe của bạn sắp khởi hành - ' . $timeStr,
        );
    }

    /**
     * Nội dung email
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.trip_reminder',
            with: [
                'leg' => $this->leg,
                'booking' => $this->leg->booking,
            ],
        );
    }

    /**
     * Attachments
     */
    public function attachments(): array
    {
        return [];
    }
}
