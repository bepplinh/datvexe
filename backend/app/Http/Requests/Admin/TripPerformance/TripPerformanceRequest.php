<?php

namespace App\Http\Requests\Admin\TripPerformance;

use Illuminate\Foundation\Http\FormRequest;

class TripPerformanceRequest extends FormRequest
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
            'route_id' => 'nullable|integer|exists:routes,id',
            'limit' => 'nullable|integer|min:1|max:100',
        ];
    }
}

