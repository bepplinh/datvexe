<?php

namespace Database\Seeders;

use App\Models\Bus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
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

        // 3. Lấy danh sách template seat hiện có để random
        $layoutIds = DB::table('seat_layout_templates')->pluck('id')->all();
        if (empty($layoutIds)) {
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
            ],
            [
                'code'                   => 'BUS002',
                'name'                   => 'Xe limousine B',
                'plate_number'           => '51B-67890',
                'type_bus_id'            => $typeId('Limousine'),
            ],
            [
                'code'                   => 'BUS003',
                'name'                   => 'Xe ghế ngồi C',
                'plate_number'           => '51C-11223',
                'type_bus_id'            => $typeId('Ghế ngồi'),
            ],
            [
                'code'                   => 'BUS004',
                'name'                   => 'Xe giường nằm D',
                'plate_number'           => '51D-44556',
                'type_bus_id'            => $typeId('Giường nằm'),
            ],
            [
                'code'                   => 'BUS005',
                'name'                   => 'Xe limousine E',
                'plate_number'           => '51E-77889',
                'type_bus_id'            => $typeId('Limousine'),
            ],
        ];

        // 5. Insert hoặc update
        foreach ($buses as $bus) {
            $bus['seat_layout_template_id'] = Arr::random($layoutIds);

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