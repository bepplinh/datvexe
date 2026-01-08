<?php

namespace App\Services\GeminiAI;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class GeminiClient
{
    public function __construct(
        private ?string $apiKey = null,
        private ?string $model  = null,
        private ?string $base   = null,
        private ?string $version = null,
        private int $timeout = 20,
    ) {
        $cfg = config('services.gemini');
        $this->apiKey  = $this->apiKey  ?? $cfg['key'];
        $this->model   = $this->model   ?? $cfg['model'];
        $this->base    = $this->base    ?? rtrim($cfg['base'], '/');
        $this->version = $this->version ?? $cfg['version'];
        $this->timeout = $cfg['timeout'] ?? $this->timeout;

        // Validate API key
        if (empty($this->apiKey)) {
            Log::error('Gemini API key is missing or empty', [
                'config_key' => $cfg['key'] ?? 'not set',
                'env_key' => env('GEMINI_APP_KEY') ? 'set' : 'not set'
            ]);
            throw new \RuntimeException('Gemini API key is not configured. Please set GEMINI_APP_KEY in .env file.');
        }
    }

    private function endpoint(string $path): string
    {
        return "{$this->base}/{$this->version}/{$path}";
    }

    /**
     * Gọi generateContent lần 1 (user message + tools + system instruction).
     * Tự động dùng v1beta nếu có tools hoặc responseMimeType vì v1 không hỗ trợ.
     */
    public function firstTurn(array $payload): array
    {
        // Kiểm tra xem có cần dùng v1beta không
        $useVersion = $this->version;
        $needsV1Beta = false;
        $reason = '';

        // Xử lý payload cho v1: loại bỏ responseMimeType nếu không có tools
        $cleanPayload = $payload;

        if ($this->version === 'v1') {
            // Nếu có tools, chuyển sang v1beta (bắt buộc)
            if (isset($payload['tools'])) {
                $needsV1Beta = true;
                $reason = 'tools (function calling) not supported in v1';
            }
            // Nếu có responseMimeType nhưng KHÔNG có tools, loại bỏ nó và dùng v1
            // (vì prompt đã yêu cầu JSON rồi, không cần responseMimeType)
            else {
                $cleanPayload = $this->removeResponseMimeType($payload);
            }
        }

        if ($needsV1Beta) {
            $useVersion = 'v1beta';
            Log::info('Using v1beta for Gemini API', [
                'model' => $this->model,
                'reason' => $reason
            ]);
        }

        $url = "{$this->base}/{$useVersion}/models/{$this->model}:generateContent";
        $resp = Http::withOptions(['timeout' => $this->timeout])
            ->timeout($this->timeout)
            ->acceptJson()
            ->withQueryParameters(['key' => $this->apiKey])
            ->post($url, $cleanPayload);

        if (!$resp->ok()) {
            $errorBody = $resp->json();
            Log::error('Gemini API request failed', [
                'status' => $resp->status(),
                'error' => $errorBody,
                'url' => $url,
                'version_used' => $useVersion,
                'api_key_preview' => substr($this->apiKey, 0, 10) . '...'
            ]);
            throw new RequestException($resp);
        }
        return $resp->json();
    }

    /**
     * Loại bỏ responseMimeType khỏi payload (vì v1 không hỗ trợ)
     */
    private function removeResponseMimeType(array $payload): array
    {
        $cleaned = $payload;

        // Loại bỏ responseMimeType trong generationConfig
        if (isset($cleaned['generationConfig']['responseMimeType'])) {
            unset($cleaned['generationConfig']['responseMimeType']);
            // Nếu generationConfig chỉ còn temperature, giữ lại
            if (empty($cleaned['generationConfig']) || count($cleaned['generationConfig']) === 0) {
                unset($cleaned['generationConfig']);
            }
        }

        // Cũng kiểm tra generation_config (snake_case)
        if (isset($cleaned['generation_config']['responseMimeType'])) {
            unset($cleaned['generation_config']['responseMimeType']);
            if (empty($cleaned['generation_config'])) {
                unset($cleaned['generation_config']);
            }
        }

        if (isset($cleaned['generation_config']['response_mime_type'])) {
            unset($cleaned['generation_config']['response_mime_type']);
            if (empty($cleaned['generation_config'])) {
                unset($cleaned['generation_config']);
            }
        }

        return $cleaned;
    }

    /**
     * Gọi generateContent lần 2 (đưa functionResponse để model "kể chuyện").
     * Tự động dùng v1beta nếu có functionResponse vì v1 không hỗ trợ.
     */
    public function secondTurn(array $functionResponsePayload): array
    {
        // Kiểm tra xem có functionResponse trong payload không
        $hasFunctionResponse = false;
        if (isset($functionResponsePayload['contents'])) {
            foreach ($functionResponsePayload['contents'] as $content) {
                if (isset($content['parts'])) {
                    foreach ($content['parts'] as $part) {
                        if (isset($part['functionResponse'])) {
                            $hasFunctionResponse = true;
                            break 2;
                        }
                    }
                }
            }
        }

        // Nếu có functionResponse và đang dùng v1, tự động chuyển sang v1beta
        $useVersion = $this->version;
        if ($hasFunctionResponse && $this->version === 'v1') {
            $useVersion = 'v1beta';
        }

        $url = "{$this->base}/{$useVersion}/models/{$this->model}:generateContent";
        $resp = Http::withOptions(['timeout' => $this->timeout])
            ->timeout($this->timeout)
            ->acceptJson()
            ->withQueryParameters(['key' => $this->apiKey])
            ->post($url, $functionResponsePayload);

        if (!$resp->ok()) {
            $errorBody = $resp->json();
            Log::error('Gemini API second turn failed', [
                'status' => $resp->status(),
                'error' => $errorBody,
                'url' => $url,
                'version_used' => $useVersion,
            ]);
            throw new RequestException($resp);
        }
        return $resp->json();
    }

    /**
     * Lấy text đầu ra từ candidates (nếu có).
     */
    public static function extractText(array $resp): ?string
    {
        return $resp['candidates'][0]['content']['parts'][0]['text'] ?? null;
    }

    /**
     * Lấy functionCall (nếu model yêu cầu gọi tool).
     */
    public static function extractFunctionCall(array $resp): ?array
    {
        // Có thể xuất hiện trong một trong các parts, ta tìm phần đầu tiên có functionCall
        $parts = $resp['candidates'][0]['content']['parts'] ?? [];
        foreach ($parts as $p) {
            if (isset($p['functionCall'])) return $p['functionCall'];
        }
        return null;
    }
}
