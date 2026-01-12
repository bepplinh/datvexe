<?php

namespace App\Http\Controllers\Client\Checkout;

use Illuminate\Http\Request;
use App\Models\DraftCheckout;
use App\Http\Controllers\Controller;

class CheckPendingDraftController extends Controller
{
    public function check(Request $request)
    {
        $sessionToken = $request->header('X-Session-Token');
        if (!$sessionToken) {
            return response()->json(['pending_draft' => null]);
        }

        $draft = DraftCheckout::query()
            ->with(['legs.items', 'legs.trip.route'])
            ->where('session_token', $sessionToken)
            ->whereIn('status', ['pending', 'paying'])
            ->where('expires_at', '>', now())
            ->first();

        if (!$draft) {
            return response()->json(['pending_draft' => null]);
        }

        // Tính thời gian còn lại
        $expiresAt = \Carbon\Carbon::parse($draft->expires_at);
        $minutesLeft = max(0, now()->diffInMinutes($expiresAt, false));

        return response()->json([
            'pending_draft' => [
                'id' => $draft->id,
                'status' => $draft->status,
                'expires_at' => $draft->expires_at,
                'minutes_left' => $minutesLeft,
                'pricing' => [
                    'subtotal' => $draft->subtotal_price,
                    'discount' => $draft->discount_amount,
                    'total' => $draft->total_price,
                ],
                'trips' => $draft->legs->map(function ($leg) {
                    return [
                        'trip_id' => $leg->trip_id,
                        'leg' => $leg->leg,
                        'route' => [
                            'from' => $leg->pickup_snapshot,
                            'to' => $leg->dropoff_snapshot,
                        ],
                        'seats' => $leg->items->map(fn($item) => [
                            'label' => $item->seat_label,
                            'price' => $item->price,
                        ]),
                        'total_price' => $leg->total_price,
                    ];
                }),
            ],
        ]);
    }
}
