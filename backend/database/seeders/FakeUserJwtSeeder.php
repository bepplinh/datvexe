<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;



class FakeUserJwtSeeder extends Seeder
{
    public function run(): void
    {
        // Tạo admin
        $admin = User::create([
            'name' => 'Test Admin',
            'username' => 'admintester',
            'email' => null,
            'phone' => null,
            'password' => bcrypt('admin123'),
            'role' => 'admin', // nếu có cột role
            'gender' => 'male', // nếu có cột gender
            'phone_verified_at' => now()
        ]);

        // Tạo user thường
        $user1 = User::create([
            'name' => 'Test User',
            'username' => 'usertester',
            'email' => null,
            'phone' => null,
            'password' => bcrypt('user123'),
            'role' => 'customer', // nếu có cột role
            'gender' => 'male', // nếu có cột gender
            'phone_verified_at' => now()
        ]);

         // Tạo user thường
         $user2 = User::create([
            'name' => 'ducanh',
            'username' => 'ducanh',
            'email' => null,
            'phone' => null,
            'password' => bcrypt('user123'),
            'role' => 'customer', // nếu có cột role
            'gender' => 'male', // nếu có cột gender
            'phone_verified_at' => now()
        ]);

        // Sinh JWT token
        $adminToken  = JWTAuth::fromUser($admin);
        $userToken1  = JWTAuth::fromUser($user1);
        $userToken2  = JWTAuth::fromUser($user2);

        // Lưu ra file để tiện copy token test nhanh
        $payload = [
            'note'  => 'Dùng Authorization: Bearer <token> để test API',
            'admin' => [
                'name'     => $admin->name,
                'username' => $admin->username,
                'password' => 'admin123',
                'token'    => $adminToken,
            ],
            'user1' => [
                'name'     => $user1->name,
                'username' => $user1->username,
                'password' => 'user123',
                'token'    => $userToken1,
            ],
            'user2' => [
                'name'     => $user2->name,
                'username' => $user2->username,
                'password' => 'user123',
                'token'    => $userToken2,
            ],
        ];

        Storage::put(
            'private/jwt_test_users.json',
            json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }
}
