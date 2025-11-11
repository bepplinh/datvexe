<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class CompleteRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Cho phép mọi người gọi (vì đây là bước sau OTP, chưa cần auth)
        return true;
    }

    public function rules(): array
    {
        return [
            'register_token' => ['required', 'string'],
            'username'       => ['required', 'string', 'min:4', 'max:32', 'alpha_dash', 'unique:users,username'],
            'password'       => ['required', 'string', 'min:6'],
            'name'           => ['nullable', 'string', 'max:255'],
            'birthday'       => ['nullable', 'date'],
            'email'          => ['nullable', 'email:rfc', 'unique:users,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'register_token.required' => 'Thiếu mã đăng ký.',
            'username.required'       => 'Vui lòng nhập tên đăng nhập.',
            'username.alpha_dash'     => 'Tên đăng nhập chỉ được chứa chữ, số, gạch ngang và gạch dưới.',
            'username.unique'         => 'Tên đăng nhập đã được sử dụng.',
            'password.required'       => 'Vui lòng nhập mật khẩu.',
            'password.min'            => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'email.email'             => 'Email không hợp lệ.',
            'email.unique'            => 'Email đã tồn tại.',
        ];
    }
}
