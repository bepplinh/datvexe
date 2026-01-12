<?php

namespace App\Services\DraftCheckoutService;

use App\Models\Seat;
use App\Models\Trip;
use App\Models\DraftCheckout;
use App\Models\DraftCheckoutLeg;
use App\Models\DraftCheckoutItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DraftCheckoutService
{
    public function createFromLocks(
        array $seatsByTrip,
        array $legsByTrip,
        string $token,
        ?int $userId,
        int $ttlSeconds,
        int $fromLocationId,
        int $toLocationId,
        string $fromLocation,
        string $toLocation,
        bool $forceNew = true
    ): array {
        if (empty($seatsByTrip)) {
            throw ValidationException::withMessages(['trips' => ['Không có ghế hợp lệ.']]);
        }

        $tripInfo = $this->loadTripsAndSeats($seatsByTrip);
        $snapshotsByTrip = [];
        foreach ($tripInfo as $tripId => $info) {
            $seats = $info['seats']->only($seatsByTrip[$tripId])->values();
            // Xác định location IDs đúng cho chiều đi/về
            $legCode = $legsByTrip[$tripId] ?? 'OUT';
            if ($legCode === 'RETURN') {
                // Chiều về: đảo ngược điểm đi/đến
                $snapshotsByTrip[$tripId] = $this->computeSeatSnapshots((int)$tripId, $seats, $toLocationId, $fromLocationId);
            } else {
                // Chiều đi: giữ nguyên
                $snapshotsByTrip[$tripId] = $this->computeSeatSnapshots((int)$tripId, $seats, $fromLocationId, $toLocationId);
            }
        }

        $result = DB::transaction(function () use ($seatsByTrip, $legsByTrip, $snapshotsByTrip, $token, $userId, $ttlSeconds, $fromLocationId, $toLocationId, $fromLocation, $toLocation, $forceNew) {
            $ttlSeconds = max(1, (int) $ttlSeconds);
            $now = now();
            $expiresAt = $now->copy()->addSeconds($ttlSeconds);
            $draft = DraftCheckout::query()
                ->where('session_token', $token)
                ->whereIn('status', ['pending', 'paying'])
                ->where('expires_at', '>', $now)
                ->lockForUpdate()
                ->first();

            if (!$draft) {
                $draft = DraftCheckout::create([
                    'user_id' => $userId,
                    'session_token' => $token,
                    'status' => 'pending',
                    'currency' => 'VND',
                    'total_price' => 0,
                    'discount_amount' => 0,
                    'expires_at' => $expiresAt,
                ]);
            } else {
                // forceNew = true: Xóa TẤT CẢ legs và items cũ, tạo draft mới hoàn toàn
                // forceNew = false: Giữ nguyên draft cũ (user chọn tiếp tục)
                if ($forceNew) {
                    DraftCheckoutItem::where('draft_checkout_id', $draft->id)->delete();
                    DraftCheckoutLeg::where('draft_checkout_id', $draft->id)->delete();
                    
                    $draft->update([
                        'expires_at' => $expiresAt,
                        'coupon_code' => null,
                        'coupon_id' => null,
                        'discount_amount' => 0,
                    ]);
                } else {
                    // Chỉ extend thời hạn, giữ nguyên items cũ
                    $draft->update([
                        'expires_at' => $expiresAt,
                    ]);
                }
            }

            $legMap = [];
            $newLegRows = [];
            $now = now();
            foreach ($seatsByTrip as $tripId => $_) {
                $legCode = $legsByTrip[$tripId] ?? null;

                // Xác định location IDs đúng cho chiều đi/về
                $legFromLocationId = $fromLocationId;
                $legToLocationId = $toLocationId;
                $legFromLocation = $fromLocation;
                $legToLocation = $toLocation;

                if ($legCode === 'RETURN') {
                    $legFromLocationId = $toLocationId;
                    $legToLocationId = $fromLocationId;
                    $legFromLocation = $toLocation;
                    $legToLocation = $fromLocation;
                }

                $newLegRows[] = [
                    'draft_checkout_id' => $draft->id,
                    'trip_id'           => $tripId,
                    'leg'               => $legCode,
                    'pickup_location_id' => $legFromLocationId,
                    'dropoff_location_id' => $legToLocationId,
                    'pickup_snapshot' => $legFromLocation,
                    'dropoff_snapshot' => $legToLocation,
                    'total_price'       => 0,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ];
            }
            
            if (!empty($newLegRows)) {
                DraftCheckoutLeg::insert($newLegRows);
            }
            
            // Lấy tất cả leg vừa tạo
            $allLegs = DraftCheckoutLeg::query()
                ->where('draft_checkout_id', $draft->id)
                ->get()
                ->keyBy('trip_id');
            foreach ($allLegs as $tripId => $leg) {
                $legMap[$tripId] = $leg;
            }

            $itemRows = [];
            $subtotalDraft = 0;
            foreach ($seatsByTrip as $tripId => $seatIds) {
                $leg   = $legMap[$tripId];
                $snap = $snapshotsByTrip[$tripId];
                foreach ($snap as $s) {
                    if (!in_array($s['seat_id'], $seatIds, true)) continue;
                    $price = (int)$s['price'];
                    $itemRows[] = [
                        'draft_checkout_id'     => $draft->id,
                        'draft_checkout_leg_id' => $leg->id,
                        'trip_id'               => $tripId,
                        'seat_id'               => $s['seat_id'],
                        'seat_label'            => $s['seat_code'],
                        'price'                 => $price,
                        'created_at'            => $now,
                        'updated_at'            => $now,
                    ];
                    $subtotalDraft += $price;
                }
            }

            if (!empty($itemRows)) {
                DraftCheckoutItem::insert($itemRows);
            }

            $legIds = array_map(fn($l) => $l->id, $legMap);
            $legTotals = DraftCheckoutItem::query()
                ->selectRaw('draft_checkout_leg_id, SUM(price) as sum_price')
                ->whereIn('draft_checkout_leg_id', $legIds)
                ->groupBy('draft_checkout_leg_id')
                ->pluck('sum_price', 'draft_checkout_leg_id');

            foreach ($legMap as $tripId => $leg) {
                $sum = (int)($legTotals[$leg->id] ?? 0);
                $leg->update([
                    'subtotal_price' => $sum,
                    'discount_amount' => 0,
                    'total_price'    => $sum,
                ]);
            }

            $savedExpiresAt = $draft->expires_at;
            $discountDraft = 0;
            $totalDraft = max(0, $subtotalDraft - $discountDraft);
            
            DraftCheckout::where('id', $draft->id)
                ->update([
                    'subtotal_price' => $subtotalDraft,
                    'total_price' => $totalDraft,
                    'discount_amount' => $discountDraft,
                ]);
            
            $draft->refresh();
            
            // Khôi phục expires_at nếu bị thay đổi do MySQL ON UPDATE CURRENT_TIMESTAMP
            $currentExpiresAt = $draft->expires_at instanceof \Carbon\Carbon 
                ? $draft->expires_at->timestamp 
                : strtotime($draft->expires_at);
            $savedExpiresAtTimestamp = $savedExpiresAt instanceof \Carbon\Carbon 
                ? $savedExpiresAt->timestamp 
                : strtotime($savedExpiresAt);
                
            if ($currentExpiresAt != $savedExpiresAtTimestamp) {
                DraftCheckout::where('id', $draft->id)
                    ->update(['expires_at' => $savedExpiresAt]);
                $draft->refresh();
            }

            $items = DraftCheckoutItem::query()
                ->where('draft_checkout_id', $draft->id)
                ->orderBy('draft_checkout_leg_id')
                ->get();
            $legCodeById = [];
            foreach ($legMap as $tripId => $leg) {
                $legCodeById[$leg->id] = $legsByTrip[$tripId] ?? $leg->leg;
            }

            return [
                'draft_id'   => $draft->id,
                'status'     => $draft->status,
                'expires_at' => $draft->expires_at?->toDateTimeString(),
                'totals'     => [
                    'subtotal' => $subtotalDraft,
                    'discount' => $discountDraft,
                    'total'    => $totalDraft,
                ],
                'items' => $items->map(function ($it) use ($legCodeById) {
                    return [
                        'trip_id'    => (int)$it->trip_id,
                        'leg'        => $legCodeById[$it->draft_checkout_leg_id] ?? null,
                        'seat_id'    => (int)$it->seat_id,
                        'seat_label' => $it->seat_label,
                        'price'      => (int)$it->price,
                    ];
                })->values()->all(),
            ];
        });

        return $result;
    }

    private function loadTripsAndSeats(array $seatsByTrip)
    {
        $tripIds = array_keys($seatsByTrip);
        $trips = Trip::query()
            ->whereIn('id', $tripIds)
            ->get()
            ->keyBy('id');

        $result = [];
        foreach ($seatsByTrip as $tripId => $seatIds) {
            $trip = $trips[$tripId] ?? null;
            if (!$trip) {
                throw ValidationException::withMessages([
                    'trips' => ["Trip {$tripId} không tồn tại."],
                ]);
            }

            $seats = Seat::query()
                ->whereIn('id', $seatIds)
                ->get()
                ->keyBy('id');

            foreach ($seatIds as $seatId) {
                if (!isset($seats[$seatId])) {
                    throw ValidationException::withMessages([
                        'seats' => ["Seat {$seatId} không tồn tại trong trip {$tripId}."],
                    ]);
                }
            }

            $result[$tripId] = ['trip' => $trip, 'seats' => $seats];
        }
        return $result;
    }

    protected function computeSeatSnapshots(int $tripId, Collection $seats, int $fromLocationId, int $toLocationId)
    {
        // Lấy giá chính xác từ trip_stations dựa trên điểm đi và điểm đến
        $unitPrice = (int) DB::table('trips')
            ->join('routes', 'trips.route_id', '=', 'routes.id')
            ->join('trip_stations', 'routes.id', '=', 'trip_stations.route_id')
            ->where('trips.id', $tripId)
            ->where('trip_stations.from_location_id', $fromLocationId)
            ->where('trip_stations.to_location_id', $toLocationId)
            ->value('trip_stations.price');

        $out = [];
        foreach ($seats as $seat) {
            $s = Seat::find($seat->id);
            $out[] = [
                'seat_id'    => $seat->id,
                'seat_code'  => $s->seat_number,
                'price' => $unitPrice,
            ];
        }

        return $out;
    }
}