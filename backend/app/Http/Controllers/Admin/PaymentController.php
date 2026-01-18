<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments with filters
     * GET /api/admin/payments?page=1&per_page=20&provider=payos&from_date=2024-01-01&to_date=2024-12-31&booking_code=ABC123&search=keyword
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'provider' => 'nullable|string|in:cash,payos',
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date|after_or_equal:from_date',
                'booking_code' => 'nullable|string|max:255',
                'search' => 'nullable|string|max:255',
            ]);

            $query = Payment::with([
                'booking' => function ($q) {
                    $q->select('id', 'code', 'user_id', 'passenger_name', 'passenger_phone', 'passenger_email', 'status', 'total_price', 'discount_amount', 'created_at', 'paid_at');
                },
                'booking.user' => function ($q) {
                    $q->select('id', 'name', 'username', 'email');
                }
            ]);

            // Filter by provider
            if ($request->has('provider') && $request->provider) {
                $query->where('provider', $request->provider);
            }

            // Filter by date range
            if ($request->has('from_date') && $request->from_date) {
                $query->whereDate('paid_at', '>=', $request->from_date);
            }

            if ($request->has('to_date') && $request->to_date) {
                $query->whereDate('paid_at', '<=', $request->to_date);
            }

            // Filter by booking code
            if ($request->has('booking_code') && $request->booking_code) {
                $query->whereHas('booking', function ($q) use ($request) {
                    $q->where('code', 'like', '%' . $request->booking_code . '%');
                });
            }

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('provider_txn_id', 'like', '%' . $search . '%')
                        ->orWhereHas('booking', function ($bookingQuery) use ($search) {
                            $bookingQuery->where('code', 'like', '%' . $search . '%')
                                ->orWhere('passenger_name', 'like', '%' . $search . '%')
                                ->orWhere('passenger_phone', 'like', '%' . $search . '%')
                                ->orWhere('passenger_email', 'like', '%' . $search . '%')
                                ->orWhereHas('user', function ($userQuery) use ($search) {
                                    $userQuery->where('name', 'like', '%' . $search . '%')
                                        ->orWhere('username', 'like', '%' . $search . '%')
                                        ->orWhere('email', 'like', '%' . $search . '%')
                                        ->orWhere('phone', 'like', '%' . $search . '%');
                                });
                        });
                });
            }

            // Order by paid_at desc (newest first)
            $query->orderBy('paid_at', 'desc');

            // Nếu request param 'all' = true, trả về tất cả dữ liệu (không phân trang)
            if ($request->boolean('all')) {
                $payments = $query->get();
                return response()->json([
                    'success' => true,
                    'data' => $payments,
                    'message' => 'Lấy danh sách thanh toán thành công.'
                ]);
            }

            $perPage = $request->get('per_page', 20);
            $payments = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $payments,
                'message' => 'Lấy danh sách thanh toán thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified payment
     * GET /api/admin/payments/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            $payment = Payment::with([
                'booking' => function ($q) {
                    $q->with('user:id,name,username,email');
                }
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $payment,
                'message' => 'Lấy thông tin thanh toán thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thanh toán hoặc có lỗi xảy ra.'
            ], 404);
        }
    }

    /**
     * Get payment statistics
     * GET /api/admin/payments/stats?from_date=2024-01-01&to_date=2024-12-31
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date|after_or_equal:from_date',
            ]);

            $query = Payment::query();

            // Filter by date range
            if ($request->has('from_date') && $request->from_date) {
                $query->whereDate('paid_at', '>=', $request->from_date);
            }

            if ($request->has('to_date') && $request->to_date) {
                $query->whereDate('paid_at', '<=', $request->to_date);
            }

            // Total payments
            $total = $query->count();

            // Total amount
            $totalAmount = $query->sum('amount');

            // Success payments (where payment status is succeeded)
            $successQuery = clone $query;
            $successCount = $successQuery->where('status', 'succeeded')->count();

            // Success amount
            $successAmountQuery = clone $query;
            $successAmount = $successAmountQuery->where('status', 'succeeded')->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'total_amount' => $totalAmount,
                    'success_count' => $successCount,
                    'success_amount' => $successAmount,
                ],
                'message' => 'Lấy thống kê thanh toán thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}

