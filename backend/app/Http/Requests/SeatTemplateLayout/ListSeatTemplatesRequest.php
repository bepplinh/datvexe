<?php

namespace App\Http\Requests\SeatTemplateLayout;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListSeatTemplatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q'          => ['sometimes','string','max:100'],          // tìm theo code/name
            'per_page'   => ['sometimes','integer','between:1,100'],
            'page'       => ['sometimes','integer','min:1'],
            'sort'       => ['sometimes', Rule::in(['code','name','total_seats','decks','created_at'])],
            'direction'  => ['sometimes', Rule::in(['asc','desc'])],
            'with_layout'=> ['sometimes', Rule::in([true, false, 'true', 'false', '1', '0', 1, 0])],
        ];
    }
}
