<?php

namespace App\Http\Requests\Admin\Statistics;

use Illuminate\Foundation\Http\FormRequest;

class BookingStatisticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'status' => 'nullable|string|in:paid,pending,cancelled,all',
        ];
    }
}

