<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Export\ExportReportRequest;
use App\Services\Admin\ExportService;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ExportController extends Controller
{
    public function __construct(
        private ExportService $exportService
    ) {}

    /**
     * Export dữ liệu
     * GET /api/admin/export?type=revenue&format=excel&from_date=2024-01-01&to_date=2024-01-31&period=day
     */
    public function export(ExportReportRequest $request): JsonResponse
    {
        try {
            $type = $request->input('type');
            $format = $request->input('format');
            $fromDate = $request->input('from_date')
                ? Carbon::parse($request->input('from_date'))->startOfDay()
                : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $request->input('to_date')
                ? Carbon::parse($request->input('to_date'))->endOfDay()
                : Carbon::now()->endOfDay();
            $period = $request->input('period', 'day');

            $data = match ($type) {
                'revenue' => $this->exportService->exportRevenue($fromDate, $toDate, $period),
                'bookings' => $this->exportService->exportBookings($fromDate, $toDate),
                'payments' => $this->exportService->exportPayments($fromDate, $toDate),
                'financial' => $this->exportService->exportFinancial($fromDate, $toDate, $period),
                default => $this->exportService->exportComprehensive($fromDate, $toDate, $period),
            };

            // Trả về JSON data để frontend xử lý export Excel/PDF
            // Frontend có thể sử dụng thư viện như xlsx, jspdf để export
            return response()->json([
                'success' => true,
                'data' => $data,
                'format' => $format,
                'message' => 'Dữ liệu export đã sẵn sàng.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}

