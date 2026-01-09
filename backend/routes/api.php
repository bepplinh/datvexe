<?php

namespace routes;

use App\Models\Booking;
use App\Mail\BookingSuccessMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BusController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RouteController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\BusTypeController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\SeatFlowController;
use App\Http\Controllers\CouponUserController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\TripStationController;
use App\Http\Controllers\Auth\OtpAuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\RatingAdminController;
use App\Http\Controllers\Admin\TripPerformanceController;

use App\Http\Controllers\Admin\RevenueController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\Client\GeminiChatController;
use App\Http\Controllers\Client\TripSearchController;
use App\Http\Controllers\Admin\AdminBookingController;
use App\Http\Controllers\SeatLayoutTemplateController;
use App\Http\Controllers\Admin\AdminTripSeatController;
use App\Http\Controllers\Admin\BusSeatLayoutController;
use App\Http\Controllers\Client\ClientBookingController;
use App\Http\Controllers\Client\ClientProfileController;
use App\Http\Controllers\ScheduleTemplateTripController;
use App\Http\Controllers\Client\ClientLocationController;
use App\Http\Controllers\Client\ClientTripSeatController;
use App\Http\Controllers\Admin\RouteOptimizationController;
use App\Http\Controllers\Client\Checkout\CheckoutController;
use App\Http\Controllers\Client\Checkout\SeatLockController;
use App\Http\Controllers\TripGenerateFromTemplateController;
use App\Http\Controllers\Client\Payment\PayOSWebhookController;
use App\Http\Controllers\Client\Payment\PayOSRedirectController;
use App\Http\Controllers\Client\Checkout\DraftCheckoutController;


Route::post('/login',    [AuthController::class, 'login']);
Route::post('auth/register/complete', [OtpAuthController::class, 'completeRegister']);
Route::get('/auth/google/client-id', [SocialAuthController::class, 'getGoogleClientId']);
Route::post('/auth/social/{provider}', [SocialAuthController::class, 'loginWithToken'])
    ->whereIn('provider', ['google', 'facebook']);

