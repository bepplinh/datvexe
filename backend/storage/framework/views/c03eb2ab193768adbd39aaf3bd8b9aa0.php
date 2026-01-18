<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Nhắc nhở chuyến xe</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: Arial, Helvetica, sans-serif;">
    <?php
        $trip = $leg->trip;
        $booking = $leg->booking;
        
        $formatTime = fn($date) => $date ? \Carbon\Carbon::parse($date)->format('H:i') : '--:--';
        $formatDate = fn($date) => $date ? \Carbon\Carbon::parse($date)->format('d/m/Y') : '--/--/----';
        $formatWeekday = fn($date) => $date ? \Carbon\Carbon::parse($date)->locale('vi')->isoFormat('dddd') : '--';
        
        $seatList = $leg->items?->pluck('seat.seat_number')->filter()->implode(', ') ?: '—';
        $seatCount = $leg->items?->count() ?: 0;
        
        $passengerName = $booking->passenger_name ?: optional($booking->user)->name ?: 'Quý khách';
        $departureTime = $trip?->departure_time;
        
        // Calculate time remaining
        $now = now();
        $hoursRemaining = $departureTime ? round($departureTime->diffInMinutes($now) / 60, 1) : 0;
    ?>

    <!-- Outer Table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f9;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                
                <!-- Main Container 600px -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e0e0e0;">
                    
                    <!-- ========== HEADER ========== -->
                    <tr>
                        <td align="center" bgcolor="#f59e0b" style="padding: 35px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="font-size: 50px; color: #ffffff;">⏰</td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px;">
                                        <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: bold;">Chuyến xe sắp khởi hành!</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 8px;">
                                        <p style="margin: 0; font-size: 14px; color: #fef3c7;">Còn khoảng <?php echo e($hoursRemaining); ?> giờ nữa là đến giờ khởi hành</p>
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

                    <!-- ========== DEPARTURE TIME HIGHLIGHT ========== -->
                    <tr>
                        <td style="padding: 25px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 3px solid #f59e0b; background-color: #fffbeb;">
                                <tr>
                                    <td style="padding: 25px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e; text-transform: uppercase; letter-spacing: 2px;">Giờ khởi hành</p>
                                        <p style="margin: 0; font-size: 42px; color: #b45309; font-weight: bold; font-family: 'Courier New', monospace;"><?php echo e($formatTime($departureTime)); ?></p>
                                        <p style="margin: 10px 0 0 0; font-size: 16px; color: #92400e;"><?php echo e($formatWeekday($departureTime)); ?>, <?php echo e($formatDate($departureTime)); ?></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== TRIP DETAILS ========== -->
                    <tr>
                        <td style="padding: 0 25px 25px 25px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 2px solid #e5e7eb;">
                                <!-- Route Row -->
                                <tr>
                                    <td bgcolor="#f9fafb" style="padding: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40%" valign="top">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đi</p>
                                                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: bold;"><?php echo e($leg->pickupLocation?->name ?? $booking->origin_location_id ?? '—'); ?></p>
                                                </td>
                                                <td width="20%" align="center" valign="middle">
                                                    <p style="margin: 0; font-size: 24px; color: #f59e0b;">→</p>
                                                </td>
                                                <td width="40%" valign="top" align="right">
                                                    <p style="margin: 0 0 4px 0; font-size: 10px; color: #6b7280; text-transform: uppercase;">Điểm đến</p>
                                                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: bold;"><?php echo e($leg->dropoffLocation?->name ?? $booking->destination_location_id ?? '—'); ?></p>
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
                                                                <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e($seatList); ?></p>
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
                                                                <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: bold;"><?php echo e($seatCount); ?> vé</p>
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
                                                                <p style="margin: 0; font-size: 13px; color: #1f2937; font-weight: bold;"><?php echo e(\Illuminate\Support\Str::limit($leg->pickup_address ?? '-', 30)); ?></p>
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
                                                                <p style="margin: 0; font-size: 13px; color: #1f2937; font-weight: bold;"><?php echo e(\Illuminate\Support\Str::limit($leg->dropoff_address ?? '-', 30)); ?></p>
                                                            </td>
                                                        </tr>
                                                    </table>
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
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#fef2f2" style="border: 2px solid #fecaca;">
                                <tr>
                                    <td style="padding: 18px;">
                                        <p style="margin: 0 0 15px 0; font-size: 15px; color: #991b1b; font-weight: bold;">📌 Lưu ý quan trọng</p>
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 6px 0; font-size: 13px; color: #991b1b;">
                                                    ✓ Vui lòng có mặt tại điểm đón trước giờ khởi hành <b>15-30 phút</b>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; font-size: 13px; color: #991b1b;">
                                                    ✓ Mang theo <b>CCCD/CMND</b> và mã vé để xuất trình khi lên xe
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; font-size: 13px; color: #991b1b;">
                                                    ✓ Liên hệ hotline ngay nếu có bất kỳ thay đổi nào
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== CTA BUTTON ========== -->
                    <tr>
                        <td style="padding: 0 25px 25px 25px;" align="center">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td bgcolor="#10b981" style="padding: 15px 40px; border-radius: 8px;">
                                        <a href="<?php echo e(config('app.frontend_url')); ?>/tickets" style="color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block;">
                                            Xem chi tiết vé của bạn
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ========== FOOTER ========== -->
                    <tr>
                        <td bgcolor="#1e293b" style="padding: 30px; text-align: center;">
                            <p style="margin: 0 0 18px 0; font-size: 18px; color: #ffffff; font-weight: bold;">
                                Chúc bạn có chuyến đi an toàn & vui vẻ! 🚌
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
<?php /**PATH /Applications/MAMP/htdocs/DatVeXeKhach/backend/resources/views/emails/trip_reminder.blade.php ENDPATH**/ ?>