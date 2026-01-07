<?php

namespace App\Http\Requests\Admin\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ComparisonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => [
                'required',
                'string',
                Rule::in(['day', 'week', 'month', 'quarter', 'year']),
            ],
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ];
    }
}

