<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Xác nhận đặt vé</title>
    <style>
        :root {
            color-scheme: light;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 24px;
            background: #f5f7fb;
            font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            line-height: 1.6;
        }

        .email-shell {
            max-width: 760px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
            border: 1px solid #e2e8f0;
        }

        .email-head {
            background: radial-gradient(circle at top, #1d4ed8, #0f172a);
            color: #fff;
            padding: 32px 32px 24px;
            text-align: center;
        }

        .email-head h1 {
            margin: 0 0 6px;
            font-size: 22px;
            letter-spacing: 0.3px;
        }

        .email-head p {
            margin: 0;
            font-size: 15px;
            opacity: 0.85;
        }

        .status-pill {
            display: inline-block;
            margin-top: 18px;
            padding: 6px 18px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            font-weight: 600;
            font-size: 13px;
            letter-spacing: 0.5px;
        }

        .email-body {
            padding: 32px;
        }

        .summary-card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 18px;
            margin-bottom: 28px;
        }

        .summary-item label {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.7px;
            margin-bottom: 6px;
        }

        .summary-item span {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            word-break: break-word;
        }

        .trip-stack {
            display: grid;
            gap: 18px;
        }

        .trip-card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 22px;
        }

        .trip-card__title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
            font-size: 15px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #475569;
        }

        .trip-card__badge {
            padding: 4px 12px;
            border-radius: 999px;
            background: #e0f2fe;
            color: #0369a1;
            font-size: 12px;
            font-weight: 600;
        }

        .trip-card__main {
            display: flex;
            flex-wrap: wrap;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            overflow: hidden;
        }

        .trip-card__time {
            flex: 1 1 200px;
            padding: 18px;
            background: #0f172a;
            color: #fff;
        }

        .trip-card__time strong {
            display: block;
            font-size: 26px;
            letter-spacing: 1px;
        }

        .trip-card__time span {
            font-size: 13px;
            opacity: 0.75;
        }

        .trip-card__route {
            flex: 2 1 280px;
            padding: 18px 22px;
            background: #fff;
        }

        .route-row {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .route-point {
            flex: 1;
        }

        .route-point label {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94a3b8;
            margin-bottom: 4px;
        }

        .route-point strong {
            font-size: 18px;
            color: #0f172a;
        }

        .route-arrow {
            font-size: 18px;
            color: #94a3b8;
        }

        .trip-meta {
            margin-top: 16px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 14px;
        }

        .meta-box {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
        }

        .meta-box label {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.6px;
            margin-bottom: 6px;
        }

        .meta-box span {
            font-weight: 600;
            color: #0f172a;
        }

        .price-breakdown {
            margin: 28px 0 20px;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }

        .price-row {
            display: flex;
            justify-content: space-between;
            padding: 14px 20px;
            font-size: 16px;
            border-bottom: 1px solid #e2e8f0;
        }

        .price-row:last-child {
            border-bottom: none;
        }

        .price-row--highlight {
            background: #0f172a;
            color: #fff;
            font-weight: 700;
        }

        .note-card {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 14px;
            padding: 18px 20px;
            font-size: 14px;
            color: #78350f;
        }

        .email-foot {
            padding: 22px;
            text-align: center;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }

        .email-foot p {
            margin: 0;
            color: #475569;
            font-size: 13px;
        }

        .contact {
            margin-top: 6px;
            font-size: 12px;
            color: #94a3b8;
        }

        @media screen and (max-width: 640px) {
            body {
                padding: 12px;
            }

            .email-body {
                padding: 22px 20px;
            }

            .trip-card__main {
                flex-direction: column;
            }

            .trip-card__time,
            .trip-card__route {
                flex: 1 1 auto;
            }

            .price-row {
                flex-direction: column;
                gap: 6px;
                text-align: left;
            }
        }
    </style>
</head>

<body>
    <?php
        $legs = $booking->legs ?? collect();
        $outboundLeg = $legs->first(fn($leg) => strtoupper($leg->leg_type) === 'OUT');
        $returnLeg = $legs->first(fn($leg) => strtoupper($leg->leg_type) === 'RETURN');
        $segments = collect(
            array_filter([
                [
                    'title' => 'Chiều đi',
                    'emoji' => '🚌',
                    'leg' => $outboundLeg,
                ],
                [
                    'title' => 'Chiều về',
                    'emoji' => '🏠',
                    'leg' => $returnLeg,
                ],
            ]),
        )->whereNotNull('leg');

        $formatTime = fn($date) => $date ? \Carbon\Carbon::parse($date)->format('H:i') : '--';
        $formatDate = fn($date) => $date ? \Carbon\Carbon::parse($date)->format('d/m/Y') : '--';
        $seatList = fn($leg) => $leg?->items?->pluck('seat.seat_number')->filter()->implode(', ') ?: '—';
        $seatCount = fn($leg) => $leg?->items?->count() ?: 0;
        $passengerName = $booking->customer_name ?: optional($booking->user)->name ?: 'Quý khách';
        $totalTickets = $legs->sum(fn($leg) => $leg->items->count());
    ?>

    <div class="email-shell">
        <div class="email-head">
            <h1>Đặt vé thành công</h1>
            <p>Cảm ơn bạn đã tin tưởng DucAnh Transport</p>
            <div class="status-pill">Thanh toán xác nhận</div>
        </div>

        <div class="email-body">
            <div class="summary-card">
                <div class="summary-item">
                    <label>Mã vé</label>
                    <span><?php echo e($booking->code); ?></span>
                </div>
                <div class="summary-item">
                    <label>Hành khách</label>
                    <span><?php echo e($passengerName); ?></span>
                </div>
                <div class="summary-item">
                    <label>Số vé</label>
                    <span><?php echo e($totalTickets); ?></span>
                </div>
                <div class="summary-item">
                    <label>Tổng tiền</label>
                    <span><?php echo e(number_format($booking->total_price ?? 0)); ?> đ</span>
                </div>
            </div>

            <div class="trip-stack">
                <?php $__currentLoopData = $segments; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $segment): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php
                        $leg = $segment['leg'];
                    ?>
                    <div class="trip-card">
                        <div class="trip-card__title">
                            <span><?php echo e($segment['emoji']); ?> <?php echo e($segment['title']); ?></span>
                            <span class="trip-card__badge">
                                <?php echo e($formatDate($leg->trip->departure_time ?? $leg->depart_at)); ?>

                            </span>
                        </div>

                        <div class="trip-card__main">
                            <div class="trip-card__time">
                                <strong><?php echo e($formatTime($leg->trip->departure_time ?? $leg->depart_at)); ?></strong>
                                <span>Giờ khởi hành dự kiến</span>
                            </div>
                            <div class="trip-card__route">
                                <div class="route-row">
                                    <div class="route-point">
                                        <label>Điểm đi</label>
                                        <strong><?php echo e($leg->from_location->name ?? '—'); ?></strong>
                                    </div>
                                    <div class="route-arrow">⟶</div>
                                    <div class="route-point" style="text-align: right;">
                                        <label>Điểm đến</label>
                                        <strong><?php echo e($leg->to_location->name ?? '—'); ?></strong>
                                    </div>
                                </div>
                                <p style="margin: 12px 0 0; color: #475569; font-size: 14px;">
                                    <?php echo e($leg->pickup_address ?? 'Điểm đón sẽ được thông báo qua SMS'); ?>

                                </p>
                            </div>
                        </div>

                        <div class="trip-meta">
                            <div class="meta-box">
                                <label>Vị trí ghế</label>
                                <span><?php echo e($seatList($leg)); ?></span>
                            </div>
                            <div class="meta-box">
                                <label>Số lượng</label>
                                <span><?php echo e($seatCount($leg)); ?> vé</span>
                            </div>
                            <div class="meta-box">
                                <label>Giá vé</label>
                                <span><?php echo e(number_format($leg->total_price ?? 0)); ?> đ</span>
                            </div>
                            <div class="meta-box">
                                <label>Điểm trả</label>
                                <span><?php echo e($leg->dropoff_address ?? '—'); ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>

            <div class="price-breakdown">
                <div class="price-row">
                    <span>Giảm giá</span>
                    <strong><?php echo e(number_format($booking->discount_amount ?? 0)); ?> đ</strong>
                </div>
                <div class="price-row price-row--highlight">
                    <span>Tổng thanh toán</span>
                    <span><?php echo e(number_format($booking->total_price ?? 0)); ?> đ</span>
                </div>
            </div>

            <div class="note-card">
                <strong>📌 Lưu ý cho chuyến đi</strong>
                <ul style="padding-left: 20px; margin: 10px 0 0; color: #92400e;">
                    <li>Vui lòng có mặt trước giờ khởi hành ít nhất 15 phút.</li>
                    <li>Giữ mã vé và CMND/CCCD để xuất trình khi cần.</li>
                    <li>Liên hệ hotline nếu bạn muốn thay đổi lịch trình.</li>
                </ul>
            </div>
        </div>

        <div class="email-foot">
            <p>Chúc bạn có chuyến đi an toàn và trọn vẹn!</p>
            <div class="contact">
                Hotline: 1900 6688 · support@example.com
            </div>
        </div>
    </div>
</body>

</html>

<?php /**PATH C:\xampp\htdocs\datvexe\backend\resources\views/emails/booking_success.blade.php ENDPATH**/ ?>