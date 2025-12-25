<?php

namespace App\Services\GeminiAI;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Services\GeminiAI\GeminiClient;
use App\Services\TripSearchService;
use App\Support\Time\ViDatetimeParser;
use App\Services\GeminiAI\LocationResolverService;

/**
 * GeminiAiService
 * - Nhận message tự nhiên của người dùng
 * - Gọi Gemini (function calling) để trích tham số
 * - Chuẩn hoá date/time window & resolve location text -> id
 * - Gọi TripSearchService::searchOneWay() và trả message + trips
 *
 * Yêu cầu:
 * - Đã có GeminiClient (App\Services\AI\GeminiClient)
 * - Đã bind LocationResolverService (có thể null nếu bạn chưa dùng text → id)
 * - Đã có TripSearchService::searchOneWay(int $fromLocationId, int $toLocationId, string $dateYmd, array $filters)
 */
class GeminiAiService
{
    public function __construct(
        private GeminiClient $gemini,
        private TripSearchService $tripSearch,
        private LocationResolverService $resolver,
    ) {}

    /**
     * Xử lý 1 lượt chat.
     * @return array{message:string, trips?:array<int, array>}
     */
    public function chat(string $userMessage, ?string $contextKey = null, ?string $traceId = null): array
    {
        $context = $this->loadContext($contextKey);
        // ====== tools (function calling) ======
        $tools = [[
            'functionDeclarations' => [[
                'name' => 'search_trips',
                'description' => 'Tìm chuyến xe khách một chiều theo câu hỏi của người dùng',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        // Người dùng có thể đưa text:
                        'from_text' => ['type' => 'string', 'description' => 'Điểm đi dạng chữ: "Hà Nội", "Kim Mã"'],
                        'to_text'   => ['type' => 'string', 'description' => 'Điểm đến dạng chữ: "Thọ Xuân", "Thanh Hóa"'],
                        // Hoặc đưa sẵn location_id:
                        'from_location_id' => ['type' => 'integer'],
                        'to_location_id'   => ['type' => 'integer'],
                        // Thời gian tự nhiên:
                        'date_text'   => ['type' => 'string', 'description' => '"hôm nay", "mai", "thứ 6", hoặc "YYYY-MM-DD"'],
                        'time_window' => ['type' => 'string', 'description' => '"sáng"|"chiều"|"tối" hoặc "HH:mm-HH:mm"'],
                        // Tuỳ chọn lọc:
                        'passengers'   => ['type' => 'integer', 'minimum' => 1, 'default' => 1],
                        'bus_type_ids' => ['type' => 'array', 'items' => ['type' => 'integer']],
                        'price_cap'    => ['type' => 'integer'],
                        'min_seats'    => ['type' => 'integer'],
                        'sort'         => ['type' => 'string', 'enum' => ['asc', 'desc'], 'default' => 'asc'],
                        'limit'        => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100],
                    ],
                    // Tối thiểu: có ý niệm về ngày (date_text). from/to có thể là text để backend resolve.
                    'required' => ['date_text']
                ]
            ]]
        ]];

        // ====== system instruction (cải thiện để thông minh hơn) ======
        $system = [
            'role' => 'user',
            'parts' => [[
                'text' => <<<PROMPT
Bạn là trợ lý AI thông minh chuyên tìm chuyến xe khách (bus) bằng tiếng Việt.

QUY TẮC QUAN TRỌNG:
1. LUÔN trả lời bằng tiếng Việt, thân thiện và tự nhiên như đang nói chuyện với bạn.
2. Khi có đủ thông tin (điểm đi, điểm đến, ngày): GỌI NGAY function search_trips.
3. Khi thiếu thông tin: HỎI RÕ RÀNG từng phần một, không hỏi dồn dập.

HIỂU BIẾT VỀ ĐỊA ĐIỂM:
- Hiểu các cách viết: "Hà Nội" = "HN" = "Hanoi", "TP.HCM" = "Sài Gòn" = "SG" = "Ho Chi Minh"
- Hiểu tên quận/huyện: "Mỹ Đình", "Cầu Giấy", "Thọ Xuân", "Bến Xe Miền Đông"
- Nếu không rõ địa điểm: hỏi lại hoặc gợi ý các địa điểm phổ biến

HIỂU BIẾT VỀ THỜI GIAN:
- "hôm nay", "mai", "ngày mai", "thứ 2", "thứ 3", ..., "thứ 7", "chủ nhật"
- "sáng" (4:30-11:59), "chiều" (12:00-17:59), "tối" (18:00-23:59)
- "sáng sớm", "chiều muộn", "tối muộn"
- Có thể hiểu: "tối mai", "sáng thứ 6", "chiều hôm nay"

HIỂU BIẾT VỀ GIÁ CẢ:
- "dưới 200k", "dưới 200 nghìn", "<= 200000", "khoảng 200k", "từ 150k đến 300k"
- "rẻ nhất", "giá tốt", "phù hợp túi tiền"

HIỂU BIẾT VỀ SỐ LƯỢNG:
- "2 vé", "3 người", "1 ghế", "cho 4 người", "cần 2 chỗ"

HIỂU BIẾT VỀ LOẠI XE:
- "giường nằm", "limousine", "ghế ngồi", "xe VIP"

KHI TÌM THẤY CHUYẾN:
- Tóm tắt ngắn gọn: số lượng chuyến, khoảng giá, số ghế còn lại
- Nếu có nhiều chuyến: gợi ý chuyến phù hợp nhất
- Nếu ít chuyến: khuyến khích đặt sớm

KHI KHÔNG TÌM THẤY:
- Giải thích rõ ràng tại sao không có (ngày quá xa, không có tuyến, hết vé)
- Gợi ý: thử ngày khác, nới lỏng điều kiện (giá, giờ, loại xe)
- Luôn lịch sự và hữu ích

CÁC CÂU HỎI ĐẶC BIỆT:
- "Chuyến nào rẻ nhất?": tìm và highlight chuyến giá thấp nhất
- "Chuyến nào sớm nhất?": tìm chuyến khởi hành sớm nhất
- "Còn nhiều ghế không?": ưu tiên chuyến còn nhiều ghế
- "Xe nào đẹp nhất?": ưu tiên limousine hoặc giường nằm

KHÔNG BAO GIỜ:
- Trả lời bằng tiếng Anh
- Hỏi về máy bay, tàu hỏa, khách sạn
- Đưa ra thông tin không chính xác
- Bỏ qua thông tin quan trọng từ người dùng
PROMPT
            ]]
        ];

        // ====== Turn 1: hỏi model xem có muốn gọi function không ======
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
            // Log chi tiết để debug
            Log::error('Gemini AI service error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_message' => $userMessage,
                'model' => config('services.gemini.model'),
                'base' => config('services.gemini.base'),
                'version' => config('services.gemini.version'),
            ]);

            return ['message' => 'Xin lỗi, hệ thống AI đang bận. Bạn thử lại sau nhé.'];
        }

        $call = GeminiClient::extractFunctionCall($first);

        // Heuristic follow-up: nếu user chọn "chuyến thứ X" dựa trên context cũ
        if (!$call && !empty($context['trips'])) {
            if (preg_match('/chuy[eê]́n\s*(?:th[úư])?\s*(\d+)/iu', $userMessage, $m)) {
                $idx = max(1, (int)$m[1]) - 1;
                $trip = $context['trips'][$idx] ?? null;
                if ($trip) {
                    return [
                        'message' => $this->buildTripFollowupMessage($trip),
                        'trips' => [$trip],
                    ];
                }
            }

            // Câu hỏi "còn ghế không" không chỉ rõ chuyến -> dùng chuyến đầu tiên
            if (preg_match('/c[oò]n\s+gh[eế]|gh[eế]\s*c[òo]n/i', $userMessage)) {
                $trip = $context['trips'][0];
                $available = $trip['available_seats'] ?? null;
                $msg = $available !== null
                    ? "Chuyến gần nhất còn khoảng {$available} ghế. Bạn muốn giữ chỗ không?"
                    : "Mình có danh sách chuyến trước đó, bạn muốn xem lại và chọn số thứ tự chuyến chứ?";
                return ['message' => $msg, 'trips' => $context['trips']];
            }
        }

        // ====== Model yêu cầu gọi function: tiến hành thực thi nghiệp vụ ======
        if ($call && ($call['name'] ?? null) === 'search_trips') {
            $args = $call['args'] ?? [];



            $preFrom = $preTo = '';
            if (preg_match('/^\s*(?:từ\s+)?(.+?)\s+(?:đi|đến|->)\s+(.+?)\s*$/iu', $userMessage, $m)) {
                $preFrom = trim($m[1]);
                $preTo   = trim($m[2]);
            }


            // 1) Resolve from/to (ưu tiên args, fallback context trước đó)
            $fromId = (int) ($args['from_location_id'] ?? $context['from_id'] ?? 0);
            $toId   = (int) ($args['to_location_id']   ?? $context['to_id']   ?? 0);

            $fromText = trim((string) ($args['from_text'] ?? $args['from'] ?? $args['origin'] ?? $preFrom ?? $context['from_text'] ?? ''));
            $toText   = trim((string) ($args['to_text']   ?? $args['to']   ?? $args['destination'] ?? $preTo ?? $context['to_text'] ?? ''));

            if ($this->resolver) {
                if ($fromId <= 0 && $fromText !== '') {
                    $fromId = (int) ($this->resolver->resolveIdFromText($fromText) ?? 0);
                }
                if ($toId <= 0 && $toText !== '') {
                    $toId = (int) ($this->resolver->resolveIdFromText($toText) ?? 0);
                }
            }

            // Cải thiện xử lý khi không tìm thấy location
            if ($fromId <= 0 || $toId <= 0) {
                $missing = [];
                $suggestions = [];

                if ($fromId <= 0 && $fromText !== '') {
                    $missing[] = 'điểm đi';
                    if ($this->resolver) {
                        $suggestions['from'] = $this->resolver->suggest($fromText, 3);
                    }
                }

                if ($toId <= 0 && $toText !== '') {
                    $missing[] = 'điểm đến';
                    if ($this->resolver) {
                        $suggestions['to'] = $this->resolver->suggest($toText, 3);
                    }
                }

                $m = implode(' và ', $missing);
                $message = "Mình không tìm thấy $m bạn nhắc đến.";

                // Thêm gợi ý nếu có
                if (!empty($suggestions)) {
                    $message .= " Bạn có thể thử:";
                    foreach ($suggestions as $type => $items) {
                        if (!empty($items)) {
                            $names = array_column($items, 'name');
                            $message .= " " . implode(', ', array_slice($names, 0, 3));
                        }
                    }
                } else {
                    $message .= " Bạn vui lòng cho mình biết $m cụ thể nhé.";
                }

                return ['message' => $message];
            }

            // ---- Lấy date/time từ nhiều key + fallback từ message gốc ----
            $dateText = (string)($args['date_text']
                ?? $args['date']
                ?? $args['day']
                ?? $args['when']
                ?? $args['travel_date']
                ?? $context['date_text'] ?? ''
            );

            // Fallback: nếu model không map, thử bóc trực tiếp từ câu người dùng
            if ($dateText === '' && !empty($userMessage)) {
                $dateText = $userMessage; // ViDatetimeParser của bạn hiểu "hôm nay/mai/thứ x"
            }

            if (trim($dateText) === '') {
                return ['message' => 'Bạn muốn đi ngày nào?'];
            }


            $dateYmd = ViDatetimeParser::resolveDate($dateText, 'Asia/Bangkok')->format('Y-m-d');

            // ---- Time window ----
            $timeRaw = (string)($args['time_window'] ?? $args['time'] ?? $args['period'] ?? '');
            $time = mb_strtolower(trim($timeRaw));
            $map = [
                'buổi sáng' => 'sáng',
                'sang' => 'sáng',
                'sáng sớm' => 'sáng',
                'sớm' => 'sáng',
                'buổi chiều' => 'chiều',
                'chieu' => 'chiều',
                'chiều muộn' => 'chiều',
                'buổi tối'  => 'tối',
                'toi' => 'tối',
                'tối muộn' => 'tối',
                'khuya' => 'tối',
                'đêm' => 'tối',
            ];
            if (isset($map[$time])) $time = $map[$time];

            // Nếu không có time_window trong args, thử extract từ message
            if ($time === '' && !empty($userMessage)) {
                $timePatterns = [
                    '/sáng|sớm/i' => 'sáng',
                    '/chiều|trưa/i' => 'chiều',
                    '/tối|đêm|khuya/i' => 'tối',
                ];
                foreach ($timePatterns as $pattern => $mapped) {
                    if (preg_match($pattern, $userMessage)) {
                        $time = $mapped;
                        break;
                    }
                }
            }

            $timeFrom = $timeTo = null;
            if ($time !== '') {
                [$timeFrom, $timeTo] = \App\Support\Time\ViDatetimeParser::resolveTimeWindow($time);
            }

            // 3) Map filters sang searchOneWay với cải thiện parse giá cả
            $filters = [];
            if ($timeFrom && $timeTo) {
                $filters['time_from'] = $timeFrom;
                $filters['time_to']   = $timeTo;
            }
            if (!empty($args['bus_type_ids']) && is_array($args['bus_type_ids'])) {
                $filters['bus_type'] = array_map('intval', $args['bus_type_ids']);
            }
            if (!empty($context['filters']['bus_type'] ?? null) && empty($filters['bus_type'])) {
                $filters['bus_type'] = $context['filters']['bus_type'];
            }

            // Cải thiện parse price_cap từ nhiều format
            if (isset($args['price_cap'])) {
                $filters['price_cap'] = (int)$args['price_cap'];
            } else {
                // Thử extract giá từ message nếu có
                $pricePatterns = [
                    '/dưới\s*(\d+)\s*k/i' => 1,
                    '/dưới\s*(\d+)\s*nghìn/i' => 1,
                    '/dưới\s*(\d+)\s*000/i' => 1,
                    '/<=?\s*(\d+)\s*k/i' => 1,
                    '/khoảng\s*(\d+)\s*k/i' => 1,
                    '/từ\s*\d+\s*k?\s*đến\s*(\d+)\s*k/i' => 1,
                ];
                foreach ($pricePatterns as $pattern => $multiplier) {
                    if (preg_match($pattern, $userMessage, $matches)) {
                        $price = (int)$matches[1] * ($multiplier === 1 ? 1000 : $multiplier);
                        $filters['price_cap'] = $price;
                        break;
                    }
                }
            }

            if (isset($args['min_seats']))  $filters['min_seats']  = max(0, (int)$args['min_seats']);
            if (isset($args['limit']))      $filters['limit']      = (int)$args['limit'];

            // Xử lý sort thông minh hơn
            $sort = strtolower((string)($args['sort'] ?? 'asc'));
            $sortBy = $context['filters']['sort_by'] ?? null;

            if (preg_match('/r[ẻe]\s*nh[aấ]t|gi[aá]\s*t[oố]t|gi[aá]\s*th[áâ]p/i', $userMessage)) {
                $sortBy = 'price';
                $sort = 'asc';
            }
            if (preg_match('/s[ơơ]́m\s*nh[ấ]t|gi[á]o\s*sơm|kh[ơ]̉i\s*hành\s*s[ơ]́m/i', $userMessage)) {
                $sortBy = 'departure_time';
                $sort = 'asc';
            }
            if (preg_match('/gh[eế]\s*nhi[ề]u/i', $userMessage)) {
                $sortBy = 'available_seats';
                $sort = 'desc';
            }

            $filters['sort'] = in_array($sort, ['asc', 'desc'], true) ? $sort : 'asc';
            if ($sortBy) {
                $filters['sort_by'] = $sortBy;
            }

            // passengers => tối thiểu số ghế
            if (isset($args['passengers'])) {
                $filters['min_seats'] = max((int)($filters['min_seats'] ?? 0), (int)$args['passengers']);
            } else {
                // Thử extract số lượng từ message
                if (preg_match('/(\d+)\s*(?:vé|người|ghế|chỗ)/i', $userMessage, $matches)) {
                    $filters['min_seats'] = max((int)($filters['min_seats'] ?? 0), (int)$matches[1]);
                }
            }

            // 4) Gọi service tìm chuyến của bạn
            try {
                $trips = $this->tripSearch->searchOneWay($fromId, $toId, $dateYmd, $filters);
            } catch (\Throwable $e) {
                Log::error('Trip search error', [
                    'message' => $e->getMessage(),
                    'from' => $fromId,
                    'to' => $toId,
                    'date' => $dateYmd,
                    'filters' => $filters,
                ]);
                return ['message' => 'Xin lỗi, hệ thống đang gặp sự cố. Bạn vui lòng thử lại sau nhé.'];
            }

            // Lưu context để hỗ trợ follow-up trong 25 phút
            $this->storeContext($contextKey, [
                'from_id' => $fromId,
                'to_id' => $toId,
                'from_text' => $fromText,
                'to_text' => $toText,
                'date_text' => $dateText,
                'filters' => $filters,
                'trips' => array_values(array_slice($trips, 0, 10)), // lưu tối đa 10 chuyến gần nhất
                'last_user_message' => $userMessage,
                'updated_at' => now()->toIsoString(),
                'trace_id' => $traceId,
            ]);

            // 5) Turn 2: gửi functionResponse cho Gemini để "kể chuyện" đẹp với context phong phú hơn
            $tripCount = count($trips);
            $summary = $this->buildTripSummary($trips);

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
                                'count' => $tripCount,
                            ],
                        ]
                    ]]]
                ]
            ];

            try {
                $second = $this->gemini->secondTurn($payload2);
                $text = GeminiClient::extractText($second);

                // Fallback thông minh nếu AI không trả về text
                if (empty($text)) {
                    $text = $this->generateSmartResponse($trips, $summary, $userMessage);
                }
            } catch (\Throwable $e) {
                Log::error('Gemini second turn error', [
                    'message' => $e->getMessage(),
                    'user_message' => $userMessage,
                ]);
                // Fallback: tạo response thông minh dựa trên kết quả
                $text = $this->generateSmartResponse($trips, $summary, $userMessage);
            }

            return ['message' => $this->sanitizeMessage($text), 'trips' => $trips];
        }

        // ====== Không gọi function: thường là câu hỏi làm rõ ======
        $text = GeminiClient::extractText($first);

        // Nếu AI không trả về text, tạo response thông minh dựa trên message
        if (empty($text)) {
            $text = $this->handleGeneralQuestion($userMessage);
        }

        return ['message' => $this->sanitizeMessage($text)];
    }

    /**
     * Tạo summary từ danh sách trips để AI có context tốt hơn
     */
    private function buildTripSummary(array $trips): array
    {
        if (empty($trips)) {
            return [
                'count' => 0,
                'price_range' => null,
                'time_range' => null,
                'available_seats' => 0,
                'bus_types' => [],
            ];
        }

        $prices = array_filter(array_column($trips, 'price'));
        $times = array_filter(array_column($trips, 'departure_time'));
        $totalSeats = array_sum(array_column($trips, 'available_seats'));
        $busTypes = array_unique(array_filter(array_column(array_column($trips, 'bus'), 'type')));

        return [
            'count' => count($trips),
            'price_range' => !empty($prices) ? [
                'min' => min($prices),
                'max' => max($prices),
            ] : null,
            'time_range' => !empty($times) ? [
                'earliest' => min($times),
                'latest' => max($times),
            ] : null,
            'available_seats' => $totalSeats,
            'bus_types' => array_values($busTypes),
        ];
    }

    /**
     * Tạo response thông minh khi AI không trả về text
     */
    private function generateSmartResponse(array $trips, array $summary, string $userMessage): string
    {
        if (empty($trips)) {
            // Phân tích tại sao không có kết quả
            if (preg_match('/rẻ|giá\s*thấp|dưới\s*\d+/i', $userMessage)) {
                return "Không tìm thấy chuyến theo mức giá này. Thử nới giá hoặc chọn ngày khác nhé.";
            }
            if (preg_match('/sớm|sáng\s*sớm/i', $userMessage)) {
                return "Không có chuyến sớm trong ngày này. Bạn thử khung giờ khác hoặc ngày khác nhé.";
            }
            return "Không tìm thấy chuyến phù hợp. Bạn thử ngày khác hoặc điều chỉnh điều kiện tìm kiếm nhé.";
        }

        // Rút gọn thông điệp khi có danh sách chuyến
        $count = $summary['count'];
        $priceRange = $summary['price_range'];
        $timeRange = $summary['time_range'] ?? null;
        $totalSeats = $summary['available_seats'];

        $parts = [];
        $parts[] = "Có {$count} chuyến phù hợp";
        if ($timeRange && !empty($timeRange['earliest'])) {
            $parts[] = "sớm nhất {$timeRange['earliest']}";
        }
        if ($priceRange) {
            $minPrice = number_format($priceRange['min'], 0, ',', '.');
            $maxPrice = number_format($priceRange['max'], 0, ',', '.');
            $parts[] = $priceRange['min'] === $priceRange['max']
                ? "giá {$minPrice}đ"
                : "giá {$minPrice}–{$maxPrice}đ";
        }
        if ($totalSeats) {
            $parts[] = "còn {$totalSeats} ghế";
        }

        // Nếu người dùng hỏi rẻ nhất hoặc sớm nhất, thêm 1 câu ngắn
        if (preg_match('/rẻ\s*nhất|giá\s*tốt/i', $userMessage)) {
            $cheapest = min(array_column($trips, 'price'));
            $parts[] = "rẻ nhất " . number_format($cheapest, 0, ',', '.') . "đ";
        }
        if (preg_match('/sớm\s*nhất/i', $userMessage) && $timeRange && !empty($timeRange['earliest'])) {
            $parts[] = "sớm nhất {$timeRange['earliest']}";
        }

        return implode(', ', $parts) . ". Bạn chọn số thứ tự chuyến nhé?";
    }

    /**
     * Xử lý câu hỏi chung không phải tìm chuyến
     */
    private function handleGeneralQuestion(string $userMessage): string
    {
        $msg = mb_strtolower(trim($userMessage));

        // Chào hỏi
        if (preg_match('/^(chào|xin chào|hello|hi|hey)/i', $msg)) {
            return "Xin chào! Mình có thể giúp bạn tìm chuyến xe. Bạn muốn đi đâu và đi khi nào?";
        }

        // Hỏi về cách sử dụng
        if (preg_match('/(cách|hướng dẫn|help|giúp|sử dụng)/i', $msg)) {
            return "Bạn chỉ cần cho mình biết:\n- Điểm đi và điểm đến (ví dụ: Hà Nội, Thanh Hóa)\n- Ngày đi (ví dụ: mai, hôm nay, thứ 6)\n- Thời gian (tùy chọn: sáng, chiều, tối)\n- Số lượng vé (tùy chọn)\n- Mức giá (tùy chọn: dưới 200k)\n\nVí dụ: 'Tìm 2 vé từ Hà Nội đi Thanh Hóa mai sáng, dưới 250k'";
        }

        // Câu hỏi về giá
        if (preg_match('/(giá|giá cả|phí|tiền)/i', $msg)) {
            return "Giá vé phụ thuộc vào tuyến đường, loại xe và thời gian. Bạn cho mình biết điểm đi, điểm đến và ngày đi, mình sẽ tìm chuyến phù hợp với mức giá tốt nhất cho bạn nhé!";
        }

        // Câu hỏi về thời gian
        if (preg_match('/(mất bao lâu|thời gian|bao lâu|duration)/i', $msg)) {
            return "Thời gian di chuyển phụ thuộc vào tuyến đường. Bạn cho mình biết điểm đi và điểm đến, mình sẽ tìm chuyến và cho biết thời gian di chuyển cụ thể nhé!";
        }

        // Mặc định: hỏi thông tin cần thiết
        return "Để mình tìm chuyến phù hợp, bạn vui lòng cho mình biết:\n- Điểm đi\n- Điểm đến\n- Ngày đi\n\nVí dụ: 'Tìm chuyến từ Hà Nội đi Thanh Hóa mai'";
    }

    private function loadContext(?string $key): array
    {
        if (!$key) return [];
        return Cache::get($key, []);
    }

    private function storeContext(?string $key, array $data): void
    {
        if (!$key) return;
        Cache::put($key, $data, now()->addMinutes(25));
    }

    private function buildTripFollowupMessage(array $trip): string
    {
        $price = isset($trip['price']) ? number_format($trip['price'], 0, ',', '.') . 'đ' : 'không rõ giá';
        $time = $trip['departure_time'] ?? 'không rõ giờ';
        $route = trim(($trip['from_location'] ?? '') . ' → ' . ($trip['to_location'] ?? ''));
        $seats = $trip['available_seats'] ?? null;
        $seatText = $seats !== null ? "{$seats} ghế trống" : 'chưa rõ số ghế';

        return "Bạn chọn chuyến lúc {$time} ({$route}), giá {$price}, còn {$seatText}. Mình có thể mở đặt chỗ cho chuyến này nhé?";
    }

    /**
     * Làm sạch markdown đơn giản từ model (bỏ ** **, * *)
     */
    private function sanitizeMessage(?string $text): string
    {
        if (!$text) return '';

        // Bỏ **bold** và *italic*
        $text = preg_replace('/\*\*(.*?)\*\*/s', '$1', $text);
        $text = preg_replace('/\*(.*?)\*/s', '$1', $text);

        // Bỏ gạch đầu dòng "- " khi không cần
        $text = preg_replace('/^\s*-\s*/m', '', $text);

        // Thu gọn khoảng trắng
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{2,}/', "\n", $text);

        return trim($text);
    }
}
