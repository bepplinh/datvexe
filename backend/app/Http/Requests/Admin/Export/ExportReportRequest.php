<?php

namespace App\Http\Requests\Admin\Export;

use Illuminate\Foundation\Http\FormRequest;

class ExportReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|string|in:revenue,bookings,payments,financial',
            'format' => 'required|string|in:excel,pdf',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'period' => 'nullable|string|in:day,week,month,quarter,year',
        ];
    }
}

