<?php

namespace App\Http\Requests\Admin\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TopMetricsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => [
                'nullable',
                'string',
                Rule::in(['day', 'week', 'month', 'quarter', 'year']),
            ],
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'limit' => 'nullable|integer|min:1|max:100',
        ];
    }
}

