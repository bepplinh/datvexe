import { useCheckout } from "../../../../contexts/CheckoutProvider";

function ConfirmationStep({ contactInfo, paymentMethod }) {
    const { resultBooking } = useCheckout();

    const paymentLabel =
        paymentMethod === "payos"
            ? "Thanh toán PayOS"
            : paymentMethod === "cash"
            ? "Thanh toán tiền mặt"
            : "Chưa chọn";

    const isSuccess = resultBooking?.success === true || resultBooking == null;
    const statusVariant = isSuccess ? "success" : "error";

    const resolvedMessage =
        resultBooking?.message ||
        (isSuccess
            ? "Đặt vé thành công! Chúng tôi sẽ liên hệ bạn trong thời gian sớm nhất."
            : "Đặt vé không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.");

    return (
        <div className="card confirmationCard">
            <div className="card__title">Xác nhận thông tin</div>
            <div className="confirmationCard__body">
                <div
                    className={`confirmationStatus confirmationStatus--${statusVariant}`}
                >
                    <div className="confirmationStatus__icon">
                        {isSuccess ? "✅" : "⚠️"}
                    </div>
                    <div className="confirmationStatus__text">
                        {resolvedMessage}
                    </div>
                </div>

                <div className="confirmationCard__section">
                    <div className="confirmationCard__label">Hành khách</div>
                    <div className="confirmationCard__value">
                        {contactInfo.name || "—"}
                    </div>
                </div>
                <div className="confirmationCard__section">
                    <div className="confirmationCard__label">Số điện thoại</div>
                    <div className="confirmationCard__value">
                        {`${contactInfo.countryCode || ""}${
                            contactInfo.phone || "—"
                        }`}
                    </div>
                </div>
                {contactInfo.isProxyBooking && (
                    <>
                        <div className="confirmationCard__section">
                            <div className="confirmationCard__label">
                                Người đặt hộ
                            </div>
                            <div className="confirmationCard__value">
                                {contactInfo.bookerName || "—"}
                            </div>
                        </div>
                        <div className="confirmationCard__section">
                            <div className="confirmationCard__label">
                                SĐT người đặt hộ
                            </div>
                            <div className="confirmationCard__value">
                                {contactInfo.bookerPhone || "—"}
                            </div>
                        </div>
                    </>
                )}
                <div className="confirmationCard__section">
                    <div className="confirmationCard__label">Điểm đón</div>
                    <div className="confirmationCard__value">
                        {contactInfo.pickup || "—"}
                    </div>
                </div>
                <div className="confirmationCard__section">
                    <div className="confirmationCard__label">Điểm trả</div>
                    <div className="confirmationCard__value">
                        {contactInfo.dropoff || "—"}
                    </div>
                </div>
                <div className="confirmationCard__section">
                    <div className="confirmationCard__label">
                        Hình thức thanh toán
                    </div>
                    <div className="confirmationCard__value">
                        {paymentLabel}
                    </div>
                </div>
                <div className="confirmationCard__note">
                    Vui lòng kiểm tra lại thông tin trước khi hoàn tất. Nhân
                    viên sẽ liên hệ bạn để xác nhận nếu cần.
                </div>
            </div>
        </div>
    );
}

export default ConfirmationStep;
