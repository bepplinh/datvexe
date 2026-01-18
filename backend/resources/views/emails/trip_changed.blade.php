<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo thay đổi chuyến xe</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                🔄 Thay đổi chuyến xe
                            </h1>
                            <p style="margin: 12px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                Mã đặt vé: <strong>#{{ $booking->code }}</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                                Xin chào <strong>{{ $booking->passenger_name ?? 'Quý khách' }}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                                Chuyến xe của bạn trong đơn đặt vé <strong>#{{ $booking->code }}</strong> đã được thay đổi thành công.
                            </p>

                            <!-- Change Info Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 12px; padding: 24px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="48%" style="text-align: center; padding: 16px; vertical-align: top;">
                                                    <p style="margin: 0 0 8px; font-size: 14px; color: #1e40af;">Chuyến cũ</p>
                                                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #dc2626; text-decoration: line-through;">
                                                        {{ $oldTripInfo }}
                                                    </p>
                                                </td>
                                                <td width="4%" style="text-align: center; vertical-align: middle;">
                                                    <span style="font-size: 24px; color: #3b82f6;">→</span>
                                                </td>
                                                <td width="48%" style="text-align: center; padding: 16px; vertical-align: top;">
                                                    <p style="margin: 0 0 8px; font-size: 14px; color: #065f46;">Chuyến mới</p>
                                                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #059669;">
                                                        {{ $newTripInfo }}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- New Trip Details -->
                            <h3 style="margin: 0 0 16px; font-size: 18px; color: #1f2937;">Thông tin chuyến xe mới</h3>
                            
                            @foreach ($booking->legs as $leg)
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                                <tr>
                                    <td style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px;">
                                        <p style="margin: 0 0 8px; font-size: 14px; color: #065f46; font-weight: 600;">
                                            {{ $leg->leg_type === 'RETURN' ? '↩️ Chiều về' : '➡️ Chiều đi' }}
                                        </p>
                                        <p style="margin: 0 0 12px; font-size: 18px; color: #1f2937; font-weight: 700;">
                                            {{ $leg->pickupLocation?->name ?? 'N/A' }} → {{ $leg->dropoffLocation?->name ?? 'N/A' }}
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding-right: 24px;">
                                                    <p style="margin: 0; font-size: 14px; color: #6b7280;">🚌 Khởi hành</p>
                                                    <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">
                                                        {{ $leg->trip?->departure_time?->format('H:i - d/m/Y') ?? 'N/A' }}
                                                    </p>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; font-size: 14px; color: #6b7280;">💺 Ghế</p>
                                                    <p style="margin: 4px 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">
                                                        {{ $leg->items->pluck('seat_label')->filter()->implode(', ') ?: 'N/A' }}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            @endforeach

                            <!-- Important Note -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                                <tr>
                                    <td style="background-color: #fef3c7; border-radius: 8px; padding: 16px;">
                                        <p style="margin: 0; font-size: 14px; color: #92400e;">
                                            ⚠️ <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ thông tin chuyến xe mới và có mặt tại điểm đón trước 15-30 phút.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                                Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hotline <strong>02373833552</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                                Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © {{ date('Y') }} DucAnh Transport. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
