<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Financial\FinancialReportRequest;
use App\Services\Admin\FinancialService;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class FinancialController extends Controller
{
    public function __construct(
        private FinancialService $financialService
    ) {}

    /**
     * Báo cáo thanh toán
     * GET /api/admin/financial/payment-report?from_date=2024-01-01&to_date=2024-01-31
     */
    public function paymentReport(FinancialReportRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->financialService->getPaymentReport($fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'payment_report' => $data,
                ],
                'message' => 'Lấy báo cáo thanh toán thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Phân tích coupon/khuyến mãi
     * GET /api/admin/financial/coupon-analysis?from_date=2024-01-01&to_date=2024-01-31
     */
    public function couponAnalysis(FinancialReportRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();

            $data = $this->financialService->getCouponAnalysis($fromDate, $toDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'coupon_analysis' => $data,
                ],
                'message' => 'Lấy phân tích coupon thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Top coupon hiệu quả nhất
     * GET /api/admin/financial/top-coupons?from_date=2024-01-01&to_date=2024-01-31&limit=10
     */
    public function topCoupons(FinancialReportRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $limit = $request->input('limit', 10);

            $data = $this->financialService->getTopCoupons($fromDate, $toDate, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'limit' => $limit,
                    'top_coupons' => $data,
                ],
                'message' => 'Lấy danh sách top coupon thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Báo cáo tài chính theo period
     * GET /api/admin/financial/report-by-period?from_date=2024-01-01&to_date=2024-01-31&period=day
     */
    public function reportByPeriod(FinancialReportRequest $request): JsonResponse
    {
        try {
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $period = $request->input('period', 'day');

            $data = $this->financialService->getFinancialReportByPeriod($fromDate, $toDate, $period);

            return response()->json([
                'success' => true,
                'data' => [
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'period' => $period,
                    'financial_report' => $data,
                ],
                'message' => 'Lấy báo cáo tài chính theo period thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}

