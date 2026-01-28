<?php

namespace App\Services\Admin\Revenue;

use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Service phân tích xu hướng doanh thu theo thời gian
 */
class TrendAnalyzer
{
    public function __construct(
        private RevenueCalculator $calculator
    ) {}

    /**
     * Lấy dữ liệu xu hướng doanh thu theo thời gian
     */
    public function getTrendData(Carbon $fromDate, Carbon $toDate, string $period): Collection
    {
        $data = collect();
        $current = $fromDate->copy();

        while ($current <= $toDate) {
            $range = $this->calculator->getPeriodRange($current, $period);
            $revenue = $this->calculator->calculateRevenue($range['start'], $range['end']);
            $bookingCount = $this->calculator->getBookingCount($range['start'], $range['end']);

            $label = $this->getPeriodLabel($current, $period);

            $data->push([
                'label' => $label,
                'date' => $range['start']->format('Y-m-d'),
                'revenue' => $revenue,
                'booking_count' => $bookingCount,
            ]);

            // Tăng current theo period
            $current = $this->incrementDateByPeriod($current, $period);
        }

        return $data;
    }

    /**
     * Lấy label cho period
     */
    private function getPeriodLabel(Carbon $date, string $period): string
    {
        return match ($period) {
            'day' => $date->format('Y-m-d'),
            'week' => 'Tuần ' . $date->format('W/Y'),
            'month' => $date->format('Y-m'),
            'quarter' => 'Q' . $date->quarter . '/' . $date->year,
            'year' => $date->format('Y'),
            default => $date->format('Y-m-d'),
        };
    }

    /**
     * Tăng date theo period
     */
    private function incrementDateByPeriod(Carbon $date, string $period): Carbon
    {
        return match ($period) {
            'day' => $date->addDay(),
            'week' => $date->addWeek(),
            'month' => $date->addMonth(),
            'quarter' => $date->addQuarter(),
            'year' => $date->addYear(),
            default => $date->addDay(),
        };
    }
}
