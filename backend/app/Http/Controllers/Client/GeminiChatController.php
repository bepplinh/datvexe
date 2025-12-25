<?php

namespace App\Http\Controllers\Client;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use App\Services\GeminiAI\GeminiAiService;

class GeminiChatController extends Controller
{
    public function __construct(
        private GeminiAiService $ai
    ) {}

    public function chat(Request $req)
    {
        $v = $req->validate([
            'message' => ['required', 'string', 'max:5000']
        ]);

        // Rate limit theo session/ip để tránh abuse (20 req / phút)
        $rateKey = $this->rateKey($req);
        if (RateLimiter::tooManyAttempts($rateKey, 20)) {
            return response()->json([
                'message' => 'Bạn thao tác quá nhanh, vui lòng thử lại sau giây lát.'
            ], 429);
        }
        RateLimiter::hit($rateKey, 60);

        $traceId = Str::uuid()->toString();
        Log::info('ai.chat.request', [
            'trace_id' => $traceId,
            'session' => $this->contextKey($req),
            'ip' => $req->ip(),
            'ua' => $req->userAgent(),
        ]);

        $result = $this->ai->chat(
            $v['message'],
            $this->contextKey($req),
            $traceId
        );

        Log::info('ai.chat.response', [
            'trace_id' => $traceId,
            'trips' => isset($result['trips']) ? count($result['trips']) : 0,
        ]);

        return response()->json($result);
    }

    private function contextKey(Request $req): string
    {
        $sessionId = null;
        if (method_exists($req, 'hasSession') && $req->hasSession()) {
            $sessionId = $req->session()->getId();
        }

        return 'ai_chat:' . ($req->user()?->id
            ?? $sessionId
            ?? sha1(($req->ip() ?? 'unknown') . '|' . ($req->userAgent() ?? '')));
    }

    private function rateKey(Request $req): string
    {
        return 'ai_chat_rate:' . ($req->user()?->id ?? $req->ip());
    }
}
