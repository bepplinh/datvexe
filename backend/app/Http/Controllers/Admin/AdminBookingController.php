<?php

namespace App\Http\Controllers\Admin;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminBookingService;
use App\Http\Requests\Admin\AdminBookingRequest;
use RuntimeException;

class AdminBookingController extends Controller
{
    public function __construct(
        private AdminBookingService $adminBookingService
    ) {}

    /**
     * Danh sách booking (có thể filter theo user_id)
     * GET /api/admin/bookings?user_id=123
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::query()
            ->with([
                'legs.trip.route',
                'legs.trip.bus',
                'legs.items.seat',
                'legs.pickupLocation',
                'legs.dropoffLocation',
            ])
            ->orderBy('created_at', 'desc');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $bookings = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $bookings
        ]);
    }

    /**
     * Tra cứu booking theo mã code.
     * GET /api/admin/bookings/lookup?code=ABC123
     */
    public function lookupByCode(Request $request): JsonResponse
    {
        $code = trim((string) $request->get('code', ''));
        if ($code === '') {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng nhập mã booking',
            ], 400);
        }

        $booking = Booking::with([
            'legs.items.seat',
            'legs.pickupLocation',
            'legs.dropoffLocation',
            'legs.trip',
            'payments', // Thêm payments để check pending additional payment
        ])->where('code', $code)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy booking với mã đã nhập',
            ], 404);
        }

        // Chuẩn hóa payload cho FE
        $legs = $booking->legs->map(function ($leg) {
            $departureTime = null;
            if ($leg->trip && $leg->trip->departure_time) {
                $departureTime = $leg->trip->departure_time instanceof \Carbon\Carbon
                    ? $leg->trip->departure_time->toIso8601String()
                    : (string) $leg->trip->departure_time;
            }

            return [
                'id' => $leg->id,
                'trip_id' => $leg->trip_id,
                'leg_type' => $leg->leg_type,
                'pickup_location_id' => $leg->pickup_location_id,
                'dropoff_location_id' => $leg->dropoff_location_id,
                'pickup_location_name' => optional($leg->pickupLocation)->name,
                'dropoff_location_name' => optional($leg->dropoffLocation)->name,
                'pickup_address' => $leg->pickup_address,
                'dropoff_address' => $leg->dropoff_address,
                'departure_time' => $departureTime,
                'items' => $leg->items->map(function ($item) {
                    return [
                        'booking_item_id' => $item->id,
                        'seat_id' => $item->seat_id,
                        'seat_label' => $item->seat_label ?? optional($item->seat)->seat_number,
                    ];
                })->values(),
            ];
        })
            // Sắp xếp: OUT trước, sau đó đến RETURN (chiều về) để hiển thị trái/phải đẹp
            ->sortBy(function ($leg) {
                // OUT -> 0, RETURN -> 1, các loại khác nếu có -> 2
                return match ($leg['leg_type'] ?? null) {
                    'OUT' => 0,
                    'RETURN' => 1,
                    default => 2,
                };
            })->values();

        // Kiểm tra có pending additional payment không
        $hasPendingAdditionalPayment = $booking->payments()
            ->where('status', 'pending')
            ->whereJsonContains('meta->type', 'additional_payment')
            ->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'booking' => [
                    'id' => $booking->id,
                    'code' => $booking->code,
                    'status' => $booking->status,
                    'passenger_name' => $booking->passenger_name,
                    'passenger_phone' => $booking->passenger_phone,
                    'passenger_email' => $booking->passenger_email,
                    'total_price' => $booking->total_price,
                    'has_pending_additional_payment' => $hasPendingAdditionalPayment,
                    'legs' => $legs,
                ],
            ],
        ]);
    }

    public function store(AdminBookingRequest $request): JsonResponse
    {
        $adminId = $request->user()->id;
        $data = $request->validated();

        try {
            $booking = $this->adminBookingService->createBookingFromAdmin(
                data: $data,
                adminId: $adminId
            );

            return response()->json([
                'success' => true,
                'booking' => $booking,
            ], 201);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 409);
        }
    }

    public function markAsPaid(Booking $booking): JsonResponse
    {
        $adminId = request()->user()->id;

        try {
            $updatedBooking = $this->adminBookingService->markBookingAsPaidManually(
                bookingId: $booking->id,
                adminId: $adminId,
            );

            return response()->json([
                'success' => true,
                'booking' => $updatedBooking,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}

