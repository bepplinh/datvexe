<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\DB;

class FakeUserJwtSeeder extends Seeder
{
    public function run(): void
    {
        // Xóa dữ liệu users cũ
        $this->command->info("🗑️ Deleting old user data...");
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        User::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->command->info("✅ Old user data deleted.");

        // Danh sách họ tiếng Việt
        $ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Tô', 'Cao', 'Lưu'];
        
        // Danh sách tên đệm
        $tenDem = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Thanh', 'Quang', 'Thu', 'Anh', 'Hoàng', 'Ngọc', 'Kim', 'Phương', 'Hồng', 'Xuân', 'Thế', 'Công', 'Bảo'];
        
        // Danh sách tên
        $ten = ['An', 'Bình', 'Cường', 'Dung', 'Em', 'Hà', 'Hùng', 'Hương', 'Khánh', 'Linh', 'Long', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Tùng', 'Vy', 'Yến', 'Đạt', 'Dũng', 'Hiếu', 'Huy', 'Khoa', 'Lâm', 'Minh', 'Nhật', 'Phong', 'Quang', 'Thành', 'Toàn', 'Trung', 'Tuấn', 'Vinh'];

        // 1. Tạo admin (quản trị viên)
        $admin = User::create([
            'name' => 'Admin Tester',
            'username' => 'admintester',
            'email' => 'admin@datvexe.com',
            'phone' => '0901234567',
            'password' => bcrypt('admin12345'),
            'role' => 'admin',
            'gender' => 'male',
            'phone_verified_at' => now()
        ]);

        // 2. Tạo 49 user random
        $usedUsernames = ['admintester'];
        $users = [];

        for ($i = 0; $i < 49; $i++) {
            // Tạo tên tiếng Việt
            $hoRandom = $ho[array_rand($ho)];
            $tenDemRandom = $tenDem[array_rand($tenDem)];
            $tenRandom = $ten[array_rand($ten)];
            $fullName = $hoRandom . ' ' . $tenDemRandom . ' ' . $tenRandom;

            // Tạo username từ tên đệm + tên (không dấu) + số random
            $username = $this->generateUsername($tenDemRandom, $tenRandom, $usedUsernames);
            $usedUsernames[] = $username;

            // Random giới tính
            $gender = rand(0, 1) ? 'male' : 'female';

            // Random ngày sinh (18-60 tuổi)
            $birthday = now()->subYears(rand(18, 60))->subDays(rand(0, 365))->format('Y-m-d');

            // Random phone_verified_at (có hoặc không)
            $phoneVerifiedAt = rand(0, 1) ? now() : null;

            $user = User::create([
                'name' => $fullName,
                'username' => $username,
                'email' => $username . '@gmail.com',
                'phone' => $this->randomPhoneNumber(),
                'birthday' => $birthday,
                'password' => bcrypt('user12345'),
                'role' => 'customer',
                'gender' => $gender,
                'phone_verified_at' => $phoneVerifiedAt
            ]);

            $users[] = $user;
        }

        // Sinh JWT token cho admin
        $adminToken = JWTAuth::fromUser($admin);

        // Lưu ra file để tiện copy token test nhanh
        $payload = [
            'note' => 'Dùng Authorization: Bearer <token> để test API',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'username' => $admin->username,
                'password' => 'admin12345',
                'token' => $adminToken,
            ],
            'total_users' => 50,
            'all_user_password' => 'user12345',
        ];

        Storage::put(
            'private/jwt_test_users.json',
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        $this->command->info("✅ Created 50 users (1 admin + 49 customers)");
        $this->command->info("   - Admin: admintester / admin12345");
        $this->command->info("   - All other users: user12345 (username 6 chars)");
    }

    /**
     * Tạo username từ tên đệm + tên (không dấu) + số random
     * Ví dụ: kieuanh123, thuylinh456
     */
    private function generateUsername(string $tenDem, string $ten, array $usedUsernames): string
    {
        // Chuyển tên đệm và tên thành không dấu, viết thường
        $baseUsername = $this->removeVietnameseAccents(strtolower($tenDem . $ten));
        
        do {
            // Thêm số random 3 chữ số
            $username = $baseUsername . rand(100, 999);
        } while (in_array($username, $usedUsernames));
        
        return $username;
    }

    /**
     * Loại bỏ dấu tiếng Việt
     */
    private function removeVietnameseAccents(string $str): string
    {
        $unicode = [
            'a' => 'á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ',
            'd' => 'đ',
            'e' => 'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ',
            'i' => 'í|ì|ỉ|ĩ|ị',
            'o' => 'ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ',
            'u' => 'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự',
            'y' => 'ý|ỳ|ỷ|ỹ|ỵ',
        ];

        foreach ($unicode as $nonAccent => $pattern) {
            $str = preg_replace("/($pattern)/i", $nonAccent, $str);
        }

        return $str;
    }


    /**
     * Tạo số điện thoại ngẫu nhiên
     */
    private function randomPhoneNumber(): string
    {
        $prefixes = ['09', '08', '07', '03', '05'];
        return $prefixes[array_rand($prefixes)] . rand(10000000, 99999999);
    }
}
