<?php

namespace Database\Seeders;

use App\Models\BookingLeg;
use App\Models\Location;
use App\Models\Trip;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class Trip17BookingLegLocationSeeder extends Seeder
{
    public function run(): void
    {
        $tripId = 17;

        $trip = Trip::with('route')->find($tripId);
        if (!$trip || !$trip->route) {
            $this->command?->warn("⚠️ Trip17BookingLegLocationSeeder: Không tìm thấy trip {$tripId} hoặc route liên quan.");
            return;
        }

        $pickupLocations = $this->getLocationsForCity($trip->route->from_city);
        $dropoffLocations = $this->getLocationsForCity($trip->route->to_city);

        if ($pickupLocations->isEmpty() || $dropoffLocations->isEmpty()) {
            $this->command?->warn('⚠️ Trip17BookingLegLocationSeeder: Thiếu dữ liệu locations cho from_city/to_city.');
            return;
        }

        $legs = BookingLeg::where('trip_id', $tripId)->orderBy('id')->get();
        if ($legs->isEmpty()) {
            $this->command?->warn("⚠️ Trip17BookingLegLocationSeeder: Trip {$tripId} chưa có booking legs để cập nhật.");
            return;
        }

        $pickupLocations = $pickupLocations->values();
        $dropoffLocations = $dropoffLocations->values();

        $this->command?->info("🚍 Trip17BookingLegLocationSeeder: Gán pickup/dropoff locations cho {$legs->count()} booking legs (trip {$tripId}).");

        foreach ($legs as $index => $leg) {
            $pickup = $pickupLocations[$index % $pickupLocations->count()];
            $dropoff = $dropoffLocations[$index % $dropoffLocations->count()];

            $leg->update([
                'pickup_location_id' => $pickup->id,
                'pickup_address' => $this->buildAddress($pickup),
                'dropoff_location_id' => $dropoff->id,
                'dropoff_address' => $this->buildAddress($dropoff),
            ]);

            $this->command?->line("✓ Leg #{$leg->id}: {$pickup->name} ➜ {$dropoff->name}");
        }

        $this->command?->info('✅ Trip17BookingLegLocationSeeder: Hoàn tất cập nhật pickup/dropoff cho trip 17.');
    }

    private function getLocationsForCity(int $cityId): Collection
    {
        $districts = Location::where('parent_id', $cityId)
            ->where('type', 'district')
            ->get();

        $wards = $districts->isEmpty()
            ? collect()
            : Location::whereIn('parent_id', $districts->pluck('id'))
                ->where('type', 'ward')
                ->get();

        return $districts->concat($wards);
    }

    private function buildAddress(Location $location): string
    {
        return $location->full_path ?? $location->name;
    }
}

