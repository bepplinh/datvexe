<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Xác nhận đặt vé</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: Arial, Helvetica, sans-serif;">
    <?php
        $legs = $booking->legs ?? collect();
        $outboundLeg = $legs->first(fn($leg) => strtoupper($leg->leg_type) === 'OUT');
        $returnLeg = $legs->first(fn($leg) => strtoupper($leg->leg_type) === 'RETURN');
        
        $hasReturn = $returnLeg !== null;
        
        $formatTime = fn($date) => $date ? \Carbon\Carbon::parse($date)->format('H:i') : '--:--';
        $formatDate = fn($date) => $date ? \Carbon\Carbon::parse($date)->format('d/m/Y') : '--/--/----';
        $formatWeekday = fn($date) => $date ? \Carbon\Carbon::parse($date)->locale('vi')->isoFormat('dddd') : '--';
        
        $seatList = fn($leg) => $leg?->items?->pluck('seat.seat_number')->filter()->implode(', ') ?: '—';
        $seatCount = fn($leg) => $leg?->items?->count() ?: 0;
        
        $passengerName = $booking->customer_name ?: optional($booking->user)->name ?: 'Quý khách';
        $totalTickets = $legs->sum(fn($leg) => $leg->items->count());
        
        $tripType = $hasReturn ? 'Khứ hồi' : 'Một chiều';
    ?>

    <!-- Outer Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f9;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                
                <!-- Main Container 600px -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
                    
                    <!-- ========== HEADER ========== -->
                    <tr>
                        <td align="center" bgcolor="#10b981" style="padding: 35px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="font-size: 50px; color: #ffffff;">✓</td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px;">
                                        <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: bold;">Đặt vé thành công!</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 8px;">
                                        <p style="margin: 0; font-size: 14px; color: #d1fae5;">Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== BOOKING INFO ========== -->
                    <tr>
                        <td bgcolor="#1e293b" style="padding: 20px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="50%" valign="top">
                                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Mã đặt vé</p>
                                        <p style="margin: 0; font-size: 22px; color: #38bdf8; font-weight: bold; letter-spacing: 1px;"><?php echo e($booking->code); ?></p>
                                    </td>
                                    <td width="50%" valign="top" align="right">
                                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Hành khách</p>
                                        <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: bold;"><?php echo e($passengerName); ?></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== QUICK STATS ========== -->
                    <tr>
                        <td style="padding: 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="33%" align="center" style="padding: 20px 10px; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                                        <p style="margin: 0 0 8px 0; font-size: 24px;">🎫</p>
                                        <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Số vé</p>
                                        <p style="margin: 0; font-size: 20px; color: #1f2937; font-weight: bold;"><?php echo e($totalTickets); ?></p>
                                    </td>
                                    <td width="34%" align="center" style="padding: 20px 10px; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                                        <p style="margin: 0 0 8px 0; font-size: 24px;">🔄</p>
                                        <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Loại vé</p>
                                        <p style="margin: 0; font-size: 20px; color: #1f2937; font-weight: bold;"><?php echo e($tripType); ?></p>
                                    </td>
                                    <td width="33%" align="center" style="padding: 20px 10px; border-bottom: 1px solid #e5e7eb;">
                                        <p style="margin: 0 0 8px 0; font-size: 24px;">💳</p>
                                        <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Thanh toán</p>
                                        <p style="margin: 0; font-size: 20px; color: #10b981; font-weight: bold;">Đã TT</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== TRIPS SECTION ========== -->
                    <tr>
                        <td style="padding: 25px;">
                            
                            
                            <?php if($outboundLeg): ?>
                            <!-- Outbound Badge -->
                            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                                <tr>
                                    <td bgcolor="#6366f1" style="padding: 8px 18px; color: #ffffff; font-size: 13px; font-weight: bold;">
                                        🚌 CHIỀU ĐI
                                    </td>
                                </tr>
                            </table>

                            <!-- Outbound Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 2px solid #e5e7eb; margin-bottom: 25px;">
                                <!-- Route Row -->
                                <tr>
                                    <td bgcolor="#f9fafb" style="padding: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40%" valign="top">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đi</p>
                                                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: bold;"><?php echo e($outboundLeg->from_location->name ?? '—'); ?></p>
                                                </td>
                                                <td width="20%" align="center" valign="middle">
                                                    <p style="margin: 0; font-size: 24px; color: #6366f1;">→</p>
                                                </td>
                                                <td width="40%" valign="top" align="right">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đến</p>
                                                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: bold;"><?php echo e($outboundLeg->to_location->name ?? '—'); ?></p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Time Row -->
                                <tr>
                                    <td bgcolor="#1e293b" style="padding: 18px 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="50%" valign="top">
                                                    <p style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold; font-family: 'Courier New', monospace;"><?php echo e($formatTime($outboundLeg->trip->departure_time ?? $outboundLeg->depart_at)); ?></p>
                                                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;"><?php echo e($formatDate($outboundLeg->trip->departure_time ?? $outboundLeg->depart_at)); ?></p>
                                                </td>
                                                <td width="50%" valign="top" align="right">
                                                    <p style="margin: 0; font-size: 14px; color: #ffffff; font-weight: bold; text-transform: capitalize;"><?php echo e($formatWeekday($outboundLeg->trip->departure_time ?? $outboundLeg->depart_at)); ?></p>
                                                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">Ngày khởi hành</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Details Row -->
                                <tr>
                                    <td style="padding: 18px 20px; border-top: 2px dashed #e5e7eb;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="50%" style="padding-bottom: 15px;">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">💺</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Vị trí ghế</p>
                                                                <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e($seatList($outboundLeg)); ?></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="50%" style="padding-bottom: 15px;">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">🎫</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Số lượng</p>
                                                                <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e($seatCount($outboundLeg)); ?> vé</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="50%">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">📍</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đón</p>
                                                                <p style="margin: 0; font-size: 13px; color: #1f2937; font-weight: bold;"><?php echo e(\Illuminate\Support\Str::limit($outboundLeg->pickup_address ?? '-', 30)); ?></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="50%">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">🏁</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm trả</p>
                                                                <p style="margin: 0; font-size: 13px; color: #1f2937; font-weight: bold;"><?php echo e(\Illuminate\Support\Str::limit($outboundLeg->dropoff_address ?? '-', 30)); ?></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <?php endif; ?>

                            
                            <?php if($returnLeg): ?>
                            <!-- Return Badge -->
                            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                                <tr>
                                    <td bgcolor="#ec4899" style="padding: 8px 18px; color: #ffffff; font-size: 13px; font-weight: bold;">
                                        🏠 CHIỀU VỀ
                                    </td>
                                </tr>
                            </table>

                            <!-- Return Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 2px solid #e5e7eb; margin-bottom: 25px;">
                                <!-- Route Row -->
                                <tr>
                                    <td bgcolor="#f9fafb" style="padding: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40%" valign="top">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đi</p>
                                                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: bold;"><?php echo e($returnLeg->from_location->name ?? '—'); ?></p>
                                                </td>
                                                <td width="20%" align="center" valign="middle">
                                                    <p style="margin: 0; font-size: 24px; color: #ec4899;">→</p>
                                                </td>
                                                <td width="40%" valign="top" align="right">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đến</p>
                                                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: bold;"><?php echo e($returnLeg->to_location->name ?? '—'); ?></p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Time Row -->
                                <tr>
                                    <td bgcolor="#1e293b" style="padding: 18px 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="50%" valign="top">
                                                    <p style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold; font-family: 'Courier New', monospace;"><?php echo e($formatTime($returnLeg->trip->departure_time ?? $returnLeg->depart_at)); ?></p>
                                                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;"><?php echo e($formatDate($returnLeg->trip->departure_time ?? $returnLeg->depart_at)); ?></p>
                                                </td>
                                                <td width="50%" valign="top" align="right">
                                                    <p style="margin: 0; font-size: 14px; color: #ffffff; font-weight: bold; text-transform: capitalize;"><?php echo e($formatWeekday($returnLeg->trip->departure_time ?? $returnLeg->depart_at)); ?></p>
                                                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">Ngày khởi hành</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Details Row -->
                                <tr>
                                    <td style="padding: 18px 20px; border-top: 2px dashed #e5e7eb;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="50%" style="padding-bottom: 15px;">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">💺</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Vị trí ghế</p>
                                                                <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e($seatList($returnLeg)); ?></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="50%" style="padding-bottom: 15px;">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">🎫</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Số lượng</p>
                                                                <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e($seatCount($returnLeg)); ?> vé</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="50%">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">📍</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đón</p>
                                                                <p style="margin: 0; font-size: 13px; color: #1f2937; font-weight: bold;"><?php echo e(\Illuminate\Support\Str::limit($returnLeg->pickup_address ?? 'Thông báo qua SMS', 30)); ?></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="50%">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="35" valign="top" style="font-size: 18px;">🏁</td>
                                                            <td valign="top">
                                                                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm trả</p>
                                                                <p style="margin: 0; font-size: 13px; color: #1f2937; font-weight: bold;"><?php echo e(\Illuminate\Support\Str::limit($returnLeg->dropoff_address ?? 'Thông báo qua SMS', 30)); ?></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <?php endif; ?>

                        </td>
                    </tr>

                    <!-- ========== PRICE SECTION ========== -->
                    <tr>
                        <td style="padding: 0 25px 25px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 2px solid #e5e7eb;">
                                
                                <?php if($outboundLeg): ?>
                                <tr>
                                    <td style="padding: 15px 18px; border-bottom: 1px solid #e5e7eb;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 14px; color: #4b5563;">🚌 Chiều đi (<?php echo e($seatCount($outboundLeg)); ?> vé)</span>
                                                </td>
                                                <td align="right">
                                                    <span style="font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e(number_format($outboundLeg->total_price ?? 0)); ?> đ</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <?php endif; ?>

                                <?php if($returnLeg): ?>
                                <tr>
                                    <td style="padding: 15px 18px; border-bottom: 1px solid #e5e7eb;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 14px; color: #4b5563;">🏠 Chiều về (<?php echo e($seatCount($returnLeg)); ?> vé)</span>
                                                </td>
                                                <td align="right">
                                                    <span style="font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e(number_format($returnLeg->total_price ?? 0)); ?> đ</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <?php endif; ?>

                                <?php if(($booking->discount_amount ?? 0) > 0): ?>
                                <tr>
                                    <td style="padding: 15px 18px; border-bottom: 1px solid #e5e7eb;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 14px; color: #4b5563;">🎁 Giảm giá</span>
                                                </td>
                                                <td align="right">
                                                    <span style="font-size: 14px; color: #10b981; font-weight: bold;">-<?php echo e(number_format($booking->discount_amount)); ?> đ</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <?php endif; ?>

                                <!-- Total -->
                                <tr>
                                    <td bgcolor="#1e293b" style="padding: 18px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 16px; color: #94a3b8;">💰 Tổng thanh toán</span>
                                                </td>
                                                <td align="right">
                                                    <span style="font-size: 24px; color: #4ade80; font-weight: bold;"><?php echo e(number_format($booking->total_price ?? 0)); ?> đ</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== NOTES ========== -->
                    <tr>
                        <td style="padding: 0 25px 25px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fffbeb" style="border: 2px solid #fcd34d;">
                                <tr>
                                    <td style="padding: 18px;">
                                        <p style="margin: 0 0 15px 0; font-size: 15px; color: #92400e; font-weight: bold;">📌 Lưu ý quan trọng</p>
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 6px 0; font-size: 13px; color: #92400e;">
                                                    ✓ Vui lòng có mặt tại điểm đón trước giờ khởi hành <b>15-30 phút</b>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; font-size: 13px; color: #92400e;">
                                                    ✓ Mang theo <b>CCCD/CMND</b> và mã vé để xuất trình khi lên xe
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; font-size: 13px; color: #92400e;">
                                                    ✓ Liên hệ hotline nếu cần thay đổi hoặc hủy vé
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== FOOTER ========== -->
                    <tr>
                        <td bgcolor="#1e293b" style="padding: 30px; text-align: center;">
                            <p style="margin: 0 0 18px 0; font-size: 18px; color: #ffffff; font-weight: bold;">
                                Chúc bạn có chuyến đi an toàn &amp; vui vẻ! 🚌
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" align="center">
                                <tr>
                                    <td style="padding: 0 12px;">
                                        <span style="font-size: 13px; color: #94a3b8;">📞 Hotline: 1900 6688</span>
                                    </td>
                                    <td style="padding: 0 12px;">
                                        <span style="font-size: 13px; color: #94a3b8;">✉️ support@ducanhtransport.com</span>
                                    </td>
                                </tr>
                            </table>

                            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin-top: 20px; border-top: 1px solid #334155; padding-top: 20px;">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-size: 18px; color: #818cf8; font-weight: bold;">DucAnh Transport</p>
                                        <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">Đồng hành cùng bạn trên mọi nẻo đường</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- End Main Container -->

            </td>
        </tr>
    </table>
</body>
</html>
<?php /**PATH /Applications/MAMP/htdocs/DatVeXeKhach/backend/resources/views/emails/booking_success.blade.php ENDPATH**/ ?>