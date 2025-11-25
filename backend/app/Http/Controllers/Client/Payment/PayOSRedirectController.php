<?php

namespace App\Http\Controllers\Client\Payment;

use Illuminate\Http\Request;
use App\Models\DraftCheckout;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class PayOSRedirectController extends Controller
{
    public function success(Request $req)
    {
        // PayOS có thể gửi orderCode trong query params
        // PayOS redirect về với format: ?code=00&id=xxx&cancel=false&status=PAID&orderCode=xxx
        $orderCode = $req->query('orderCode') ?? $req->query('id');

        Log::info('PayOS redirect success', [
            'all_params' => $req->all(),
            'orderCode' => $orderCode,
            'query_string' => $req->getQueryString(),
        ]);

        // Tìm draft theo orderCode (payment_intent_id)
        $draft = DraftCheckout::query()
            ->where('payment_provider', 'payos')
            ->where('payment_intent_id', (string)$orderCode)
            ->first();

        if (!$draft) {
            // Nếu không tìm thấy draft, redirect với thông báo lỗi
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect()->away(
                $frontendUrl . '/checkout?draft_id=0&payment_status=failed&message=' . urlencode('Không tìm thấy đơn hàng')
            );
        }

        // Kiểm tra trạng thái draft
        $paymentStatus = 'success';
        $message = 'Thanh toán thành công!';

        if ($draft->status === 'paid') {
            $paymentStatus = 'success';
            $message = 'Thanh toán thành công!';
        } elseif (in_array($draft->status, ['cancelled', 'expired', 'failed'])) {
            $paymentStatus = 'failed';
            $message = 'Thanh toán thất bại hoặc đã bị hủy.';
        } else {
            // Trường hợp đang xử lý (paying) - webhook có thể chưa xử lý xong
            // Vẫn redirect về success nhưng có thể cần polling
            $paymentStatus = 'processing';
            $message = 'Đang xử lý thanh toán...';
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        return redirect()->away(
            $frontendUrl . '/checkout?draft_id=' . $draft->id . '&payment_status=' . $paymentStatus . '&message=' . urlencode($message) . '&step=3'
        );
    }

    public function cancel(Request $req)
    {
        // PayOS có thể gửi orderCode hoặc id trong query params
        $orderCode = $req->query('orderCode') ?? $req->query('id');

        // Tìm draft theo orderCode
        $draft = DraftCheckout::query()
            ->where('payment_provider', 'payos')
            ->where('payment_intent_id', (string)$orderCode)
            ->first();

        $draftId = $draft ? $draft->id : 0;
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        return redirect()->away(
            $frontendUrl . '/checkout?draft_id=' . $draftId . '&payment_status=cancelled&message=' . urlencode('Bạn đã hủy thanh toán') . '&step=3'
        );
    }
}