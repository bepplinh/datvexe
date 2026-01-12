<?php

namespace Database\Seeders;

use App\Models\Rating;
use App\Models\BookingLeg;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RatingSeeder extends Seeder
{
    /**
     * Mảng các comment mẫu theo mức điểm
     */
    private array $commentTemplates = [
        1 => [
            'Rất thất vọng với dịch vụ này, không đúng như quảng cáo.',
            'Xe đến trễ, thái độ phục vụ rất tệ.',
            'Chất lượng quá kém, sẽ không sử dụng lại.',
            'Ghế bẩn, điều hòa không mát, rất khó chịu.',
            'Tài xế lái ẩu, cảm thấy không an toàn.',
        ],
        2 => [
            'Dịch vụ chưa ổn, cần cải thiện nhiều.',
            'Xe hơi cũ, không thoải mái lắm.',
            'Trễ giờ khá nhiều, cần đúng giờ hơn.',
            'Nhân viên ít nhiệt tình, cần training thêm.',
            'Không đáng giá tiền, dịch vụ tạm được.',
        ],
        3 => [
            'Dịch vụ bình thường, không có gì đặc biệt.',
            'Xe ổn, đúng giờ nhưng không nổi bật.',
            'Tạm được, có thể sử dụng khi cần.',
            'Giá cả hợp lý cho chất lượng nhận được.',
            'Không có vấn đề gì, nhưng cũng không ấn tượng.',
        ],
        4 => [
            'Dịch vụ tốt, xe sạch sẽ và thoải mái.',
            'Tài xế lịch sự, đúng giờ. Hài lòng.',
            'Chất lượng tốt, sẽ sử dụng lại.',
            'Nhân viên nhiệt tình, xe chạy êm.',
            'Đáng tiền, recommend cho mọi người.',
        ],
        5 => [
            'Tuyệt vời! Dịch vụ hoàn hảo, sẽ quay lại.',
            'Rất hài lòng, xe mới, tài xế thân thiện.',
            'Xuất sắc! Đánh giá 5 sao xứng đáng.',
            'Chất lượng premium, đúng giờ, rất chuyên nghiệp.',
            'Best service ever! Highly recommend!',
            'Trải nghiệm tuyệt vời, giá cả phải chăng.',
            'Xe sạch sẽ, mát mẻ, nhân viên rất nice!',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy các booking legs từ các booking đã thanh toán (paid)
        $paidBookingLegs = BookingLeg::whereHas('booking', function ($query) {
            $query->where('status', 'paid');
        })->with(['booking'])->get();

        if ($paidBookingLegs->isEmpty()) {
            $this->command?->warn('⚠️ Cannot seed ratings: no paid booking legs found.');
            return;
        }

        $this->command->info("📊 Found {$paidBookingLegs->count()} paid booking legs");

        // Để tránh vi phạm unique constraint (trip_id, user_id), 
        // cần track các cặp đã tạo rating
        $ratedPairs = [];
        $createdCount = 0;
        $skippedCount = 0;

        // 70% booking legs sẽ có rating
        $ratingProbability = 70;

        foreach ($paidBookingLegs as $bookingLeg) {
            // Random xem có tạo rating cho leg này không
            if (rand(1, 100) > $ratingProbability) {
                $skippedCount++;
                continue;
            }

            $tripId = $bookingLeg->trip_id;
            $userId = $bookingLeg->booking->user_id;

            // Kiểm tra unique constraint (trip_id, user_id)
            $pairKey = "{$tripId}_{$userId}";
            if (isset($ratedPairs[$pairKey])) {
                $skippedCount++;
                continue;
            }

            // Kiểm tra xem đã có rating trong DB chưa
            if (Rating::where('trip_id', $tripId)->where('user_id', $userId)->exists()) {
                $ratedPairs[$pairKey] = true;
                $skippedCount++;
                continue;
            }

            // Tạo rating với phân bố điểm thực tế
            // 60% rating 4-5 sao, 25% rating 3 sao, 15% rating 1-2 sao
            $scoreDistribution = rand(1, 100);
            if ($scoreDistribution <= 35) {
                $score = 5;
            } elseif ($scoreDistribution <= 60) {
                $score = 4;
            } elseif ($scoreDistribution <= 85) {
                $score = 3;
            } elseif ($scoreDistribution <= 95) {
                $score = 2;
            } else {
                $score = 1;
            }

            // 80% có comment, 20% không có
            $comment = null;
            if (rand(1, 100) <= 80) {
                $comments = $this->commentTemplates[$score];
                $comment = $comments[array_rand($comments)];
            }

            // Tạo thời gian rating sau khi booking 1-7 ngày
            $bookingCreatedAt = $bookingLeg->booking->created_at;
            $ratingCreatedAt = $bookingCreatedAt->copy()->addDays(rand(1, 7))->addHours(rand(0, 23))->addMinutes(rand(0, 59));

            Rating::create([
                'trip_id' => $tripId,
                'booking_leg_id' => $bookingLeg->id,
                'user_id' => $userId,
                'score' => $score,
                'comment' => $comment,
                'created_at' => $ratingCreatedAt,
                'updated_at' => $ratingCreatedAt,
            ]);

            $ratedPairs[$pairKey] = true;
            $createdCount++;

            // Log progress mỗi 50 ratings
            if ($createdCount % 50 === 0) {
                $this->command->info("  ✓ Created {$createdCount} ratings...");
            }
        }

        $this->command->info("✅ Successfully created {$createdCount} ratings! (Skipped: {$skippedCount})");
    }
}
