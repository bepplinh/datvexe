<?php

namespace App\Services\GeminiAI;

use Illuminate\Support\Facades\Log;
use App\Services\GeminiAI\GeminiClient;
use App\Services\TripSearchService;
use App\Services\GeminiAI\LocationResolverService;
use App\Services\GeminiAI\ChatContext\ConversationContextManager;
use App\Services\GeminiAI\Prompt\GeminiToolsBuilder;
use App\Services\GeminiAI\Prompt\SystemPromptBuilder;
use App\Services\GeminiAI\Parser\UserMessageParser;
use App\Services\GeminiAI\Parser\FilterBuilder;
use App\Services\GeminiAI\Response\ResponseGenerator;
use App\Services\GeminiAI\Response\MessageSanitizer;

/**
 * GeminiAiService - Orchestrator cho AI chat
 * 
 * - Nhận message tự nhiên của người dùng
 * - Gọi Gemini (function calling) để trích tham số
 * - Gọi TripSearchService và trả message + trips
 */
class GeminiAiService
{
    public function __construct(
        private GeminiClient $gemini,
        private TripSearchService $tripSearch,
        private LocationResolverService $resolver,
        private ConversationContextManager $contextManager,
        private GeminiToolsBuilder $toolsBuilder,
        private SystemPromptBuilder $promptBuilder,
        private UserMessageParser $messageParser,
        private FilterBuilder $filterBuilder,
        private ResponseGenerator $responseGenerator,
        private MessageSanitizer $sanitizer,
    ) {}

    /**
     * Xử lý 1 lượt chat.
     * @return array{message:string, trips?:array<int, array>}
     */
    public function chat(string $userMessage, ?string $contextKey = null, ?string $traceId = null): array
    {
        $context = $this->contextManager->load($contextKey);
        $tools = $this->toolsBuilder->build();
        $system = $this->promptBuilder->build();

        // Turn 1: Hỏi model có muốn gọi function không
        $payload1 = [
            'contents' => [
                $system,
                ['role' => 'user', 'parts' => [['text' => $userMessage]]],
            ],
            'tools' => $tools,
        ];

        try {
            $first = $this->gemini->firstTurn($payload1);
        } catch (\Throwable $e) {
            Log::error('Gemini AI service error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_message' => $userMessage,
            ]);
            return ['message' => 'Xin lỗi, hệ thống AI đang bận. Bạn thử lại sau nhé.'];
        }

        $call = GeminiClient::extractFunctionCall($first);

        // Handle follow-up từ context
        if (!$call) {
            $followUp = $this->contextManager->handleTripSelection($context, $userMessage);
            if ($followUp) {
                return $followUp;
            }
        }

        // Model yêu cầu gọi function: search_trips
        if ($call && ($call['name'] ?? null) === 'search_trips') {
            return $this->handleSearchTrips($call, $context, $userMessage, $contextKey, $traceId, $system);
        }

        // Không gọi function: câu hỏi làm rõ
        $text = GeminiClient::extractText($first);
        if (empty($text)) {
            $text = $this->responseGenerator->handleGeneralQuestion($userMessage);
        }

        return ['message' => $this->sanitizer->sanitize($text)];
    }

    /**
     * Handle search_trips function call
     */
    private function handleSearchTrips(
        array $call, 
        array $context, 
        string $userMessage, 
        ?string $contextKey, 
        ?string $traceId,
        array $system
    ): array {
        $args = $call['args'] ?? [];

        // 1) Parse locations
        $locations = $this->messageParser->parseLocations($args, $context, $userMessage);
        if ($locations['error']) {
            return ['message' => $locations['error']];
        }

        // 2) Parse date
        $dateYmd = $this->messageParser->parseDate($args, $context, $userMessage);
        if (!$dateYmd) {
            return ['message' => 'Bạn muốn đi ngày nào?'];
        }

        // 3) Parse time window & build filters
        $timeWindow = $this->messageParser->parseTimeWindow($args, $userMessage);
        $filters = $this->filterBuilder->build($args, $context, $userMessage, $timeWindow);
        
        // 4) Apply passengers
        $passengers = $this->messageParser->parsePassengers($args, $userMessage);
        $filters = $this->filterBuilder->applyPassengers($filters, $passengers);

        // 5) Search trips
        try {
            $trips = $this->tripSearch->searchOneWay(
                $locations['fromId'], 
                $locations['toId'], 
                $dateYmd, 
                $filters
            );
        } catch (\Throwable $e) {
            Log::error('Trip search error', [
                'message' => $e->getMessage(),
                'from' => $locations['fromId'],
                'to' => $locations['toId'],
                'date' => $dateYmd,
                'filters' => $filters,
            ]);
            return ['message' => 'Xin lỗi, hệ thống đang gặp sự cố. Bạn vui lòng thử lại sau nhé.'];
        }

        // 6) Store context
        $this->contextManager->store($contextKey, $this->contextManager->buildContextData(
            $locations['fromId'],
            $locations['toId'],
            $locations['fromText'],
            $locations['toText'],
            $dateYmd,
            $filters,
            $trips,
            $userMessage,
            $traceId
        ));

        // 7) Turn 2: Gửi function response cho Gemini
        $summary = $this->responseGenerator->buildTripSummary($trips);
        $text = $this->getAiResponseForTrips($call, $trips, $summary, $userMessage, $system);

        return ['message' => $this->sanitizer->sanitize($text), 'trips' => $trips];
    }

    /**
     * Get AI response cho trips result
     */
    private function getAiResponseForTrips(
        array $call, 
        array $trips, 
        array $summary, 
        string $userMessage,
        array $system
    ): string {
        $payload2 = [
            'contents' => [
                $system,
                ['role' => 'user', 'parts' => [['text' => $userMessage]]],
                ['role' => 'model', 'parts' => [['functionCall' => $call]]],
                ['role' => 'function', 'parts' => [[
                    'functionResponse' => [
                        'name' => 'search_trips',
                        'response' => [
                            'trips' => $trips,
                            'summary' => $summary,
                            'count' => count($trips),
                        ],
                    ]
                ]]]
            ]
        ];

        try {
            $second = $this->gemini->secondTurn($payload2);
            $text = GeminiClient::extractText($second);

            if (empty($text)) {
                $text = $this->responseGenerator->generateSmartResponse($trips, $summary, $userMessage);
            }
        } catch (\Throwable $e) {
            Log::error('Gemini second turn error', [
                'message' => $e->getMessage(),
                'user_message' => $userMessage,
            ]);
            $text = $this->responseGenerator->generateSmartResponse($trips, $summary, $userMessage);
        }

        return $text;
    }
}
