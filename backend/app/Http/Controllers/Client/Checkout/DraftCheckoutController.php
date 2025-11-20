<?php

namespace App\Http\Controllers\Client\Checkout;

use Illuminate\Http\Request;
use App\Models\DraftCheckout;
use App\Http\Controllers\Controller;

class DraftCheckoutController extends Controller
{
    public function show(Request $request, int $draftId)
    {
        $sessionToken = $request->header('X-Session-Token');
        if (!$sessionToken) {
            abort(400, 'Thiếu X-Session-Token');
        }

        $draft = DraftCheckout::query()
            ->with([
                'legs.items',
                'legs.trip.bus',
                'legs.trip.route',
            ])
            ->whereKey($draftId)
            ->where('session_token', $sessionToken)
            ->firstOrFail();

        return response()->json([
            'id' => $draft->id,
            'status' => $draft->status,
            'expires_at' => $draft->expires_at,
            'contact' => [
                'name' => $draft->passenger_name,
                'phone' => $draft->passenger_phone,
                'note' => $draft->notes,
                'pickup_address' => $draft->pickup_address,
                'dropoff_address' => $draft->dropoff_address,
            ],
            'pricing' => [
                'subtotal' => $draft->subtotal_price,
                'discount' => $draft->discount_amount,
                'total' => $draft->total_price,
            ],
            'trips' => $draft->legs->map(function ($leg) {
                $departureTime = optional($leg->trip)->departure_time;

                return [
                    'trip_id' => $leg->trip_id,
                    'leg' => $leg->leg,
                    // Ngày đi (YYYY-MM-DD) lấy từ departure_time
                    'date' => optional($departureTime)->toDateString(),
                    // Giờ:phút (HH:ii) tách riêng để FE hiển thị
                    'departure_time' => optional($departureTime)->format('H:i'),
                    'route' => [
                        'from' => $leg->pickup_snapshot,
                        'to' =>  $leg->dropoff_snapshot,
                    ],
                    'bus_plate' => optional(optional($leg->trip)->bus)->plate_number,
                    'seats' => $leg->items->map(function ($item) {
                        return [
                            'label' => $item->seat_label,
                            'price' => $item->price,
                        ];
                    }),
                    'total_price' => $leg->total_price,
                ];
            }),
        ]);
    }
}