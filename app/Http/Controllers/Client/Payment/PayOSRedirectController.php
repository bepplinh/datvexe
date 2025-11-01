<?php

namespace App\Http\Controllers\Client\Payment;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Redirect;

class PayOSRedirectController extends Controller
{
    public function success(Request $request)
    {
        $orderCode = $request->query('orderCode');
        $frontend = config('app.frontend_url', 'http://localhost:5173');

        Log::info('PayOS redirect SUCCESS', [
            'orderCode' => $orderCode,
            'all' => $request->all(),
        ]);

        // Redirect đến FE checkout page, kèm query
        $url = "{$frontend}/checkout?pay_status=success";
        if ($orderCode) {
            $url .= "&orderCode={$orderCode}";
        }

        return Redirect::away($url);
    }

    public function cancel(Request $request)
    {
        $orderCode = $request->query('orderCode');
        $frontend = config('app.frontend_url', 'http://localhost:5173');

        Log::info('PayOS redirect CANCEL', [
            'orderCode' => $orderCode,
            'all' => $request->all(),
        ]);

        $url = "{$frontend}/checkout?pay_status=cancel";
        if ($orderCode) {
            $url .= "&orderCode={$orderCode}";
        }

        return Redirect::away($url);
    }
}
