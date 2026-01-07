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
                    // Giá random: 100k, 200k, hoặc 300k
                    $priceOptions = [100000, 200000, 300000];
                    $basePrice = $priceOptions[array_rand($priceOptions)];

                    // Duration random: 90, 120, 150, hoặc 180 phút
                    $durationOptions = [90, 120, 150, 180];
                    $duration = $durationOptions[array_rand($durationOptions)];

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
