<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminTransactionController extends Controller
{
    /**
     * Get list of refund transactions
     * Extracts refunds from payment meta data
     */
    public function getRefunds(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 20);
        
        // Filter payments that have refunds
        $query = Payment::query()
            ->with(['booking.user'])
            ->where(function($q) {
                $q->where('refund_amount', '>', 0)
                  // Or checks if meta has refunds array with items
                  ->orWhereRaw("JSON_LENGTH(JSON_EXTRACT(meta, '$.refunds')) > 0");
            })
            ->where('status', '!=', 'pending'); // Only completed payments usually have refunds

        // Apply filters
        if ($dateFrom = $request->get('from_date')) {
            $query->whereDate('refunded_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->get('to_date')) {
            $query->whereDate('refunded_at', '<=', $dateTo);
        }

        $payments = $query->latest('refunded_at')->paginate($perPage);
        
        // Transform data to flat refund list
        // Note: Pagination applies to Payments, not individual refund actions.
        // This is a trade-off. For better precision, we'd need a separate Refunds table.
        // For now, we expand the refunds from the paginated payments.
        
        $refunds = [];
        foreach ($payments->items() as $payment) {
            $meta = $payment->meta ?? [];
            
            // Priority: Check specific refund records in meta
            if (!empty($meta['refunds']) && is_array($meta['refunds'])) {
                foreach ($meta['refunds'] as $refundRecord) {
                    $refunds[] = [
                        'id' => $payment->id . '_' . ($refundRecord['refunded_at'] ?? uniqid()), // Composite ID
                        'payment_id' => $payment->id,
                        'booking_code' => $payment->booking->code ?? 'N/A',
                        'customer' => $payment->booking->passenger_name ?? $payment->booking->user->name ?? 'N/A',
                        'amount' => $refundRecord['amount'] ?? 0,
                        'reason' => $refundRecord['reason'] ?? 'N/A',
                        'method' => $refundRecord['method'] ?? 'manual',
                        'refunded_at' => $refundRecord['refunded_at'] ?? $payment->refunded_at,
                        'admin_id' => $refundRecord['refunded_by_admin_id'] ?? null,
                        'type' => $refundRecord['type'] ?? 'manual_refund',
                        'type_label' => $this->getRefundTypeLabel($refundRecord['type'] ?? 'manual_refund'),
                    ];
                }
            } else {
                // Fallback for legacy refunds (no specific record)
                if ($payment->refund_amount > 0) {
                    $refunds[] = [
                         'id' => $payment->id . '_legacy',
                         'payment_id' => $payment->id,
                         'booking_code' => $payment->booking->code ?? 'N/A',
                         'customer' => $payment->booking->passenger_name ?? $payment->booking->user->name ?? 'N/A',
                         'amount' => $payment->refund_amount,
                         'reason' => $meta['refund_reason'] ?? 'Hoàn tiền thủ công',
                         'method' => 'manual',
                         'refunded_at' => $payment->refunded_at,
                         'admin_id' => $meta['refunded_by_admin_id'] ?? null,
                         'type' => 'manual_refund',
                         'type_label' => 'Hoàn tiền thủ công',
                    ];
                }
            }
        }
        
        // Manually filter flat list by date if precise date filtering on refund item is needed
        // (Skipped for simplicity as Payment refunded_at is close enough)

        return response()->json([
            'success' => true,
            'data' => $refunds,
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'total' => $payments->total(), // Total payments, not total refunds
                'per_page' => $payments->perPage(),
            ]
        ]);
    }

    /**
     * Get list of modification transactions
     * Includes additional payments (price increase) and pending refunds (price decrease)
     */
    public function getModifications(Request $request): JsonResponse
    {
         $perPage = $request->get('per_page', 20);
         
         // Custom Query for Modification related Payments
         $query = Payment::query()
            ->with(['booking.user'])
            ->where(function($q) {
                // 1. Additional Payments (Price Increase)
                $q->where(function($sub) {
                    $sub->where('status', '!=', 'failed'); // Pending or Succeeded
                    $sub->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(meta, '$.type')) = 'additional_payment'");
                })
                // 2. Payments with Pending Refund Mod (Price Decrease)
                ->orWhere(function($sub) {
                    $sub->whereRaw("JSON_LENGTH(JSON_EXTRACT(meta, '$.pending_refunds_from_modification')) > 0");
                });
            });

        // Apply filters
        if ($search = $request->get('search')) {
            $query->whereHas('booking', function($q) use ($search) {
                $q->where('code', 'like', "%{$search}%");
            });
        }
        
        $payments = $query->latest()->paginate($perPage);

        $transactions = [];
        foreach ($payments->items() as $payment) {
            $meta = $payment->meta ?? [];
            $booking = $payment->booking;
            
            // Case 1: Additional Payment (Price Increase)
            if (($meta['type'] ?? '') === 'additional_payment') {
                $transactions[] = [
                    'id' => $payment->id,
                    'booking_code' => $booking->code ?? 'N/A',
                    'customer' => $booking->passenger_name ?? $booking->user->name ?? 'N/A',
                    'type' => 'price_increase',
                    'type_label' => 'Thu thêm tiền (Đổi vé)',
                    'amount' => $payment->amount,
                    'status' => $payment->status, // pending, succeeded
                    'reason' => 'Đổi chuyến/ghế - Khách trả thêm',
                    'created_at' => $payment->created_at,
                    'admin_id' => $meta['modified_by_admin_id'] ?? null,
                ];
            }
            
            // Case 2: Modification Refund (Price Decrease)
            if (!empty($meta['pending_refunds_from_modification']) && is_array($meta['pending_refunds_from_modification'])) {
                foreach ($meta['pending_refunds_from_modification'] as $modRefund) {
                     $transactions[] = [
                        'id' => $payment->id . '_mod_' . ($modRefund['recorded_at'] ?? uniqid()),
                        'booking_code' => $booking->code ?? 'N/A',
                        'customer' => $booking->passenger_name ?? $booking->user->name ?? 'N/A',
                        'type' => 'price_decrease',
                        'type_label' => 'Hoàn tiền (Đổi vé)',
                        'amount' => $modRefund['amount'] ?? 0,
                        'status' => $modRefund['status'] ?? 'pending', // pending, refunded
                        'reason' => 'Đổi chuyến/ghế - Hoàn tiền chênh lệch',
                        'created_at' => $modRefund['recorded_at'] ?? $payment->created_at,
                        'admin_id' => $modRefund['modified_by_admin_id'] ?? null,
                    ];
                }
            }
        }
        
        // Sort by date desc manually (since we mixed two sources)
        usort($transactions, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return response()->json([
            'success' => true,
            'data' => $transactions,
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'total' => $payments->total(), 
                'per_page' => $payments->perPage(),
            ]
        ]);
    }

    private function getRefundTypeLabel($type)
    {
        return match($type) {
            'full_booking_refund' => 'Hoàn toàn bộ vé',
            'price_difference' => 'Hoàn tiền chênh lệch',
            default => 'Hoàn tiền thủ công',
        };
    }
}
