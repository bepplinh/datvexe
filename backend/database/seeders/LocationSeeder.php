<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // 1. Hà Nội
            'Hà Nội' => [
                'Bến xe Giáp bát' => [],
                'Bến xe Mỹ Đình' => [],
                'Thường Tín' => [],
                'Vạn Điểm' => [],
            ],

            // 2. Hà Nam
            'Hà Nam' => [
                'Đồng Văn' => [],
                'Vực Vòng' => [],
                'Cầu Giẽ' => [],
                'Liêm Tuyền' => [],
            ],

            // 3. Nam Định
            'Nam Định' => [
                'Cao Bồ' => [],
                'Ý Yên' => [],
            ],

            // 4. Ninh Bình
            'Ninh Bình' => [
                'Vòng xuyến Mai Sơn' => [],
            ],

            // 5. Thanh Hóa
            'Thanh Hóa' => [
                'Triệu Sơn' => [
                    'Thọ phú',
                    'Thiều',
                    'Hào',
                ],
                'Thiệu hoá' => [
                    'Núi Đọ',
                ],
                'Thọ Xuân' => [],
            ],
        ];

        foreach ($data as $cityName => $districts) {
            // Insert city
            $cityId = DB::table('locations')->insertGetId([
                'name' => $cityName,
                'type' => 'city',
                'parent_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($districts as $districtName => $wards) {
                // Insert district
                $districtId = DB::table('locations')->insertGetId([
                    'name' => $districtName,
                    'type' => 'district',
                    'parent_id' => $cityId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Insert wards
                foreach ($wards as $wardName) {
                    DB::table('locations')->insert([
                        'name' => $wardName,
                        'type' => 'ward',
                        'parent_id' => $districtId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
