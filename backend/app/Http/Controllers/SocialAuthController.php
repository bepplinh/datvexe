<?php

namespace App\Http\Controllers;

use App\Http\Requests\Social\SocialLoginRequest;
use App\Services\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;

class SocialAuthController extends Controller
{
    public function __construct(
        private SocialAuthService $socialAuthService
    ) {}

    public function loginWithToken(SocialLoginRequest $request): JsonResponse
    {
        $result = $this->socialAuthService->loginWithGoogleToken($request->access_token);

        return response()->json([
            'access_token' => $result['token'],
            'token_type'   => 'bearer',
            'expires_in'   => $result['expires_in'],
        ]);
    }

    /**
     * Lấy Google Client ID cho frontend
     * Client ID là public nên có thể expose ra frontend
     */
    public function getGoogleClientId(): JsonResponse
    {
        $clientId = Config::get('services.google.client_id');

        if (!$clientId) {
            return response()->json([
                'error' => 'Google Client ID chưa được cấu hình'
            ], 500);
        }

        return response()->json([
            'client_id' => $clientId,
        ]);
    }
}
