<?php

namespace App\Http\Controllers\Client;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;

class ClientProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id'       => $user->id,
            'username' => $user->username,
            'name'     => $user->name,
            'email'    => $user->email,
            'phone'    => $user->phone,
            'birthday' => $user->birthday,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255','unique:users'],
            'birthday' => ['nullable', 'date'],
            'email'    => [
                'nullable',
                'email:rfc',
                // unique nhưng bỏ qua chính user hiện tại
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        if (array_key_exists('usernamename', $data)) {
            $user->name = $data['username'];
        }

          // Gán dữ liệu (chỉ update field cho phép)
          if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('birthday', $data)) {
            $user->birthday = $data['birthday'];
        }

        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin cá nhân thành công.',
            'data'    => [
                'username' => $user->username,
                'name'     => $user->name,
                'email'    => $user->email,
                'phone'    => $user->phone,
                'birthday' => $user->birthday,
            ],
        ]);
    }
}