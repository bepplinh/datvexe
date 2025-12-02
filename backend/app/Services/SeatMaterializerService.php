<?php

namespace App\Services;

use App\Models\Bus;
use App\Models\Seat;
use Illuminate\Support\Facades\DB;

class SeatMaterializerService
{
    public function materialize(Bus $bus, bool $overwrite = true)
    {
        $tpl = $bus->seatLayoutTemplate;
        if (!$tpl) return 0;

        $rows = DB::table('template_seats')
            ->where('seat_layout_template_id', $tpl->id)
            ->orderBy('deck')
            ->orderByRaw("FIELD(column_group,'right','middle','left')")
            ->orderBy('index_in_column')
            ->get();

        return DB::transaction(function () use ($bus, $rows, $overwrite) {
            if ($overwrite) {
                Seat::where('bus_id', $bus->id)->delete();
            }

            $count = 0;
            foreach ($rows as $r) {
                $seatNumber = $this->makeSeatNumber($r->seat_label, (int) $r->deck);

                Seat::create([
                    'bus_id'          => $bus->id,
                    'seat_number'     => $seatNumber,
                    'deck'            => (int)$r->deck,
                    'column_group'    => $r->column_group,
                    'index_in_column' => (int)$r->index_in_column,
                    'active'          => true,
                ]);
                $count++;
            }

            $bus->uses_custom_seats = true;
            $bus->save();

            return $count;
        });
    }

    /**
     * Ensure seat numbers are unique across decks by appending the deck index
     * for upper floors. Tầng 1 giữ nguyên nhãn gốc để tránh thay đổi UI cũ.
     */
    protected function makeSeatNumber(string $baseLabel, int $deck): string
    {
        return $deck <= 1 ? $baseLabel : "{$baseLabel}-{$deck}";
    }
}