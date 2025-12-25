<?php

namespace App\Http\Requests\Admin\Statistics;

use Illuminate\Foundation\Http\FormRequest;

class CustomerAnalysisRequest extends FormRequest
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
            'limit' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:booking_count,revenue',
        ];
    }
}

