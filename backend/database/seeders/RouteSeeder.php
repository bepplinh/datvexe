<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RouteSeeder extends Seeder
{
    public function run(): void
    {
        // Chỉ tạo 2 tuyến: Thanh Hóa - Hà Nội và ngược lại
        $pairs = [
            ['from' => 'Thanh Hóa', 'to' => 'Hà Nội'],
        ];

        foreach ($pairs as $p) {
            $fromId = DB::table('locations')->where('name', $p['from'])->where('type','city')->value('id');
            $toId   = DB::table('locations')->where('name', $p['to'])->where('type','city')->value('id');
            if (!$fromId || !$toId) {
                $this->command->warn("⚠️ Cannot find locations: {$p['from']} or {$p['to']}");
                continue;
            }

            // Forward: Thanh Hóa -> Hà Nội
            $existsFwd = DB::table('routes')->where('from_city', $fromId)->where('to_city', $toId)->exists();
            if (!$existsFwd) {
                DB::table('routes')->insert([
                    'from_city' => $fromId,
                    'to_city'   => $toId,
                    'name'      => $p['from'] . ' - ' . $p['to'],
                    'created_at'=> now(),
                    'updated_at'=> now(),
                ]);
                $this->command->info("✅ Created route: {$p['from']} - {$p['to']}");
            }

            // Reverse: Hà Nội -> Thanh Hóa
            $existsRev = DB::table('routes')->where('from_city', $toId)->where('to_city', $fromId)->exists();
            if (!$existsRev) {
                DB::table('routes')->insert([
                    'from_city' => $toId,
                    'to_city'   => $fromId,
                    'name'      => $p['to'] . ' - ' . $p['from'],
                    'created_at'=> now(),
                    'updated_at'=> now(),
                ]);
                $this->command->info("✅ Created route: {$p['to']} - {$p['from']}");
            }
        }
    }
}
