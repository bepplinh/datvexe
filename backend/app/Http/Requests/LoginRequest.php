<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            // identifier phải là chuỗi, bắt buộc, và giới hạn độ dài hợp lý
            'identifier'  => ['required', 'string', 'min:3', 'max:255'], 
            
            // password phải là chuỗi, bắt buộc, và giới hạn độ dài tối thiểu
            'password'    => ['required', 'string', 'min:6'], 
            
            // remember_me là tùy chọn, nếu có phải là boolean
            'remember_me' => ['sometimes', 'boolean'],
        ];
    }
    
    /**
     * Get the validation messages for the defined validation rules.
     */
    public function messages(): array
    {
        return [
            // Identifier
            'identifier.required' => 'Vui lòng nhập tên đăng nhập hoặc số điện thoại.',
            'identifier.string'   => 'Dữ liệu tài khoản không hợp lệ.',
            'identifier.min'      => 'Tên đăng nhập hoặc số điện thoại phải có ít nhất :min ký tự.',
            'identifier.max'      => 'Tên đăng nhập hoặc số điện thoại không được vượt quá :max ký tự.',

            // Password
            'password.required'   => 'Vui lòng nhập mật khẩu.',
            'password.string'     => 'Mật khẩu không hợp lệ.',
            'password.min'        => 'Mật khẩu phải có ít nhất :min ký tự.',
            
            // Remember Me
            'remember_me.boolean' => 'Giá trị "nhớ mật khẩu" không hợp lệ.',
        ];
    }
}