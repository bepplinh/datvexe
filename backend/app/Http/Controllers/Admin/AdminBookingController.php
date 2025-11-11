<?php

namespace App\Http\Controllers\Admin;

use RuntimeException;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminBookingService;
use App\Http\Requests\Admin\AdminBookingRequest;

class AdminBookingController extends Controller
{
    public function __construct(
        private AdminBookingService $adminBookingService
    ) {}

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
}
