<?php

namespace App\Http\Controllers\Client\Checkout;

use Illuminate\Http\Request;
use App\Models\DraftCheckout;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class DraftCheckoutController extends Controller
{
    public function show(Request $request, int $draftId)
    {
        $sessionToken = $request->header('X-Session-Token');
        if (!$sessionToken) {
            return response()->json([
                'success' => false,
                'message' => 'Đã có lỗi xảy ra. Vui lòng thử lại.',
            ], 400);
        }

        // Tìm draft với session_token
        $draft = DraftCheckout::query()
            ->with([
                'legs.items',
                'legs.trip.bus',
                'legs.trip.route',
            ])
            ->whereKey($draftId)
            ->where('session_token', $sessionToken)
            ->first();

        // Nếu không tìm thấy draft với session_token này
        if (!$draft) {
            // Kiểm tra xem draft có tồn tại không (để phân biệt lỗi)
            $draftExists = DraftCheckout::whereKey($draftId)->exists();

            if ($draftExists) {
                // Draft tồn tại nhưng session_token không khớp -> không có quyền truy cập
                Log::warning('Unauthorized draft access attempt', [
                    'draft_id' => $draftId,
                    'session_token' => substr($sessionToken, 0, 8) . '...',
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'user_id' => $request->user()?->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền truy cập đơn đặt vé này. Vui lòng tạo đơn mới.',
                ], 403);
            }

            // Draft không tồn tại
            return response()->json([
                'success' => false,
                'message' => 'Đơn đặt vé không tồn tại hoặc đã hết hạn.',
            ], 404);
        }

        // Kiểm tra user_id nếu user đã đăng nhập
        $user = $request->user();
        if ($user && $draft->user_id && $draft->user_id !== $user->id) {
            Log::warning('User ID mismatch for draft access', [
                'draft_id' => $draftId,
                'draft_user_id' => $draft->user_id,
                'request_user_id' => $user->id,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập đơn đặt vé này.',
            ], 403);
        }

        // Kiểm tra trạng thái draft
        if (in_array($draft->status, ['expired', 'cancelled', 'paid'])) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn đặt vé này đã hết hiệu lực hoặc đã được xử lý.',
            ], 422);
        }

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
