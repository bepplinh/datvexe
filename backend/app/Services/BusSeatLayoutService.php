<?php

namespace App\Services;

use App\Models\Bus;
use App\Models\Seat;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BusSeatLayoutService
{
    public function __construct() {}

    public function format(Bus $bus): array
    {
        $bus->loadMissing(['seats' => fn($q) => $q->orderBy('deck')->orderBy('seat_number')]);

        $seats = $bus->seats;
        $layout = $this->layoutFromSeats($seats, $bus);

        return [
            'bus' => [
                'id' => $bus->id,
                'code' => $bus->code,
                'name' => $bus->name,
                'plate_number' => $bus->plate_number,
                'type_bus_id' => $bus->type_bus_id,
            ],
            'layout' => $layout,
            'seats' => $seats->map(fn(Seat $seat) => $this->formatSeat($seat))->values(),
        ];
    }

    public function sync(Bus $bus, array $layout, array $seats): array
    {
        return DB::transaction(function () use ($bus, $layout, $seats) {
            $existing = $bus->seats()->get()->keyBy('id');
            $touchedIds = [];

            foreach ($seats as $seatInput) {
                $payload = $this->mapSeatAttributes($seatInput);
                $seatId = (int) ($seatInput['seat_id'] ?? 0);

                if ($seatId > 0 && $existing->has($seatId)) {
                    $seat = $existing[$seatId];
                    $seat->fill($payload);
                    $seat->active = (bool) ($seatInput['active'] ?? true);
                    $seat->save();
                } else {
                    $seat = $bus->seats()->create($payload + [
                        'active' => (bool) ($seatInput['active'] ?? true),
                    ]);
                }

                $touchedIds[] = $seat->id;
            }

            if ($existing->count()) {
                $bus->seats()
                    ->whereNotIn('id', $touchedIds)
                    ->update([
                        'active' => false,
                        'layout_x' => null,
                        'layout_y' => null,
                        'layout_w' => 40,
                        'layout_h' => 40,
                        'layout_meta' => null,
                    ]);
            }

            $this->updateBusCanvasConfig($bus, $layout);
            $bus->save();

            return $this->format($bus->fresh('seats'));
        });
    }

    protected function formatSeat(Seat $seat): array
    {
        return [
            'seat_id' => $seat->id,
            'label' => $seat->seat_number,
            'deck' => $seat->deck,
            'column_group' => $seat->column_group,
            'index' => $seat->index_in_column,
            'seat_type' => $seat->seat_type,
            'active' => (bool) $seat->active,
            'position' => [
                'x' => $seat->layout_x ?? 0,
                'y' => $seat->layout_y ?? 0,
                'w' => $seat->layout_w ?? 40,
                'h' => $seat->layout_h ?? 40,
            ],
            'meta' => $seat->layout_meta ?? [],
        ];
    }

    protected function mapSeatAttributes(array $seat): array
    {
        $position = Arr::get($seat, 'position', []);

        return [
            'seat_number' => (string) ($seat['label'] ?? ''),
            'deck' => (int) ($seat['deck'] ?? 1),
            'column_group' => $seat['column_group'] ?? null,
            'index_in_column' => (int) ($seat['index'] ?? 0),
            'layout_x' => (int) ($position['x'] ?? 0),
            'layout_y' => (int) ($position['y'] ?? 0),
            'layout_w' => (int) ($position['w'] ?? 40),
            'layout_h' => (int) ($position['h'] ?? 40),
            'seat_type' => $seat['seat_type'] ?? null,
            'layout_meta' => $seat['meta'] ?? null,
        ];
    }

    protected function defaultLayout(Bus $bus): array
    {
        $width = $this->sanitizeCanvasDimension($bus->layout_canvas_width, 720);
        $height = $this->sanitizeCanvasDimension($bus->layout_canvas_height, 480);

        return [
            'decks' => 1,
            'cell_size' => 40,
            'canvas' => [
                'width' => $width,
                'height' => $height,
            ],
            'legend' => [
                ['label' => 'Ghế trống', 'color' => '#E0E7FF'],
                ['label' => 'Đang giữ', 'color' => '#FDE68A'],
                ['label' => 'Đã bán', 'color' => '#FCA5A5'],
            ],
        ];
    }

    public function layoutFromSeats(Collection $seats, ?Bus $bus = null): array
    {
        if ($seats->isEmpty()) {
            return $bus ? $this->defaultLayout($bus) : $this->defaultLayout(new Bus());
        }

        return $this->buildLayoutFromCollection($seats, $bus);
    }

    protected function buildLayoutFromCollection(Collection $seats, ?Bus $bus = null): array
    {
        $maxDeck = (int) ($seats->max('deck') ?? 1);
        $maxDeck = max(1, $maxDeck);

        $maxRight = (int) $seats->max(function (Seat $s) {
            return (int) ($s->layout_x ?? 0) + (int) ($s->layout_w ?? 40);
        });
        $maxBottom = (int) $seats->max(function (Seat $s) {
            return (int) ($s->layout_y ?? 0) + (int) ($s->layout_h ?? 40);
        });

        $canvasWidth = max(720, $maxRight + 24);
        $canvasHeight = max(480, $maxBottom + 24);

        if ($bus) {
            $canvasWidth = $this->sanitizeCanvasDimension(
                $bus->layout_canvas_width,
                $canvasWidth
            );
            $canvasHeight = $this->sanitizeCanvasDimension(
                $bus->layout_canvas_height,
                $canvasHeight
            );
        }

        return [
            'decks' => $maxDeck,
            'cell_size' => 40,
            'canvas' => [
                'width' => $canvasWidth,
                'height' => $canvasHeight,
            ],
            'legend' => [
                ['label' => 'Ghế trống', 'color' => '#E0E7FF'],
                ['label' => 'Đang giữ', 'color' => '#FDE68A'],
                ['label' => 'Đã bán', 'color' => '#FCA5A5'],
            ],
        ];
    }

    protected function sanitizeCanvasDimension(?int $value, int $fallback): int
    {
        if ($value === null) {
            return $fallback;
        }
        return max(200, min(2000, $value));
    }

    protected function updateBusCanvasConfig(Bus $bus, array $layout): void
    {
        $width = (int) Arr::get($layout, 'canvas.width', 0);
        $height = (int) Arr::get($layout, 'canvas.height', 0);

        if ($width > 0) {
            $bus->layout_canvas_width = $this->sanitizeCanvasDimension($width, 720);
        }

        if ($height > 0) {
            $bus->layout_canvas_height = $this->sanitizeCanvasDimension($height, 480);
        }
    }

    public function deleteSeat(Bus $bus, Seat $seat): bool
    {
        // Kiểm tra ghế thuộc về bus này
        if ($seat->bus_id !== $bus->id) {
            throw new \InvalidArgumentException('Ghế không thuộc về xe này');
        }

        // Kiểm tra xem ghế có đang được sử dụng trong booking hoặc trip không
        $hasBookings = $seat->bookingItems()->exists();
        $hasTripStatuses = $seat->tripStatuses()->exists();

        if ($hasBookings || $hasTripStatuses) {
            throw new \RuntimeException('Không thể xóa ghế đã có lịch sử đặt vé hoặc trạng thái chuyến');
        }

        return DB::transaction(function () use ($seat) {
            return $seat->delete();
        });
    }
}
