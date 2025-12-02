<?php

namespace App\Http\Requests\RouteOptimization;

use Illuminate\Foundation\Http\FormRequest;

class OptimizeTripRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'start_pickup_location' => 'nullable|string|max:500',
            'start_dropoff_location' => 'nullable|string|max:500',
            'optimize_type' => 'nullable|string|in:pickup,dropoff',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'start_pickup_location.string' => 'Điểm đón bắt đầu phải là chuỗi ký tự',
            'start_pickup_location.max' => 'Điểm đón bắt đầu không được vượt quá 500 ký tự',
            'start_dropoff_location.string' => 'Điểm trả bắt đầu phải là chuỗi ký tự',
            'start_dropoff_location.max' => 'Điểm trả bắt đầu không được vượt quá 500 ký tự',
            'optimize_type.in' => 'Loại tối ưu phải là pickup hoặc dropoff',
        ];
    }
}

