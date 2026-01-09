<?php

namespace App\Http\Controllers\Client\Payment;

use Throwable;
use App\Events\SeatBooked;
use Illuminate\Http\Request;
use App\Models\DraftCheckout;
use App\Services\SeatFlowService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\Checkout\PayOSService;
use App\Services\Checkout\BookingService;
use App\Services\SeatFlow\SeatReleaseService;

class PayOSWebhookController extends Controller
{
    public function __construct(
        private PayOSService   $payos,
        private SeatFlowService $seats,
        private SeatReleaseService $seatRelease,
        private BookingService  $booking,
    ) {}

    public function handle(Request $req)
    {
        // 0) Log thô phục vụ debug
        Log::info('PayOS webhook: RAW', [
            'headers' => $req->headers->all(),
            'json'    => $req->json()->all(),
        ]);

        $payload = $req->json()->all();
        $data    = $payload['data'] ?? [];

        // 1) Verify chữ ký (bật ngoài local)
        if (config('app.env') !== 'local') {
            try {
                [$ok, $verified] = $this->payos->verifyWebhook($payload);
                if (!$ok) {
                    Log::warning('PayOS webhook: invalid signature');
                    return response()->json(['success' => false, 'error' => 'invalid_signature'], 400);
                }
                if (is_array($verified)) {
                    $data = array_replace($data, $verified);
                }
            } catch (Throwable $e) {
                Log::error('PayOS webhook: verify exception', ['e' => $e->getMessage()]);
                return response()->json(['success' => false, 'error' => 'verify_exception'], 400);
            }
        }

        // 2) Chuẩn hoá status và orderCode
        $success    = (bool)($payload['success'] ?? false);
        $rootCode   = (string)($payload['code'] ?? '');
        $dataCode   = (string)($data['code'] ?? '');
        $rawStatus  = (string)($data['status'] ?? '');        // có thể trống với format transaction
        $statusUp   = strtoupper($rawStatus);
        $orderCode  = $data['orderCode']
            ?? $payload['orderCode']
            ?? $data['order_code']
            ?? null;
        $orderCode  = isset($orderCode) ? (string)$orderCode : null;

        if (!$orderCode) {
            Log::warning('PayOS webhook: missing orderCode', ['payload' => $payload]);
            return response()->json(['success' => true, 'found' => false, 'reason' => 'missing_orderCode']);
        }

        // 3) Xác định “đã thanh toán” an toàn
        // - Nếu có field status: chỉ coi là paid khi status ∈ {PAID, SUCCESS}
        // - Nếu không có status (mẫu transaction): paid khi success && rootCode==='00' && dataCode==='00'
        $hasExplicitStatus = $rawStatus !== '';
        $isPaid = $hasExplicitStatus
            ? in_array($statusUp, ['PAID', 'SUCCESS'], true)
            : ($success && $rootCode === '00' && $dataCode === '00');

        // 4) Nếu KHÔNG paid → xử lý FAILED/CANCELLED/EXPIRED/idempotent
        if (!$isPaid) {
            $draft = DraftCheckout::query()
                ->where('payment_provider', 'payos')
                ->where('payment_intent_id', $orderCode) // luôn so sánh string
                ->first();

            if ($draft) {
                // Map trạng thái ngoài -> nội bộ
                $statusMap = [
                    'CANCELLED' => 'cancelled',
                    'EXPIRED'   => 'expired',
                ];

                // Nếu không có explicit status mà code không 00 → coi là 'failed'
                if (!$hasExplicitStatus && !($success && $rootCode === '00' && $dataCode === '00')) {
                    $statusUp = 'CANCELLED';
                }

                $newStatus = $statusMap[$statusUp];

                if (in_array($newStatus, ['cancelled', 'expired'], true) && $draft->status !== 'paid') {
                    try {
                        $draft->update(['status' => $newStatus]);

                        // Giải phóng ghế khi fail/huỷ/hết hạn
                        try {
                            $this->seatRelease->cancelAllBySession($draft->session_token);
                        } catch (Throwable $e) {
                            Log::error('Seat release error on failed webhook', ['e' => $e->getMessage(), 'draft_id' => $draft->id]);
                        }
                    } catch (Throwable $e) {
                        Log::error('Update draft on failed webhook error', ['e' => $e->getMessage(), 'draft_id' => $draft->id]);
                        return response()->json(['success' => false, 'error' => 'failed_update'], 500);
                    }
                    return response()->json([
                        'success'  => true,
                        'found'    => true,
                        'action'   => 'marked_' . $newStatus . '_and_unlocked',
                        'draft_id' => $draft->id,
                    ]);
                }

                // Không đổi gì nếu đã paid, hoặc status ngoài không rõ ràng
                return response()->json([
                    'success'  => true,
                    'found'    => true,
                    'action'   => 'ignored_non_paid_status',
                    'draft_id' => $draft->id,
                    'status'   => $draft->status,
                ]);
            }

            // Không tìm thấy draft → ACK để tránh retry vô hạn
            return response()->json([
                'success'   => true,
                'found'     => false,
                'reason'    => 'draft_not_found_for_orderCode',
                'orderCode' => $orderCode,
            ]);
        }

        // 5) PAID → finalize idempotent trong transaction
        try {
            $result = DB::transaction(function () use ($orderCode) {
                $draft = DraftCheckout::query()
                    ->with(['legs.items'])
                    ->where('payment_provider', 'payos')
                    ->where('payment_intent_id', $orderCode)
                    ->lockForUpdate()
                    ->first();

                if (!$draft) {
                    return ['found' => false];
                }

                // Idempotent: nếu đã paid + có booking → trả lại kết quả cũ
                if ($draft->status === 'paid' && $draft->booking_id) {
                    $bookedBlocks = [];
                    foreach ($draft->legs as $leg) {
                        $bookedBlocks[] = [
                            'trip_id'        => (int)$leg->trip_id,
                            'seat_ids'       => $leg->items->pluck('seat_id')->map(fn($v) => (int)$v)->all(),
                            'seat_labels'    => $leg->items->pluck('seat_label')->map(fn($v) => (string)$v)->all(),
                            'leg'            => $leg->leg,
                            'booking_leg_id' => $leg->id,
                        ];
                    }

                    return [
                        'found'        => true,
                        'noop'         => true,
                        'draftId'      => $draft->id,
                        'bookingId'    => $draft->booking_id,
                        'sessionToken' => $draft->session_token,
                        'userId'       => (int)($draft->user_id ?? 0),
                        'bookedBlocks' => $bookedBlocks,
                    ];
                }

                // Chỉ finalize khi đang 'paying'
                if ($draft->status !== 'paying') {
                    Log::info('PayOS webhook: draft not in paying state', [
                        'draft_id' => $draft->id,
                        'status'   => $draft->status
                    ]);

                    $bookedBlocks = [];
                    foreach ($draft->legs as $leg) {
                        $bookedBlocks[] = [
                            'trip_id'        => (int)$leg->trip_id,
                            'seat_ids'       => $leg->items->pluck('seat_id')->map(fn($v) => (int)$v)->all(),
                            'seat_labels'    => $leg->items->pluck('seat_label')->map(fn($v) => (string)$v)->all(),
                            'leg'            => $leg->leg,
                            'booking_leg_id' => $leg->id,
                        ];
                    }

                    return [
                        'found'        => true,
                        'noop'         => true,
                        'draftId'      => $draft->id,
                        'bookingId'    => $draft->booking_id,
                        'sessionToken' => $draft->session_token,
                        'userId'       => (int)($draft->user_id ?? 0),
                        'bookedBlocks' => $bookedBlocks,
                    ];
                }

                // 5a) Gom ghế theo trip
                $seatsByTrip = [];
                foreach ($draft->legs as $leg) {
                    $tripId = (int)$leg->trip_id;
                    foreach ($leg->items as $item) {
                        $seatId = (int)$item->seat_id;
                        if ($tripId > 0 && $seatId > 0) {
                            $seatsByTrip[$tripId] ??= [];
                            $seatsByTrip[$tripId][] = $seatId;
                        }
                    }
                }
                foreach ($seatsByTrip as $tid => $arr) {
                    $seatsByTrip[$tid] = array_values(array_unique($arr));
                }

                // 5b) Assert tất cả ghế đang bị lock bởi session token
                foreach ($seatsByTrip as $tripId => $seatIds) {
                    $this->seats->assertSeatsLockedByToken(
                        tripId: $tripId,
                        seatIds: $seatIds,
                        token: $draft->session_token
                    );
                }

                // 5c) Tạo booking + mark booked (DB + Redis)
                $booking = $this->booking->createFromDraft($draft);
                foreach ($seatsByTrip as $tripId => $seatIds) {
                    $this->booking->markBooked(
                        tripId: $tripId,
                        seatIds: $seatIds,
                        booking: $booking
                    );
                }

                // 5d) Cập nhật draft → paid
                $draft->update([
                    'status'       => 'paid',
                    'completed_at' => now(),
                    'booking_id'   => $booking->id,
                ]);

                // Chuẩn bị dữ liệu để phát realtime sau commit
                $bookedBlocks = [];
                foreach ($draft->legs as $leg) {
                    $bookedBlocks[] = [
                        'trip_id'        => (int)$leg->trip_id,
                        'seat_ids'       => $leg->items->pluck('seat_id')->map(fn($v) => (int)$v)->all(),
                        'seat_labels'    => $leg->items->pluck('seat_label')->map(fn($v) => (string)$v)->all(),
                        'leg'            => $leg->leg,
                        'booking_leg_id' => $leg->id,
                    ];
                }

                // Dispatch sau khi commit (không return trong callback này)
                DB::afterCommit(function () use ($seatsByTrip, $draft, $booking, $bookedBlocks) {
                    try {
                        foreach ($seatsByTrip as $tripId => $seatIds) {
                            $this->seats->releaseLocksAfterBooked(
                                tripId: $tripId,
                                seatIds: $seatIds,
                                token: $draft->session_token,
                                bookingId: $booking->id
                            );
                        }

                        event(new SeatBooked(
                            sessionToken: $draft->session_token,
                            bookingId: $booking->id,
                            booked: $bookedBlocks,
                            userId: (int)$booking->user_id
                        ));
                        Mail::to($booking->email)->send(new BookingSuccessMail($booking));
                    } catch (Throwable $e) {
                        Log::error('AfterCommit dispatch error', ['e' => $e->getMessage()]);
                    }
                });

                return [
                    'found'        => true,
                    'draftId'      => $draft->id,
                    'bookingId'    => $booking->id,
                    'sessionToken' => $draft->session_token,
                    'userId'       => (int)($draft->user_id ?? 0),
                    'bookedBlocks' => $bookedBlocks,
                ];
            });

            if (!$result['found']) {
                return response()->json([
                    'success'   => true,
                    'found'     => false,
                    'reason'    => 'draft_not_found_for_orderCode',
                    'orderCode' => $orderCode,
                ]);
            }

            return response()->json([
                'success'    => true,
                'found'      => true,
                'action'     => !empty($result['noop']) ? 'idempotent_noop' : 'marked_paid',
                'draft_id'   => $result['draftId'] ?? null,
                'booking_id' => $result['bookingId'] ?? null,
                'booked'     => $result['bookedBlocks'] ?? [],
            ]);
        } catch (Throwable $e) {
            Log::error('PayOS webhook: transaction error', ['e' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => 'transaction_error'], 500);
        }
    }
}