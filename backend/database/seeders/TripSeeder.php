<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TripSeeder extends Seeder
{
    /**
     * Chạy các seeder database để chèn trips cho tất cả routes.
     * Tạo trips cho 1 tuần từ ngày mai, mỗi ngày 6 trip/route, bắt đầu 8h sáng, cách nhau 1 tiếng.
     */
    public function run(): void
    {
        // Lấy tất cả routes và buses
        $routes = DB::table('routes')->get();
        $buses = DB::table('buses')->get();

        if ($routes->isEmpty() || $buses->isEmpty()) {
            $this->command->warn('⚠️ Cannot seed trips: missing routes or buses.');
            return;
        }

        $trips_to_seed = [];
        
        // Số ngày: 7 ngày từ ngày mai
        $numberOfDays = 7;
        // Số trip mỗi ngày: 6 trip
        $tripsPerDay = 6;
        // Giờ bắt đầu: 8:00
        $startHour = 8;
        
        // Tạo trips cho mỗi route
        foreach ($routes as $route) {
            // Lấy danh sách bus để phân bổ đều
            $busIds = $buses->pluck('id')->toArray();
            $busIndex = 0;
            
            // Tạo trips cho 7 ngày
            for ($day = 1; $day <= $numberOfDays; $day++) {
                // Tạo 6 trips mỗi ngày, bắt đầu từ 8:00, cách nhau 1 tiếng
                for ($tripIndex = 0; $tripIndex < $tripsPerDay; $tripIndex++) {
                    $departureTime = Carbon::tomorrow()
                        ->addDays($day - 1)
                        ->setTime($startHour + $tripIndex, 0);
                    
                    // Phân bổ bus đều (round-robin)
                    $busId = $busIds[$busIndex % count($busIds)];
                    $busIndex++;
                    
                    $trips_to_seed[] = [
                        'route_id'       => $route->id,
                        'bus_id'         => $busId,
                        'departure_time' => $departureTime,
                        'status'         => 'scheduled',
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ];
                }
            }
        }

        if (!empty($trips_to_seed)) {
            DB::table('trips')->insert($trips_to_seed);
            $this->command->info('✅ Seeded ' . count($trips_to_seed) . ' trips for ' . $routes->count() . ' routes.');
            $this->command->info('   - ' . $numberOfDays . ' days × ' . $tripsPerDay . ' trips/day × ' . $routes->count() . ' routes = ' . count($trips_to_seed) . ' trips');
        }
    }
}
