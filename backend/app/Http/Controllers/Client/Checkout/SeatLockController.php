<?php

namespace App\Http\Controllers\Client\Checkout;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Services\SeatFlow\SeatLockService;
use App\Services\SeatFlow\SeatReleaseService;

class SeatLockController extends Controller
{
    public function __construct(
        private SeatLockService $seatLock,
        private SeatReleaseService $seatRelease
    ) {}

    public function lock(Request $request)
    {
        $data = $request->validate([
            'from_location_id' => ['required', 'integer', 'exists:locations,id'],
            'to_location_id'   => [
                'required',
                'integer',
                'different:from_location_id',
                'exists:locations,id',
            ],
            'from_location' => ['required'],
            'to_location' => ['required', 'different:from_location'],

            'trips' => ['required', 'array', 'min:1'],

            'trips.*.trip_id'  => ['required', 'integer', 'exists:trips,id'],
            'trips.*.seat_ids' => ['required', 'array', 'min:1'],
            'trips.*.seat_ids.*' => ['required', 'integer', 'min:1'],

            'trips.*.leg' => ['nullable', 'string', Rule::in(['OUT', 'RETURN'])],
            
            // Nếu true hoặc không gửi, sẽ xóa draft cũ và tạo mới
            // Nếu false, sẽ giữ lại draft cũ (dùng để thêm ghế vào draft hiện có)
            'force_new' => ['nullable', 'boolean'],
        ]);

        $forceNew = $data['force_new'] ?? true; // Mặc định là true để đảm bảo backward compatibility
        $ttl = (int) (SeatLockService::DEFAULT_TTL);
        $userId = Auth::id();
        $oldToken = $request->header('X-Session-Token');
        $shouldCreateNewToken = true;

        if ($oldToken) {
            $existingDraft = \App\Models\DraftCheckout::where('session_token', $oldToken)
                ->whereIn('status', ['pending', 'paying'])
                ->where('expires_at', '>', now())
                ->first();

            if ($existingDraft) {
                $token = $oldToken;
                $shouldCreateNewToken = false;
            }
        }

        if ($shouldCreateNewToken) {
            $token = \Illuminate\Support\Str::random(32);
            $request->headers->set('X-Session-Token', $token);
        }

        $result = $this->seatLock->lock(
            trips: $data['trips'],
            sessionToken: $token,
            userId: $userId,
            ttl: $ttl,
            from_location_id: $data['from_location_id'],
            to_location_id: $data['to_location_id'],
            from_location: $data['from_location'],
            to_location: $data['to_location'],
            forceNew: $forceNew
        );

        return response()->json([
            'success' => true,
            'session_token' => $token,
            'draft_id' => $result['draft_id'] ?? null,
            'status' => $result['status'] ?? null,
            'expires_at' => $result['expires_at'] ?? null,
            'totals' => $result['totals'] ?? null,
            'items' => $result['items'] ?? [],
        ]);
    }

    public function unlock(Request $request)
    {
        $sessionToken = $request->header('X-Session-Token');

        $res = $this->seatRelease->cancelAllBySession($sessionToken);

        return response()->json($res);
    }
}
