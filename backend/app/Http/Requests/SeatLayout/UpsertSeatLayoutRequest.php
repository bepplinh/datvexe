<?php

namespace App\Http\Requests\SeatLayout;

use Illuminate\Foundation\Http\FormRequest;

class UpsertSeatLayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'layout' => ['required', 'array'],
            'layout.decks' => ['required', 'integer', 'min:1', 'max:4'],
            'layout.cell_size' => ['nullable', 'integer', 'min:24', 'max:120'],
            'layout.canvas' => ['required', 'array'],
            'layout.canvas.width' => ['required', 'integer', 'min:200', 'max:2000'],
            'layout.canvas.height' => ['required', 'integer', 'min:200', 'max:2000'],
            'layout.legend' => ['nullable', 'array'],

            'seats' => ['required', 'array', 'min:1'],
            'seats.*.seat_id' => ['nullable', 'integer', 'exists:seats,id'],
            'seats.*.label' => ['required', 'string', 'max:20', 'regex:/^[A-Z0-9\-]+$/i', 'distinct:strict'],
            'seats.*.deck' => ['required', 'integer', 'min:1', 'max:4'],
            'seats.*.column_group' => ['nullable', 'string', 'max:32'],
            'seats.*.index' => ['required', 'integer', 'min:0', 'max:300'],
            'seats.*.seat_type' => ['nullable', 'string', 'max:40'],
            'seats.*.active' => ['sometimes', 'boolean'],
            'seats.*.position' => ['required', 'array'],
            'seats.*.position.x' => ['required', 'integer', 'min:0', 'max:2000'],
            'seats.*.position.y' => ['required', 'integer', 'min:0', 'max:2000'],
            'seats.*.position.w' => ['nullable', 'integer', 'min:24', 'max:300'],
            'seats.*.position.h' => ['nullable', 'integer', 'min:24', 'max:300'],
            'seats.*.meta' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'seats.*.label.distinct' => 'Mỗi ghế cần có nhãn duy nhất.',
        ];
    }
}

