<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Services\SeatMaterializerService;
use Illuminate\Database\Seeder;

class SeatSeeder extends Seeder
{
    public function run(): void
    {
        $materializer = app(SeatMaterializerService::class);

        Bus::query()
            ->orderBy('id')
            ->get()
            ->each(function (Bus $bus) use ($materializer) {
                if (!$bus->seat_layout_template_id) {
                    return;
                }

                $count = $materializer->materialize($bus, overwrite: true);

                if ($count === 0) {
                    $this->command?->warn("No template seats found for bus {$bus->code}.");
                    return;
                }

                $this->command?->info("Materialized {$count} seats for bus {$bus->code}.");
            });
    }
}
