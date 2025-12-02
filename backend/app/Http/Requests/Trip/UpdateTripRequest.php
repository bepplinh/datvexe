<?php

namespace App\Http\Requests\Trip;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Lấy trip ID từ route parameter (có thể là model instance hoặc ID)
        $trip = $this->route('trip');
        $tripId = $trip instanceof \App\Models\Trip ? $trip->id : $trip;
        
        // Lấy bus_id hiện tại của trip nếu không được gửi trong request
        $currentBusId = null;
        if ($trip instanceof \App\Models\Trip) {
            $currentBusId = $trip->bus_id;
        } elseif ($tripId) {
            $tripModel = \App\Models\Trip::find($tripId);
            $currentBusId = $tripModel ? $tripModel->bus_id : null;
        }

        $rules = [
            'route_id' => ['required', 'integer', 'exists:routes,id'],
            'bus_id' => ['nullable', 'integer', 'exists:buses,id'],
            'departure_time' => ['required', 'date_format:Y-m-d H:i:s'],
            'status' => ['nullable', 'in:scheduled,running,finished,cancelled'],
        ];

        // Kiểm tra validation nếu có bus_id (từ request hoặc từ trip hiện tại)
        $busIdToCheck = $this->filled('bus_id') ? $this->input('bus_id') : $currentBusId;
        
        if ($busIdToCheck && $tripId) {
            $rules['departure_time'][] = function ($attribute, $value, $fail) use ($tripId, $busIdToCheck) {
                $departureDateTime = \Carbon\Carbon::parse($value);
                $departureDate = $departureDateTime->format('Y-m-d');
                $departureTime = $departureDateTime->format('H:i:s');
                
                // Kiểm tra xem có chuyến nào khác cùng bus, cùng ngày và cùng giờ không
                $existingTrip = \App\Models\Trip::where('bus_id', $busIdToCheck)
                    ->whereDate('departure_time', $departureDate)
                    ->whereTime('departure_time', $departureTime)
                    ->where('id', '!=', $tripId)
                    ->first();
                
                if ($existingTrip) {
                    $fail('Mỗi xe bus chỉ có thể có một chuyến trong cùng ngày và cùng giờ.');
                }
            };
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'route_id.required' => 'Chuyến xe là bắt buộc',
            'route_id.integer' => 'Chuyến xe không hợp lệ',
            'route_id.exists' => 'Chuyến xe không tồn tại',

            'bus_id.integer' => 'Xe bus không hợp lệ',
            'bus_id.exists' => 'Xe bus không tồn tại',

            'departure_time.required' => 'Thời gian khởi hành là bắt buộc',
            'departure_time.date_format' => 'Thời gian khởi hành phải theo định dạng YYYY-MM-DD HH:MM:SS',

            'status.in' => 'Trạng thái không hợp lệ (scheduled, running, finished, cancelled)'
        ];
    }
} 