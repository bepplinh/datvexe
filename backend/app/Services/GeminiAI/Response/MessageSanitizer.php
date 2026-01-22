<?php

namespace App\Services\GeminiAI\Response;

/**
 * Làm sạch markdown output từ AI model
 */
class MessageSanitizer
{
    /**
     * Làm sạch markdown từ model (bỏ **bold**, *italic*, etc.)
     */
    public function sanitize(?string $text): string
    {
        if (!$text) return '';

        // Bỏ **bold** và *italic*
        $text = preg_replace('/\*\*(.*?)\*\*/s', '$1', $text);
        $text = preg_replace('/\*(.*?)\*/s', '$1', $text);

        // Bỏ gạch đầu dòng "- "
        $text = preg_replace('/^\s*-\s*/m', '', $text);

        // Thu gọn khoảng trắng
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{2,}/', "\n", $text);

        return trim($text);
    }
}
