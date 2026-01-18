<?php

namespace App\Http\Controllers\Client;

use App\Models\Booking;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class ClientBookingController extends Controller
{
    public function index(Request $request)
    {
        try {
            $userId = Auth::id();
            $query = Booking::where('user_id', $userId);

            // Filter by type: upcoming or completed
            $type = $request->input('type');
            if ($type === 'upcoming') {
                $query->upcoming();
            } elseif ($type === 'completed') {
                $query->completed();
            }

            $query->with([
                    'legs.trip.route',
                    'legs.trip.bus',
                    'legs.items.seat',
                    'legs.pickupLocation',
                    'legs.dropoffLocation',
                    // 'coupon'
                ])
                ->orderBy('created_at', 'desc');


            $perpage = $request->input('per_page', 15);
            $bookings = $query->paginate($perpage);

            return response()->json([
                'success' => true,
                'data' => $bookings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách đặt vé: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $userId = Auth::id();

            $booking = Booking::where('user_id', $userId)
                ->with([
                    'legs.trip.route',
                    'legs.trip.bus',
                    'legs.trip.pickStations',
                    'legs.trip.dropStations',
                    'legs.items.seat',
                    'legs.pickupLocation',
                    'legs.dropoffLocation',
                    'coupon',
                    'user'
                ])
                ->findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $booking
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đặt vé này'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy thông tin đặt vé: ' . $e->getMessage()
            ], 500);
        }
    }
}
