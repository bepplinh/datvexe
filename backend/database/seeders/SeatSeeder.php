<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Seat;

class SeatSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 12; $i++) {
            $deck = $i <= 6 ? 1 : 2;
            $indexInColumn = $i <= 6 ? $i : $i - 6;

            Seat::create([
                'bus_id' => 1,
                'seat_number' => 'A' . $i,
                'deck' => $deck,
                'column_group' => 'left',
                'index_in_column' => $indexInColumn,
            ]);

            Seat::create([
                'bus_id' => 1,
                'seat_number' => 'B' . $i,
                'deck' => $deck,
                'column_group' => 'right',
                'index_in_column' => $indexInColumn,
            ]);
        }
    }
}
