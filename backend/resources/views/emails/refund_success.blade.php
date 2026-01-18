<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận hoàn tiền</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                💰 Hoàn tiền thành công
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
                                Chúng tôi xác nhận đã hoàn tiền thành công cho đơn đặt vé <strong>#{{ $booking->code }}</strong>.
                            </p>

                            <!-- Refund Amount Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-radius: 16px; padding: 32px; text-align: center;">
                                        <p style="margin: 0 0 8px; font-size: 16px; color: #065f46;">Số tiền hoàn</p>
                                        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #059669;">
                                            {{ number_format($refundAmount, 0, ',', '.') }} đ
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Booking Info -->
                            <h3 style="margin: 0 0 16px; font-size: 18px; color: #1f2937;">Thông tin đơn hàng</h3>
                            
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background-color: #f3f4f6; border-radius: 12px; padding: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="font-size: 14px; color: #6b7280;">Mã đặt vé:</span>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                    <span style="font-size: 14px; color: #1f2937; font-weight: 600;">#{{ $booking->code }}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="font-size: 14px; color: #6b7280;">Tổng giá vé:</span>
                                                </td>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                                                    <span style="font-size: 14px; color: #1f2937; font-weight: 600;">{{ number_format($booking->total_price, 0, ',', '.') }} đ</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 14px; color: #6b7280;">Số tiền hoàn:</span>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right;">
                                                    <span style="font-size: 14px; color: #059669; font-weight: 700;">{{ number_format($refundAmount, 0, ',', '.') }} đ</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Timeline -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background-color: #eff6ff; border-radius: 8px; padding: 16px;">
                                        <p style="margin: 0; font-size: 14px; color: #1e40af;">
                                            ⏱️ <strong>Thời gian hoàn tiền:</strong> Tiền sẽ được chuyển về tài khoản của bạn trong vòng <strong>3-5 ngày làm việc</strong>.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                                Nếu bạn có bất kỳ thắc mắc nào về việc hoàn tiền, vui lòng liên hệ với chúng tôi qua hotline <strong>02373833552</strong>.
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
