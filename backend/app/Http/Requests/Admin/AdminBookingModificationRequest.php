<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminBookingModificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $action = $this->route()->getActionMethod();

        return match ($action) {
            'changeSeat' => [
                'booking_item_id' => 'required|integer|exists:booking_items,id',
                'new_seat_id' => 'required|integer|exists:seats,id',
            ],
            'changeTrip' => [
                'booking_item_id' => 'required|integer|exists:booking_items,id',
                'new_trip_id' => 'required|integer|exists:trips,id',
                'new_seat_id' => 'nullable|integer|exists:seats,id',
                'pickup_location_id' => 'nullable|integer|exists:locations,id',
                'dropoff_location_id' => 'nullable|integer|exists:locations,id',
                'pickup_address' => 'nullable|string|max:500',
                'dropoff_address' => 'nullable|string|max:500',
            ],
            default => [],
        };
    }

    public function messages(): array
    {
        return [
            'booking_item_id.required' => 'Vui lòng chọn booking item cần thay đổi',
            'booking_item_id.exists' => 'Booking item không tồn tại',
            'new_seat_id.required' => 'Vui lòng chọn ghế mới',
            'new_seat_id.exists' => 'Ghế không tồn tại',
            'new_trip_id.required' => 'Vui lòng chọn chuyến mới',
            'new_trip_id.exists' => 'Chuyến không tồn tại',
        ];
    }
}

