<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TripStationSeeder extends Seeder
{
    public function run(): void
    {
        $routes = DB::table('routes')->get();

        foreach ($routes as $route) {
            // Lấy thông tin route
            $fromCity = DB::table('locations')->where('id', $route->from_city)->first();
            $toCity = DB::table('locations')->where('id', $route->to_city)->first();

            if (!$fromCity || !$toCity) {
                continue;
            }

            // Lấy tất cả các districts và wards của from_city và to_city
            $fromDistricts = DB::table('locations')
                ->where('parent_id', $route->from_city)
                ->where('type', 'district')
                ->pluck('id')
                ->toArray();
            
            $toDistricts = DB::table('locations')
                ->where('parent_id', $route->to_city)
                ->where('type', 'district')
                ->pluck('id')
                ->toArray();

            // Lấy tất cả các districts trực tiếp thuộc city
            $fromDistrictLocations = DB::table('locations')
                ->where('parent_id', $route->from_city)
                ->where('type', 'district')
                ->get();
            
            $toDistrictLocations = DB::table('locations')
                ->where('parent_id', $route->to_city)
                ->where('type', 'district')
                ->get();

            // Lấy tất cả các wards thuộc các districts
            $fromWardLocations = collect();
            if (!empty($fromDistricts)) {
                $fromWardLocations = DB::table('locations')
                    ->whereIn('parent_id', $fromDistricts)
                    ->where('type', 'ward')
                    ->get();
            }
            
            $toWardLocations = collect();
            if (!empty($toDistricts)) {
                $toWardLocations = DB::table('locations')
                    ->whereIn('parent_id', $toDistricts)
                    ->where('type', 'ward')
                    ->get();
            }

            // Kết hợp districts và wards
            $fromLocations = $fromDistrictLocations->merge($fromWardLocations);
            $toLocations = $toDistrictLocations->merge($toWardLocations);

            if ($fromLocations->isEmpty() || $toLocations->isEmpty()) {
                $this->command->warn("⚠️ No locations found for route: {$route->name}");
                continue;
            }

            // Tạo trip stations cho tất cả các cặp from_location -> to_location
            $tripStations = [];
            
            foreach ($fromLocations as $fromLocation) {
                foreach ($toLocations as $toLocation) {
                    // Tính giá dựa trên khoảng cách (giả định)
                    // Giá cơ bản từ 100k đến 500k
                    $basePrice = rand(100000, 500000);
                    
                    // Tính duration (giả định 60-300 phút)
                    $duration = rand(60, 300);
                    
                    $tripStations[] = [
                        'route_id' => $route->id,
                        'from_location_id' => $fromLocation->id,
                        'to_location_id' => $toLocation->id,
                        'price' => $basePrice,
                        'duration_minutes' => $duration,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            if (!empty($tripStations)) {
                DB::table('trip_stations')->insert($tripStations);
                $this->command->info("✅ Created " . count($tripStations) . " trip stations for route: {$route->name}");
            }
        }
    }
} 