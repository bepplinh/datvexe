<?php

namespace App\Http\Requests\Admin\Revenue;

use Illuminate\Foundation\Http\FormRequest;

class RevenueTrendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => 'nullable|string|in:day,week,month,quarter,year',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ];
    }
}

