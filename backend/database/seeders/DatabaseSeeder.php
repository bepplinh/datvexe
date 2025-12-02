<?php

namespace Database\Seeders;



use Database\Seeders\BusSeeder;
use Illuminate\Database\Seeder;


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
            CouponSeeder::class,
            BookingSeeder::class,
            Route8BookingSeeder::class,
            Trip17BookingLegLocationSeeder::class,
            AdminNotificationSeeder::class,
            SeatLayoutBackfillSeeder::class,
        ]);
    }
}
