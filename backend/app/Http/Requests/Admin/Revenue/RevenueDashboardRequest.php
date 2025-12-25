<?php

namespace App\Http\Requests\Admin\Revenue;

use Illuminate\Foundation\Http\FormRequest;

class RevenueDashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period' => 'nullable|string|in:day,week,month,quarter,year',
            'date' => 'nullable|date',
        ];
    }
}

