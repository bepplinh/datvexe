<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $origin = $request->header('Origin');
        $allowedOrigins = [
            'http://localhost:5173',
            'https://vantaiducanh.io.vn',
            'http://vantaiducanh.io.vn',
        ];

        // Chuẩn hóa origin để so sánh
        $isAllowed = false;
        if ($origin) {
            foreach ($allowedOrigins as $allowed) {
                if (rtrim($origin, '/') === rtrim($allowed, '/')) {
                    $isAllowed = true;
                    break;
                }
            }
        }

        // Handle preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200);

            if ($isAllowed) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
            } else {
                // Để debug, nếu chưa chạy đúng thì tạm thời allow $origin nếu muốn fix nhanh
                // $response->headers->set('Access-Control-Allow-Origin', $origin);
            }

            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Session-Token, Accept, X-Socket-ID');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Max-Age', '86400');

            return $response;
        }

        $response = $next($request);

        if ($isAllowed) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Session-Token, Accept');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}
