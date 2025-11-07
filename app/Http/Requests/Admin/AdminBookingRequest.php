<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class AdminBookingRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()?->can('manage-bookings') ?? true;
    }

    public function rules()
    {
        return [
            'customer_phone' => ['required', 'string', 'max:20'],
            'customer_name'  => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],

            'note'           => ['nullable', 'string', 'max:1000'],

            'from_location_id' => ['required', 'integer', 'exists:locations,id'],
            'to_location_id'   => [
                'required',
                'integer',
                'different:from_location_id',
                'exists:locations,id',
            ],

            'from_location' => ['required', 'string'],
            'to_location'   => ['required', 'string', 'different:from_location'],

            'trips' => ['required', 'array', 'min:1'],
            'trips.*.trip_id'  => ['required', 'integer', 'exists:trips,id'],
            'trips.*.seat_ids' => ['required', 'array', 'min:1'],
            'trips.*.seat_ids.*' => ['required', 'integer', 'min:1'],

            'trips.*.leg' => ['nullable', 'string', Rule::in(['OUT', 'RETURN'])],
        ];
    }
}
