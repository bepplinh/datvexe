<?php

namespace Database\Seeders;

use App\Models\Bus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BusSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed type_buses
        $types = [
            ['name' => 'Giường nằm', 'seat_count' => 38],
            ['name' => 'Limousine',  'seat_count' => 24],
            ['name' => 'Ghế ngồi',   'seat_count' => 45],
        ];

        foreach ($types as $t) {
            DB::table('type_buses')->updateOrInsert(
                ['name' => $t['name']],
                [
                    'seat_count' => $t['seat_count'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        // 2. Map type name -> id
        $typeId = fn(string $name) => DB::table('type_buses')->where('name', $name)->value('id');

        // 3. Map code template -> id để gán cố định cho từng xe
        $tplIdByCode = DB::table('seat_layout_templates')
            ->pluck('id', 'code')
            ->all();

        if (empty($tplIdByCode)) {
            $this->command?->warn('⚠️ Cannot seed buses: no seat layout templates found.');
            return;
        }

        // 4. Danh sách bus cơ bản (layout sẽ random bên dưới)
        $buses = [
            [
                'code'                   => 'BUS001',
                'name'                   => 'Xe giường nằm A',
                'plate_number'           => '51A-12345',
                'type_bus_id'            => $typeId('Giường nằm'),
                'seat_layout_template_id'=> $tplIdByCode['SL-24-2D'] ?? null,
            ],
            [
                'code'                   => 'BUS002',
                'name'                   => 'Xe limousine B',
                'plate_number'           => '51B-67890',
                'type_bus_id'            => $typeId('Limousine'),
                'seat_layout_template_id'=> $tplIdByCode['SL-22-2D'] ?? null,
            ],
            [
                'code'                   => 'BUS003',
                'name'                   => 'Xe ghế ngồi C',
                'plate_number'           => '51C-11223',
                'type_bus_id'            => $typeId('Ghế ngồi'),
                'seat_layout_template_id'=> $tplIdByCode['SL-24-1D'] ?? null,
            ],
            [
                'code'                   => 'BUS004',
                'name'                   => 'Xe giường nằm D',
                'plate_number'           => '51D-44556',
                'type_bus_id'            => $typeId('Giường nằm'),
                'seat_layout_template_id'=> $tplIdByCode['SL-16-1D'] ?? null,
            ],
            [
                'code'                   => 'BUS005',
                'name'                   => 'Xe limousine E',
                'plate_number'           => '51E-77889',
                'type_bus_id'            => $typeId('Limousine'),
                'seat_layout_template_id'=> $tplIdByCode['SL-8-1D'] ?? null,
            ],
            [
                'code'                   => 'BUS006',
                'name'                   => 'Xe giường 44 chỗ (mẫu 3 cột)',
                'plate_number'           => '51F-99001',
                'type_bus_id'            => $typeId('Giường nằm'),
                // Dùng lại template 3 cột 2 tầng, tạo tổng cộng 6 xe cho 5 template
                'seat_layout_template_id'=> $tplIdByCode['SL-44-3C'] ?? null,
            ],
        ];

        // 5. Insert hoặc update
        foreach ($buses as $bus) {
            $existing = Bus::where('code', $bus['code'])
                ->orWhere('plate_number', $bus['plate_number'])
                ->first();

            if ($existing) {
                $existing->update($bus);
            } else {
                Bus::create($bus);
            }
        }
    }
}