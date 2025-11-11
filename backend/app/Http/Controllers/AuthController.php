<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\JwtCookieService;
use App\Http\Requests\LoginRequest;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\RateLimiter;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(private JwtCookieService $cookie) {}

    // POST /api/auth/login - dùng chung cho admin + customer
    public function login(LoginRequest $request)
    {
        $data = $request->validate([
            'identifier'  => ['required', 'string'],  // username hoặc phone
            'password'    => ['required', 'string'],
            'remember_me' => ['sometimes', 'boolean'],
        ]);

        $identifier = $data['identifier'];
        $password   = $data['password'];
        $remember   = (bool)($data['remember_me'] ?? false);

        // 1) Rate limit
        $key = 'auth-login:' . strtolower($identifier) . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $sec = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Thử lại sau {$sec} giây.",
            ], 429);
        }

        // 2) TTL token: 30 ngày nếu remember_me, còn lại 60 phút
        $ttlMinutes = $remember ? 43200 : 60;
        config(['jwt.ttl' => $ttlMinutes]);

        // 3) Xác định xem identifier có phải số điện thoại E.164 không
        $isPhone = preg_match('/^\+[1-9]\d{6,14}$/', $identifier) === 1;

        $token = null;

        // 4) Thử login bằng username trước (áp dụng được cho admin + customer)
        $token = auth('api')->attempt([
            'username' => $identifier,
            'password' => $password,
        ]);

        // 5) Nếu chưa login được & identifier là phone → thử login theo phone
        if (! $token && $isPhone) {
            $token = auth('api')->attempt([
                'phone'    => $identifier,
                'password' => $password,
            ]);
        }

        // 6) Nếu vẫn không login được → sai tài khoản / mật khẩu
        if (! $token) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'success' => false,
                'message' => 'Sai tài khoản hoặc mật khẩu, vui lòng thử lại',
            ], 401);
        }

        RateLimiter::clear($key);

        $user = auth('api')->user();

        // 7) Nếu là customer thì bắt buộc phone đã verify (vì đăng ký qua OTP)
        if ($user->role === 'customer' && ! $user->phone_verified_at) {
            auth('api')->logout();

            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại chưa được xác thực',
            ], 403);
        }

        // 8) Tạo response có token + user + expires_in
        $resp = $this->respondWithToken($token);

        // 9) Gắn JWT vào cookie (nếu JwtCookieService làm việc đó)
        $this->cookie->attach($resp, $token);

        return $resp;
    }


    public function logout(Request $request)
    {
        try {
            // Đăng xuất guard 'api' (vô hiệu hóa JWT hiện tại)
            auth('api')->logout();

            // Xóa cookie JWT nếu có JwtCookieService
            $resp = response()->json([
                'success' => true,
                'message' => 'Đăng xuất thành công',
            ]);

            // Gắn cookie rỗng để xoá JWT khỏi trình duyệt
            $this->cookie->clear($resp);

            return $resp;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đăng xuất thất bại hoặc token không hợp lệ',
            ], 400);
        }
    }


    // POST /api/refresh - Refresh JWT token
    public function refresh(Request $request)
    {
        try {
            // Refresh token và lấy token mới (parse từ request)
            $token = JWTAuth::parseToken()->refresh();
            
            // Lấy user hiện tại từ token mới
            $user = JWTAuth::setToken($token)->authenticate();
            
            // Tạo response với token mới
            $ttlMinutes = (int) config('jwt.ttl', 60);
            $resp = response()->json([
                'success'      => true,
                'message'      => 'Refresh token thành công',
                'access_token' => $token,
                'token_type'   => 'bearer',
                'expires_in'   => $ttlMinutes * 60,
                'user'         => $user,
            ]);
            
            // Cập nhật cookie với token mới
            $this->cookie->attach($resp, $token);
            
            return $resp;
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token đã hết hạn, vui lòng đăng nhập lại',
            ], 401);
        } catch (\PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token không hợp lệ',
            ], 401);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể refresh token: ' . $e->getMessage(),
            ], 400);
        }
    }

    // GET /api/me (middleware auth:api)
    public function me()
    {
        return response()->json(auth('api')->user());
    }

    protected function respondWithToken(string $token)
    {
        // Lấy TTL vừa set ở trên (jwt.ttl)
        $ttlMinutes = (int) config('jwt.ttl', 60);

        return response()->json([
            'success'      => true,
            'message'      => 'Đăng nhập thành công',
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => $ttlMinutes * 60,
            'user'         => auth('api')->user(),
        ]);
    }
}
