<?php

namespace App\Http\Requests\Admin\Revenue;

use Illuminate\Foundation\Http\FormRequest;

class RevenueAnalysisRequest extends FormRequest
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
            'group_by' => 'nullable|string|in:route,bus_type,payment_method,source,hour',
        ];
    }
}

