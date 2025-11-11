<?php
namespace App\Http\Controllers\Client\Payment;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PayOSRedirectController extends Controller
{
    public function success(Request $req)
    {
        $orderCode = $req->query('orderCode'); // PayOS gắn vào query
        return redirect()->away(
            'http://localhost:5173/checkout/result?mode=success&orderCode=' . urlencode((string)$orderCode)
        );
    }

    public function cancel(Request $req)
    {
        $orderCode = $req->query('orderCode');
        return redirect()->away(
            'http://localhost:5173/checkout/result?mode=cancel&orderCode=' . urlencode((string)$orderCode)
        );
    }
}
