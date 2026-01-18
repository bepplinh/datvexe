<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo thay đổi ghế</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                💺 Thay đổi ghế ngồi
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
                                Ghế ngồi của bạn trong đơn đặt vé <strong>#{{ $booking->code }}</strong> đã được thay đổi thành công.
                            </p>

                            <!-- Change Info Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 24px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="48%" style="text-align: center; padding: 16px;">
                                                    <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">Ghế cũ</p>
                                                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #b45309; text-decoration: line-through;">
                                                        {{ $oldSeats }}
                                                    </p>
                                                </td>
                                                <td width="4%" style="text-align: center; vertical-align: middle;">
                                                    <span style="font-size: 24px; color: #d97706;">→</span>
                                                </td>
                                                <td width="48%" style="text-align: center; padding: 16px;">
                                                    <p style="margin: 0 0 8px; font-size: 14px; color: #065f46;">Ghế mới</p>
                                                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">
                                                        {{ $newSeats }}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Trip Info -->
                            @foreach ($booking->legs as $leg)
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background-color: #f3f4f6; border-radius: 12px; padding: 20px;">
                                        <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
                                            {{ $leg->leg_type === 'RETURN' ? 'Chiều về' : 'Chiều đi' }}
                                        </p>
                                        <p style="margin: 0 0 8px; font-size: 16px; color: #1f2937; font-weight: 600;">
                                            {{ $leg->pickupLocation?->name ?? 'N/A' }} → {{ $leg->dropoffLocation?->name ?? 'N/A' }}
                                        </p>
                                        <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                            🚌 Khởi hành: {{ $leg->trip?->departure_time?->format('H:i - d/m/Y') ?? 'N/A' }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            @endforeach

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