Route::middleware(['auth:api'])->group(function () {
    Route::get('me',       [AuthController::class, 'me']);
    Route::post('logout',  [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('info', [ClientProfileController::class, 'show']);
    Route::put('info/update', [ClientProfileController::class, 'update']);

    Route::get('conversations', [ConversationController::class, 'index']);
    Route::post('conversations', [ConversationController::class, 'store']);
    Route::get('conversations/{conversation}', [ConversationController::class, 'show']);
    Route::post('conversations/{conversation}/messages', [ConversationController::class, 'storeMessage']);
    Route::patch('conversations/{conversation}/status', [ConversationController::class, 'updateStatus']);
});


Route::prefix('auth/otp')->group(function () {
    Route::post('/start', [OtpAuthController::class, 'start']);    // Gửi OTP
    Route::post('/verify', [OtpAuthController::class, 'verify']);  // Xác thực OTP
});

// Public webhook for PayOS (should not require auth)
Route::post('payos/webhook', [PayOSWebhookController::class, 'handle']);
Route::get('/payos/redirect/success', [PayOSRedirectController::class, 'success']);
Route::get('/payos/redirect/cancel', [PayOSRedirectController::class, 'cancel']);


Route::middleware(['auth:api', 'x-session-token'])->group(function () {
    // Rate limit cho draft access để chống brute force
    Route::get('checkout/drafts/{draftId}', [DraftCheckoutController::class, 'show'])
        ->middleware('throttle:30,1'); // 30 requests per minute

    Route::put('drafts/{draftId}/payment', [CheckoutController::class, 'updateDraftPayment']);
    Route::post('checkout/lock-seats', [SeatLockController::class, 'lock']);
    Route::post('checkout/unlock-seats', [SeatLockController::class, 'unlock']);
    Route::apiResource('bookings', ClientBookingController::class);

    Route::prefix('trips/{tripId}')->group(function () {
        Route::post('seats/select',   [SeatFlowController::class, 'select']);
        Route::post('seats/unselect', [SeatFlowController::class, 'unselect']);

        Route::post('seats/checkout', [SeatFlowController::class, 'checkout']);
        Route::post('seats/release',  [SeatFlowController::class, 'release']);
    });

    Route::post('coupons/validate', [CouponController::class, 'validate']);

    // Rating routes
    Route::get('ratings/pending', [RatingController::class, 'index']);
    Route::post('trips/{trip}/ratings', [RatingController::class, 'store']);
});

Route::middleware(['auth:api', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('bookings', [AdminBookingController::class, 'index']);
        Route::post('bookings', [AdminBookingController::class, 'store']);
        Route::get('bookings/lookup', [AdminBookingController::class, 'lookupByCode']);

        // Group booking modification routes to ensure proper route model binding
        Route::prefix('bookings/{booking}')->group(function () {
            Route::post('mark-paid', [AdminBookingController::class, 'markAsPaid']);
            Route::post('mark-additional-payment-paid', [AdminBookingController::class, 'markAdditionalPaymentPaid']);
            Route::post('change-seat', [AdminBookingController::class, 'changeSeat']);
            Route::post('change-trip', [AdminBookingController::class, 'changeTrip']);
            Route::get('refund-policy', [AdminBookingController::class, 'getRefundPolicy']);
            Route::post('refund-price-difference', [AdminBookingController::class, 'refundPriceDifference']);
            Route::post('refund', [AdminBookingController::class, 'refund']);
        });
        Route::get('trips/{tripId}/seats', [AdminTripSeatController::class, 'show']);

        Route::get('buses/{bus}/seat-layout', [BusSeatLayoutController::class, 'show']);
        Route::put('buses/{bus}/seat-layout', [BusSeatLayoutController::class, 'update']);
        Route::delete('buses/{bus}/seat-layout/{seat}', [BusSeatLayoutController::class, 'destroy']);

        Route::get('notifications', [AdminNotificationController::class, 'index']);
        Route::post('notifications/{notification}/read', [AdminNotificationController::class, 'markAsRead']);
        Route::post('notifications/{notification}/unread', [AdminNotificationController::class, 'markAsUnread']);
        Route::post('notifications/read-all', [AdminNotificationController::class, 'markAllAsRead']);

        // Revenue management
        Route::prefix('revenue')->group(function () {
            Route::get('/dashboard', [RevenueController::class, 'dashboard']);
            Route::get('/trend', [RevenueController::class, 'trend']);
            Route::get('/top-routes', [RevenueController::class, 'topRoutes']);
            Route::get('/top-trips', [RevenueController::class, 'topTrips']);
            Route::get('/analysis', [RevenueController::class, 'analysis']);
        });

        // Route optimization
        Route::prefix('route-optimization')->group(function () {
            Route::get('/trip/{tripId}/locations', [RouteOptimizationController::class, 'getTripLocations']);
            Route::get('/trip/{tripId}', [RouteOptimizationController::class, 'optimizeTrip']);
            Route::get('/trips', [RouteOptimizationController::class, 'listTripsForDate']);
            Route::post('/trips', [RouteOptimizationController::class, 'optimizeMultipleTrips']);
        });

        // Ratings management
        Route::get('ratings', [RatingAdminController::class, 'index']);
        Route::get('ratings/summary', [RatingAdminController::class, 'summary']);

        // Payments management
        Route::get('payments', [PaymentController::class, 'index']);
        Route::get('payments/stats', [PaymentController::class, 'stats']);
    });

Route::apiResource('/users', UserController::class);
Route::apiResource('/buses', BusController::class);
Route::apiResource('/type_buses', BusTypeController::class);
Route::apiResource('/routes', RouteController::class);
Route::apiResource('/offices', OfficeController::class);
Route::apiResource('trips', TripController::class);
Route::apiResource('trip-stations', TripStationController::class);
Route::apiResource('seat-layout-templates', SeatLayoutTemplateController::class);
Route::apiResource('/coupons', CouponController::class);


Route::apiResource('locations', LocationController::class);

// Location hierarchy routes  
Route::get('locations-tree', [LocationController::class, 'tree']);
Route::get('/location/cities', [LocationController::class, 'cities']);
Route::get('districts', [LocationController::class, 'districts']);
Route::get('wards', [LocationController::class, 'wards']);

Route::get('coupons/active', [CouponController::class, 'active']);
Route::get('coupon-users/user/{userId}', [CouponUserController::class, 'getByUserId']);
Route::get('coupon-users/coupon/{couponId}', [CouponUserController::class, 'getByCouponId']);

Route::apiResource('schedule-template-trips', ScheduleTemplateTripController::class);
Route::post('trips/generate-from-templates', [TripGenerateFromTemplateController::class, 'generate']);

//---------Client API------------

Route::get('/client/locations', [ClientLocationController::class, 'index']);
Route::get('/client/locations/search', [ClientLocationController::class, 'search']);
Route::post('/client/trips/search', [TripSearchController::class, 'search']);
Route::get('client/trips/{tripId}/seats', [ClientTripSeatController::class, 'show']);

Route::post('/ai/chat', [GeminiChatController::class, 'chat']);



Route::get('/test-send-mail', function () {
    // 1. Chỉ cần findOrFail. 
    // Mailable sẽ tự lo phần load relations.
    $booking = Booking::findOrFail(2);

    // 2. Gửi mail
    Mail::to('bep2702@gmail.com')->send(new BookingSuccessMail($booking));

    return "Đã gửi mail! (Hãy kiểm tra Mailtrap inbox của bạn)";
});


