<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwilioVerifyService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class OtpAuthController extends Controller
{
    public function __construct(
        private TwilioVerifyService $sms,
    ) {}

    /**
     * GỬI OTP
     * POST /api/auth/otp/start
     *
     * Body (đăng ký):
     * {
     *   "phone": "+84901234567",
     *   "purpose": "register"
     * }
     *
     * Body (quên mật khẩu):
     * {
     *   "phone": "+84901234567",
     *   "purpose": "reset_password"
     * }
     */
    public function start(Request $request)
    {
        $data = $request->validate([
            'phone'   => ['required', 'regex:/^\+[1-9]\d{6,14}$/'], // E.164: +84...
            'purpose' => ['required', 'in:register,reset_password'],
            'channel' => ['nullable', 'in:sms,call,whatsapp,email,auto,sna'],
        ]);

        $phone   = $data['phone'];
        $purpose = $data['purpose'];

        // 0) Logic riêng cho từng purpose
        if ($purpose === 'register') {
            // Đăng ký: phone chưa được dùng
            if (User::where('phone', $phone)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Số điện thoại đã được sử dụng',
                ], 422);
            }
        } elseif ($purpose === 'reset_password') {
            // Quên mật khẩu: user phải tồn tại & là customer
            $user = User::where('phone', $phone)
                ->where('role', 'customer')
                ->first();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy tài khoản với số điện thoại này',
                ], 404);
            }

            if (! $user->phone_verified_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Số điện thoại này chưa được xác thực',
                ], 403);
            }
        }

        // 1) Rate limit theo phone + purpose + IP
        $key = 'otp-start:' . $purpose . ':' . $phone . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $sec = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Bạn thao tác quá nhanh, thử lại sau {$sec} giây.",
            ], 429);
        }
        RateLimiter::hit($key, 60); // 60 giây

        // 2) Gọi Twilio Verify gửi OTP (qua TwilioVerifyService)
        $channel = $data['channel'] ?? 'sms';
        $this->sms->start($phone, $channel, ['locale' => 'vi']);

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi OTP',
            'phone'   => $phone,
            'purpose' => $purpose,
            'status'  => 'pending',
        ]);
    }

    /**
     * XÁC NHẬN OTP
     * POST /api/auth/otp/verify
     *
     * Body (đăng ký):
     * {
     *   "phone": "+84901234567",
     *   "code": "123456",
     *   "purpose": "register"
     * }
     *
     * Body (quên mật khẩu):
     * {
     *   "phone": "+84901234567",
     *   "code": "123456",
     *   "purpose": "reset_password",
     *   "new_password": "abcd1234"
     * }
     */
    public function verify(Request $request)
    {
        $data = $request->validate([
            'phone'        => ['required', 'regex:/^\+[1-9]\d{6,14}$/'],
            'code'         => ['required', 'digits_between:4,8'],
            'purpose'      => ['required', 'in:register,reset_password'],
            'new_password' => ['required_if:purpose,reset_password', 'nullable', 'string', 'min:6'],
        ]);

        $phone   = $data['phone'];
        $code    = $data['code'];
        $purpose = $data['purpose'];

        // 1) Gọi Twilio Verify check OTP
        $approved = $this->sms->check($phone, $code);

        if (! $approved) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn',
            ], 422);
        }

        // 2A) Đăng ký tài khoản mới: trả về register_token
        if ($purpose === 'register') {
            // Double check tránh race-condition
            if (User::where('phone', $phone)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Số điện thoại đã được sử dụng',
                ], 422);
            }

            $registerToken = $this->makeRegisterToken($phone);

            return response()->json([
                'success'        => true,
                'message'        => 'Xác thực OTP thành công',
                'purpose'        => 'register',
                'register_token' => $registerToken,
                'phone'          => $phone,
            ]);
        }

        // 2B) Quên mật khẩu: đổi mật khẩu luôn
        if ($purpose === 'reset_password') {
            $user = User::where('phone', $phone)
                ->where('role', 'customer')
                ->first();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy tài khoản tương ứng',
                ], 404);
            }

            $user->password = Hash::make($data['new_password']);
            if (! $user->phone_verified_at) {
                $user->phone_verified_at = Carbon::now();
            }
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Đặt lại mật khẩu thành công',
                'purpose' => 'reset_password',
            ]);
        }

        // Lý thuyết không tới được đây
        return response()->json([
            'success' => false,
            'message' => 'Mục đích OTP không hợp lệ',
        ], 400);
    }

    /**
     * HOÀN TẤT ĐĂNG KÝ (sau khi OTP OK)
     *
     * POST /api/auth/register/complete
     *
     * Body:
     * {
     *   "register_token": "...",
     *   "username": "usertester",
     *   "password": "123456",
     *   "name": "Test User",
     *   "birthday": "2003-10-01",
     *   "email": "abc@example.com"
     * }
     *
     * → Tạo user role=customer, phone từ token, phone_verified_at = now()
     *   (Login dùng AuthController@login)
     */
    public function completeRegister(Request $request)
    {
        $data = $request->validate([
            'register_token' => ['required', 'string'],
            'username'       => ['required', 'string', 'min:4', 'max:32', 'alpha_dash', 'unique:users,username'],
            'password'       => [
                'required',
                'string',
                'min:6',
                'regex:/[A-Z]/',           // Ít nhất 1 chữ in hoa
                'regex:/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\\\/`~;\']/',  // Ít nhất 1 ký tự đặc biệt
            ],
            'name'           => ['nullable', 'string', 'max:255'],
            'birthday'       => ['nullable', 'date'],
            'email'          => ['nullable', 'email:rfc', 'unique:users,email'],
        ]);

        $payload = $this->parseRegisterToken($data['register_token']);
        if (! $payload || empty($payload['phone'])) {
            return response()->json([
                'success' => false,
                'message' => 'register_token không hợp lệ hoặc đã hết hạn',
            ], 400);
        }

        $phone = $payload['phone'];

        // Chặn trường hợp phone bị dùng sau khi verify
        if (User::where('phone', $phone)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Số điện thoại đã được sử dụng',
            ], 422);
        }

        $user = User::create([
            'username'          => $data['username'],
            'password'          => Hash::make($data['password']),
            'name'              => $data['name'] ?? null,
            'birthday'          => $data['birthday'] ?? null,
            'email'             => $data['email'] ?? null,
            'phone'             => $phone,
            'role'              => 'customer',
            'phone_verified_at' => Carbon::now(),
        ]);

        $token = auth('api')->login($user);

        // Trả về token và user để frontend có thể đăng nhập tự động
        return response()->json([
            'success'      => true,
            'message'      => 'Tạo tài khoản thành công',
            'access_token' => $token,
            'token_type'   => 'bearer',
            'user'         => $user,
        ]);
    }

    /**
     * Tạo register_token từ phone (mã hóa + TTL 15 phút)
     */
    private function makeRegisterToken(string $phone): string
    {
        $payload = [
            'phone' => $phone,
            'iat'   => time(),
        ];

        return Crypt::encryptString(json_encode($payload));
    }

    /**
     * Giải mã & kiểm tra register_token có hợp lệ + chưa hết hạn hay không
     */
    private function parseRegisterToken(string $token): ?array
    {
        try {
            $json = Crypt::decryptString($token);
            $data = json_decode($json, true);

            if (! is_array($data) || empty($data['phone']) || empty($data['iat'])) {
                return null;
            }

            // TTL 15 phút cho register_token
            $maxAge = 15 * 60;
            if (time() - (int) $data['iat'] > $maxAge) {
                return null;
            }

            return $data;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
