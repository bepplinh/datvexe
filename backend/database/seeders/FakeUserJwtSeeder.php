<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Str;
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
            'name' => 'Quản Trị Viên',
            'username' => 'admin',
            'email' => 'admin@datvexe.com',
            'phone' => '0901234567',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'gender' => 'male',
            'phone_verified_at' => now()
        ]);

        // 2. Tạo user ducanh
        $ducanh = User::create([
            'name' => 'Lê Đức Anh',
            'username' => 'ducanh',
            'email' => 'ducanh@datvexe.com',
            'phone' => '0912345678',
            'password' => bcrypt('user123'),
            'role' => 'customer',
            'gender' => 'male',
            'phone_verified_at' => now()
        ]);

        // 3. Tạo 48 user random
        $usedUsernames = ['admin', 'ducanh'];
        $users = [];

        for ($i = 0; $i < 48; $i++) {
            // Tạo tên tiếng Việt
            $hoRandom = $ho[array_rand($ho)];
            $tenDemRandom = $tenDem[array_rand($tenDem)];
            $tenRandom = $ten[array_rand($ten)];
            $fullName = $hoRandom . ' ' . $tenDemRandom . ' ' . $tenRandom;

            // Tạo username từ tên (không dấu + số)
            $baseUsername = $this->removeVietnameseAccents(strtolower($tenRandom));
            $username = $baseUsername;
            $counter = 1;
            
            // Đảm bảo username unique
            while (in_array($username, $usedUsernames)) {
                $username = $baseUsername . $counter;
                $counter++;
            }
            $usedUsernames[] = $username;

            // Random giới tính dựa trên tên đệm
            $gender = in_array($tenDemRandom, ['Thị', 'Thu', 'Ngọc', 'Kim', 'Hồng']) ? 'female' : 'male';

            // Random ngày sinh (18-60 tuổi)
            $birthday = now()->subYears(rand(18, 60))->subDays(rand(0, 365))->format('Y-m-d');

            $user = User::create([
                'name' => $fullName,
                'username' => $username,
                'email' => $username . '@gmail.com',
                'phone' => $this->randomPhoneNumber(),
                'birthday' => $birthday,
                'password' => bcrypt('user123'),
                'role' => 'customer',
                'gender' => $gender,
                'phone_verified_at' => now()
            ]);

            $users[] = $user;
        }

        // Sinh JWT token cho admin và ducanh
        $adminToken = JWTAuth::fromUser($admin);
        $ducanhToken = JWTAuth::fromUser($ducanh);

        // Lưu ra file để tiện copy token test nhanh
        $payload = [
            'note' => 'Dùng Authorization: Bearer <token> để test API',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'username' => $admin->username,
                'password' => 'admin123',
                'token' => $adminToken,
            ],
            'ducanh' => [
                'id' => $ducanh->id,
                'name' => $ducanh->name,
                'username' => $ducanh->username,
                'password' => 'user123',
                'token' => $ducanhToken,
            ],
            'total_users' => 50,
            'all_user_password' => 'user123',
        ];

        Storage::put(
            'private/jwt_test_users.json',
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        $this->command->info("✅ Created 50 users (1 admin + 49 customers)");
        $this->command->info("   - Admin: admin / admin123");
        $this->command->info("   - DucAnh: ducanh / user123");
        $this->command->info("   - All other users: user123");
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
