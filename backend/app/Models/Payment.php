<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'booking_id',
        'amount',
        'fee',
        'refund_amount',
        'currency',
        'provider',
        'provider_txn_id',
        'status',
        'failure_code',
        'failure_message',
        'error_data',
        'paid_at',
        'refunded_at',
        'meta',
        'raw_request',
        'raw_response',
    ];

    protected $casts = [
        'amount' => 'decimal:0',
        'fee' => 'decimal:0',
        'refund_amount' => 'decimal:0',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
        'meta' => 'array',
        'error_data' => 'array',
    ];

    /**
     * Mỗi payment thuộc về 1 booking.
     */
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
