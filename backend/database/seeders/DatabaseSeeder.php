<?php

namespace Database\Seeders;


use App\Models\User;
use Database\Seeders\BusSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            FakeUserJwtSeeder::class,
            LocationSeeder::class,
            RouteSeeder::class,
            TripStationSeeder::class,
            SeatLayoutTemplateSeeder::class,
            BusSeeder::class,
            SeatSeeder::class,
            TripSeeder::class,
            ScheduleTemplateTripSeeder::class,
            CouponSeeder::class
        ]);
    }
}
