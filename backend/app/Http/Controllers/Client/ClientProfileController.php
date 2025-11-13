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
            'gender' => $user->gender
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
    
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')->ignore($user->id),
            ],         
            'birthday' => ['nullable', 'date'],
            'email'    => [
                'nullable',
                'email:rfc',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'gender' => ['required']
        ]);
    
        // Gán các field cho phép
        $user->name     = $data['name'];
        $user->username = $data['username'];
        $user->birthday = $data['birthday'] ?? $user->birthday;
        $user->email    = $data['email'] ?? $user->email;
        $user->gender   = $data['gender'];
    
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
                'gender'   => $user->gender,
            ],
        ]);
    }
    
}