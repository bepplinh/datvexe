<?php

namespace Database\Seeders;

use App\Models\Seat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class SeatLayoutBackfillSeeder extends Seeder
{
    /**
     * Gán giá trị layout_x, layout_y, layout_w, layout_h cho các ghế
     * dựa trên deck, column_group và index_in_column.
     */
    public function run(): void
    {
        if (
            !Schema::hasColumn('seats', 'layout_x') ||
            !Schema::hasColumn('seats', 'layout_y') ||
            !Schema::hasColumn('seats', 'layout_w') ||
            !Schema::hasColumn('seats', 'layout_h')
        ) {
            return;
        }

        $cellSize = 56;
        $gap = 16;
        $paddingX = 32;
        $paddingY = 32;

        // Map tạm cột theo (bus_id, deck, column_group)
        $resolveColumnIndex = function (array &$map, int $busId, int $deck, ?string $group) {
            $group = $group ?: 'A';
            if (!isset($map[$busId])) {
                $map[$busId] = [];
            }
            if (!isset($map[$busId][$deck])) {
                $map[$busId][$deck] = [];
            }
            if (!array_key_exists($group, $map[$busId][$deck])) {
                $map[$busId][$deck][$group] = count($map[$busId][$deck]);
            }

            return $map[$busId][$deck][$group];
        };

        $columnMap = [];

        Seat::query()
            ->orderBy('bus_id')
            ->orderBy('deck')
            ->orderBy('column_group')
            ->orderBy('index_in_column')
            ->chunkById(500, function ($seats) use (
                $cellSize,
                $gap,
                $paddingX,
                $paddingY,
                &$columnMap,
                $resolveColumnIndex
            ) {
                /** @var Seat $seat */
                foreach ($seats as $seat) {
                    // Chỉ backfill cho ghế chưa có vị trí
                    if ($seat->layout_x !== null && $seat->layout_y !== null) {
                        continue;
                    }

                    $busId = (int) $seat->bus_id;
                    $deck = (int) ($seat->deck ?? 1);
                    $group = $seat->column_group;

                    $colIndex = $resolveColumnIndex($columnMap, $busId, $deck, $group);
                    $rowIndex = (int) ($seat->index_in_column ?? 0);

                    $seat->layout_x = $paddingX + $colIndex * ($cellSize + $gap);
                    $seat->layout_y = $paddingY + $rowIndex * ($cellSize + $gap);

                    if ($seat->layout_w === null) {
                        $seat->layout_w = $cellSize;
                    }
                    if ($seat->layout_h === null) {
                        $seat->layout_h = $cellSize;
                    }

                    $seat->save();
                }
            });
    }
}


