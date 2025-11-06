<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác Nhận Đặt Vé Thành Công</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }

        .email-container {
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 10px;
            text-align: center;
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .status-badge {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 15px;
        }

        .content {
            padding: 30px 20px;
        }

        .ticket-code {
            text-align: center;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 8px;
            margin-bottom: 25px;
        }

        .ticket-code label {
            display: block;
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .ticket-code .code {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            letter-spacing: 2px;
        }

        .route-info {
            background: linear-gradient(to right, #fef3c7, #fde68a);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
        }

        .route-header {
            display: table;
            width: 100%;
            border-spacing: 0;
            margin-bottom: 15px;
        }

        .route-time {
            font-size: 18px;
            font-weight: 700;
            color: #92400e;
            display: table-cell;
            vertical-align: middle;
            width: 50%;
            text-align: center;
        }

        .route-locations {
            display: table;
            width: 100%;
            border-spacing: 0;
            margin-bottom: 12px;
        }

        .route-date {
            text-align: center;
            font-size: 13px;
            color: #78350f;
            font-weight: 600;
        }

        .route-location {
            width: 40%;
            display: table-cell;
            vertical-align: top;
        }

        .route-location .label {
            font-size: 12px;
            color: #78350f;
            margin-bottom: 4px;
        }

        .route-location .location {
            font-size: 18px;
            font-weight: 700;
            color: #92400e;
        }

        .route-icon {
            padding: 0 15px;
            font-size: 24px;
            width: 20%;
            text-align: center;
            display: table-cell;
            vertical-align: middle;
        }

        .trip-price {
            background-color: #ecfdf5;
            padding: 12px 15px;
            border-radius: 6px;
            text-align: center;
            border: 2px solid #a7f3d0;
            margin-bottom: 15px;
        }

        .trip-price label {
            display: block;
            font-size: 12px;
            color: #065f46;
            margin-bottom: 4px;
            font-weight: 500;
        }

        .trip-price .amount {
            font-size: 20px;
            font-weight: 700;
            color: #059669;
        }

        .trip-price .currency {
            font-size: 13px;
            color: #047857;
            margin-left: 3px;
        }

        .info-grid {
            width: 100%;
            border-spacing: 15px 0;
        }

        .info-item {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .info-item label {
            display: block;
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
            font-weight: 500;
        }

        .info-item .value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
        }

        .full-width {
            width: 100%;
        }

        .pickup-info {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 2px solid #dbeafe;
        }

        .pickup-info h3 {
            font-size: 16px;
            color: #1e40af;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }

        .pickup-info h3::before {
            content: "📍";
            margin-right: 8px;
        }

        .pickup-item {
            margin-bottom: 10px;
            font-size: 14px;
            color: #1f2937;
        }

        .pickup-item strong {
            color: #1e40af;
            display: inline-block;
            min-width: 90px;
        }

        .trips-container-table {
            width: 100%;
            /* border-spacing sẽ được set inline */
            margin-bottom: 20px;
            table-layout: fixed;
        }

        .trip-section-td {
            vertical-align: top;
            padding: 0;
        }

        .trip-section-content {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            height: 100%;
        }

        .trip-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
        }

        .price-section {
            background-color: #f9fafb;
            padding: 10px 20px;
            border-radius: 8px;
            /* display: flex;
            align-items: center; */
            margin-bottom: 25px;
            border: 2px solid #e5e7eb;
        }

        .price-section-child {
            display: flex;
            justify-content: space-between;
            align-items: center
        }

        .price-section label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }

        .price-section .amount {
            font-size: 20px;
            font-weight: 700;
            color: #10b981;
        }

        .price-section .currency {
            font-size: 14px;
            color: #6b7280;
            margin-left: 4px;
        }

        .note {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin-bottom: 25px;
        }

        .note p {
            font-size: 13px;
            color: #92400e;
            margin-bottom: 8px;
        }

        .note p:last-child {
            margin-bottom: 0;
        }

        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .footer p {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 10px;
        }

        .contact-info {
            font-size: 12px;
            color: #9ca3af;
        }

        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }

            .email-container {
                max-width: 100% !important;
            }

            .header h1 {
                font-size: 20px;
            }

            .ticket-code .code {
                font-size: 26px;
            }

            .trips-container-table,
            .info-grid {
                display: block !important;
                width: 100% !important;
                border-spacing: 0 !important;
            }

            .trip-section-td {
                display: block !important;
                width: 100% !important;
                padding: 0 0 15px 0 !important;
            }

            .route-locations {
                display: block !important;
                text-align: center;
            }

            .route-location,
            .route-icon {
                display: block !important;
                width: 100% !important;
                padding: 5px 0 !important;
                text-align: center !important;
            }

            .route-icon {
                transform: rotate(90deg);
            }

            .price-section {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
    </style>
</head>

<body>

    <?php
        $outboundLeg = $booking->legs->first(fn($leg) => strtoupper($leg->leg_type) === 'OUT');
        $returnLeg = $booking->legs->first(fn($leg) => strtoupper($leg->leg_type) === 'RETURN');
        $isTwoColumn = $outboundLeg && $returnLeg;
        $containerWidth = $isTwoColumn ? 1000 : 700;

        // THAY ĐỔI: Thêm biến để điều chỉnh border-spacing
        $tableBorderSpacing = $isTwoColumn ? '20px 0' : '0';

        $getSeatList = fn($leg) => $leg ? $leg->items->pluck('seat.seat_number')->filter()->join(', ') : '';
        $getSeatCount = fn($leg) => $leg ? $leg->items->count() : 0;
    ?>

    <div class="email-container" style="max-width: <?php echo e($containerWidth); ?>px;">
        <div class="header">
            <h1>🎉 Đặt Vé Thành Công!</h1>
            <p>Cảm ơn quý khách đã sử dụng dịch vụ của DucAnhTransport</p>
            <div class="status-badge">✓ Đã Thanh Toán</div>
        </div>

        <div class="content">
            <div class="ticket-code">
                <label>MÃ VÉ CỦA BẠN</label>
                <div class="code"><?php echo e($booking->code); ?></div>
            </div>

            
            <table class="trips-container-table" cellpadding="0" cellspacing="0" border="0"
                style="width: 100%; border-spacing: <?php echo e($tableBorderSpacing); ?>; margin-bottom: 20px; table-layout: fixed;">
                <tr>
                    <?php if($outboundLeg): ?>
                        <td class="trip-section-td"
                            style="width: <?php echo e($isTwoColumn ? '50%' : '100%'); ?>; vertical-align: top; padding: 0;">
                            <div class="trip-section-content"
                                style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; height: 100%;">
                                
                                <div class="trip-header"
                                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 16px; border-radius: 6px; margin-bottom: 15px; font-size: 16px; font-weight: 600; text-align: center;">
                                    🚌 Chiều Đi</div>
                                <div class="route-info"
                                    style="background: linear-gradient(to right, #fef3c7, #fde68a); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                                    <div class="route-header"
                                        style="display: table; width: 100%; border-spacing: 0; margin-bottom: 15px;">
                                        <div class="route-time"
                                            style="font-size: 18px; font-weight: 700; color: #92400e; display: table-cell; vertical-align: middle; width: 50%; text-align: center;">
                                            ⏰ <?php echo e(optional($outboundLeg->trip->departure_time)->format('H:i') ?? '---'); ?>

                                        </div>
                                    </div>
                                    <div class="route-locations"
                                        style="display: table; width: 100%; border-spacing: 0; margin-bottom: 12px;">
                                        <div class="route-location"
                                            style="width: 40%; display: table-cell; vertical-align: top;">
                                            <div class="label"
                                                style="font-size: 12px; color: #78350f; margin-bottom: 4px;">Điểm đi
                                            </div>
                                            <div class="location"
                                                style="font-size: 18px; font-weight: 700; color: #92400e;">
                                                <?php echo e($outboundLeg->from_location->name ?? '---'); ?></div>
                                        </div>
                                        <div class="route-icon"
                                            style="padding: 0 15px; font-size: 24px; width: 20%; text-align: center; display: table-cell; vertical-align: middle;">
                                            →</div>
                                        <div class="route-location"
                                            style="text-align: right; width: 40%; display: table-cell; vertical-align: top;">
                                            <div class="label"
                                                style="font-size: 12px; color: #78350f; margin-bottom: 4px;">Điểm đến
                                            </div>
                                            <div class="location"
                                                style="font-size: 18px; font-weight: 700; color: #92400e;">
                                                <?php echo e($outboundLeg->to_location->name ?? '---'); ?></div>
                                        </div>
                                    </div>
                                    <div class="route-date"
                                        style="text-align: center; font-size: 13px; color: #78350f; font-weight: 600;">
                                        📅 <?php echo e(optional($outboundLeg->trip->departure_time)->format('d/m/Y') ?? '---'); ?>

                                    </div>
                                </div>
                                <div class="trip-price"
                                    style="background-color: #ecfdf5; padding: 12px 15px; border-radius: 6px; text-align: center; border: 2px solid #a7f3d0; margin-bottom: 15px;">
                                    <label
                                        style="display: block; font-size: 12px; color: #065f46; margin-bottom: 4px; font-weight: 500;">Giá
                                        vé chiều đi</label>
                                    <div>
                                        <span class="amount"
                                            style="font-size: 20px; font-weight: 700; color: #059669;"><?php echo e(number_format($outboundLeg->total_price ?? 0)); ?></span>
                                        <span class="currency"
                                            style="font-size: 13px; color: #047857; margin-left: 3px;">VNĐ</span>
                                    </div>
                                </div>
                                <table class="info-grid" cellpadding="0" cellspacing="0" border="0"
                                    style="width: 100%; border-spacing: 15px 0; margin-bottom: 15px;">
                                    <tr>
                                        <td class="info-item"
                                            style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; width: 50%;">
                                            <label
                                                style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; font-weight: 500;">Vị
                                                trí ghế</label>
                                            <div class="value"
                                                style="font-size: 16px; font-weight: 600; color: #1f2937;">
                                                <?php echo e($getSeatList($outboundLeg)); ?></div>
                                        </td>
                                        <td class="info-item"
                                            style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; width: 50%;">
                                            <label
                                                style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; font-weight: 500;">Số
                                                lượng vé</label>
                                            <div class="value"
                                                style="font-size: 16px; font-weight: 600; color: #1f2937;">
                                                <?php echo e($getSeatCount($outboundLeg)); ?> vé</div>
                                        </td>
                                    </tr>
                                </table>
                                <div class="pickup-info"
                                    style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #dbeafe;">
                                    <h3
                                        style="font-size: 16px; color: #1e40af; margin-bottom: 12px; display: flex; align-items: center;">
                                        Thông Tin Đón Trả</h3>
                                    <div class="pickup-item"
                                        style="margin-bottom: 10px; font-size: 14px; color: #1f2937;">
                                        <strong style="color: #1e40af; display: inline-block; min-width: 90px;">Điểm
                                            đón:</strong> <?php echo e($outboundLeg->pickup_address ?? '---'); ?>

                                    </div>
                                    <div class="pickup-item"
                                        style="margin-bottom: 10px; font-size: 14px; color: #1f2937;">
                                        <strong style="color: #1e40af; display: inline-block; min-width: 90px;">Điểm
                                            trả:</strong> <?php echo e($outboundLeg->dropoff_address ?? '---'); ?>

                                    </div>
                                </div>
                            </div>
                        </td>
                    <?php endif; ?>

                    <?php if($returnLeg): ?>
                        <td class="trip-section-td"
                            style="width: <?php echo e($isTwoColumn ? '50%' : '100%'); ?>; vertical-align: top; padding: 0;">
                            <div class="trip-section-content"
                                style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; height: 100%;">
                                
                                <div class="trip-header"
                                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 16px; border-radius: 6px; margin-bottom: 15px; font-size: 16px; font-weight: 600; text-align: center;">
                                    🏠 Chiều Về</div>
                                <div class="route-info"
                                    style="background: linear-gradient(to right, #fef3c7, #fde68a); padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                                    <div class="route-header"
                                        style="display: table; width: 100%; border-spacing: 0; margin-bottom: 15px;">
                                        <div class="route-time"
                                            style="font-size: 18px; font-weight: 700; color: #92400e; display: table-cell; vertical-align: middle; width: 50%; text-align: center;">
                                            ⏰ <?php echo e(optional($returnLeg->depart_at)->format('H:i') ?? '---'); ?></div>
                                    </div>
                                    <div class="route-locations"
                                        style="display: table; width: 100%; border-spacing: 0; margin-bottom: 12px;">
                                        <div class="route-location"
                                            style="width: 40%; display: table-cell; vertical-align: top;">
                                            <div class="label"
                                                style="font-size: 12px; color: #78350f; margin-bottom: 4px;">Điểm đi
                                            </div>
                                            <div class="location"
                                                style="font-size: 18px; font-weight: 700; color: #92400e;">
                                                <?php echo e($returnLeg->from_location->name ?? '---'); ?></div>
                                        </div>
                                        <div class="route-icon"
                                            style="padding: 0 15px; font-size: 24px; width: 20%; text-align: center; display: table-cell; vertical-align: middle;">
                                            →</div>
                                        <div class="route-location"
                                            style="text-align: right; width: 40%; display: table-cell; vertical-align: top;">
                                            <div class="label"
                                                style="font-size: 12px; color: #78350f; margin-bottom: 4px;">Điểm đến
                                            </div>
                                            <div class="location"
                                                style="font-size: 18px; font-weight: 700; color: #92400e;">
                                                <?php echo e($returnLeg->to_location->name ?? '---'); ?></div>
                                        </div>
                                    </div>
                                    <div class="route-date"
                                        style="text-align: center; font-size: 13px; color: #78350f; font-weight: 600;">
                                        📅 <?php echo e(optional($returnLeg->depart_at)->format('d/m/Y') ?? '---'); ?></div>
                                </div>
                                <div class="trip-price"
                                    style="background-color: #ecfdf5; padding: 12px 15px; border-radius: 6px; text-align: center; border: 2px solid #a7f3d0; margin-bottom: 15px;">
                                    <label
                                        style="display: block; font-size: 12px; color: #065f46; margin-bottom: 4px; font-weight: 500;">Giá
                                        vé chiều về</label>
                                    <div>
                                        <span class="amount"
                                            style="font-size: 20px; font-weight: 700; color: #059669;"><?php echo e(number_format($returnLeg->total_price ?? 0)); ?></span>
                                        <span class="currency"
                                            style="font-size: 13px; color: #047857; margin-left: 3px;">VNĐ</span>
                                    </div>
                                </div>
                                <table class="info-grid" cellpadding="0" cellspacing="0" border="0"
                                    style="width: 100%; border-spacing: 15px 0; margin-bottom: 15px;">
                                    <tr>
                                        <td class="info-item"
                                            style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; width: 50%;">
                                            <label
                                                style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; font-weight: 500;">Vị
                                                trí ghế</label>
                                            <div class="value"
                                                style="font-size: 16px; font-weight: 600; color: #1f2937;">
                                                <?php echo e($getSeatList($returnLeg)); ?></div>
                                        </td>
                                        <td class="info-item"
                                            style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; width: 50%;">
                                            <label
                                                style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; font-weight: 500;">Số
                                                lượng vé</label>
                                            <div class="value"
                                                style="font-size: 16px; font-weight: 600; color: #1f2937;">
                                                <?php echo e($getSeatCount($returnLeg)); ?> vé</div>
                                        </td>
                                    </tr>
                                </table>
                                <div class="pickup-info"
                                    style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #dbeafe;">
                                    <h3
                                        style="font-size: 16px; color: #1e40af; margin-bottom: 12px; display: flex; align-items: center;">
                                        Thông Tin Đón Trả</h3>
                                    <div class="pickup-item"
                                        style="margin-bottom: 10px; font-size: 14px; color: #1f2937;">
                                        <strong style="color: #1e40af; display: inline-block; min-width: 90px;">Điểm
                                            đón:</strong> <?php echo e($returnLeg->pickup_address ?? '---'); ?>

                                    </div>
                                    <div class="pickup-item"
                                        style="margin-bottom: 10px; font-size: 14px; color: #1f2937;">
                                        <strong style="color: #1e40af; display: inline-block; min-width: 90px;">Điểm
                                            trả:</strong> <?php echo e($returnLeg->dropoff_address ?? '---'); ?>

                                    </div>
                                </div>
                            </div>
                        </td>
                    <?php endif; ?>
                </tr>
            </table>

            
            <div class="price-section">
                <div class="price-section-child">
                    <label>Giảm giá</label>
                    <div>
                        <span class="amount"><?php echo e(number_format($booking->discount_amount ?? 0)); ?></span>
                        <span class="currency">VNĐ</span>
                    </div>
                </div>
                <div class="price-section-child">
                    <label>Tổng Tiền</label>
                    <div>
                        <span class="amount"><?php echo e(number_format($booking->total_price ?? 0)); ?></span>
                        <span class="currency">VNĐ</span>
                    </div>
                </div>
            </div>

            <div class="note">
                <p><strong>📌 Lưu ý:</strong></p>
                <p>• Vui lòng có mặt tại điểm đón trước 15 phút</p>
                <p>• Liên hệ hotline nếu cần hỗ trợ hoặc thay đổi lịch trình</p>
            </div>
        </div>

        

        <div class="footer">
            <p>Chúc bạn có chuyến đi an toàn và vui vẻ!</p>
            <div class="contact-info">
                <p>Hotline: 1900 6688 | Email: support@example.com</p>
                <p>© 2025 Công ty Vận Tải. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>

</html>
<?php /**PATH C:\xampp\htdocs\datvexe\resources\views/emails/booking_success.blade.php ENDPATH**/ ?>