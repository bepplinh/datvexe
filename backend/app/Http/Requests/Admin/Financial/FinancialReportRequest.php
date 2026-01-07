<?php

namespace App\Http\Requests\Admin\Financial;

use Illuminate\Foundation\Http\FormRequest;

class FinancialReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'period' => 'nullable|string|in:day,week,month,quarter,year',
            'limit' => 'nullable|integer|min:1|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'from_date.date' => 'Ngày bắt đầu không hợp lệ.',
            'to_date.date' => 'Ngày kết thúc không hợp lệ.',
            'to_date.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'period.in' => 'Đơn vị thời gian không hợp lệ. Chỉ chấp nhận: day, week, month, quarter, year.',
        ];
    }
}
