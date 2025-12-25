import { useEffect, useState } from "react";
import { formatCurrency } from "../../../../utils/formatCurrency";

const PAYMENT_OPTIONS = [
    {
        value: "cash",
        title: "Thanh toán tiền mặt",
        description:
            "Thanh toán trực tiếp với nhà xe khi lên xe hoặc tại quầy.",
    },
    {
        value: "payos",
        title: "Thanh toán PayOS",
        description: "Thanh toán online qua PayOS để giữ vé nhanh chóng.",
    },
];

function PaymentStep({
    selectedMethod,
    onSelect,
    couponCode,
    onCouponChange,
    couponMessage,
    isCouponChecking,
    isCouponValid,
}) {
    const [couponValue, setCouponValue] = useState(couponCode || "");

    useEffect(() => {
        setCouponValue(couponCode || "");
    }, [couponCode]);

    const handleCouponChange = (event) => {
        const value = event.target.value;
        setCouponValue(value);
        onCouponChange?.(value);
    };


    return (
        <div className="card">
            <div className="card__title">Chọn phương thức thanh toán</div>
            <div className="paymentOptions">
                {PAYMENT_OPTIONS.map((option) => (
                    <label
                        key={option.value}
                        className={`paymentOption ${selectedMethod === option.value
                            ? "paymentOption--active"
                            : ""
                            }`}
                    >
                        <input
                            type="radio"
                            name="paymentMethod"
                            value={option.value}
                            checked={selectedMethod === option.value}
                            onChange={() => onSelect?.(option.value)}
                        />
                        <div className="paymentOption__content">
                            <div className="paymentOption__title">
                                {option.title}
                            </div>
                            <div className="paymentOption__desc">
                                {option.description}
                            </div>
                        </div>
                    </label>
                ))}
            </div>
            <div className="couponInput">
                <div className="couponInput__header">
                    <div className="couponInput__label">Mã giảm giá</div>
                    <div className="couponInput__hint">
                        Nhập mã ưu đãi (nếu có) để giảm giá vé.
                    </div>
                </div>
                <div className="couponInput__field">
                    <span className="couponInput__icon" aria-hidden="true">
                        🏷️
                    </span>
                    <input
                        className="couponInput__input"
                        type="text"
                        name="coupon"
                        placeholder="VD: SALE50"
                        value={couponValue}
                        autoComplete="off"
                        onChange={handleCouponChange}
                    />
                </div>
                {couponMessage && (
                    <div
                        className={`couponInput__feedback ${isCouponChecking
                            ? "couponInput__feedback--info"
                            : isCouponValid
                                ? "couponInput__feedback--success"
                                : "couponInput__feedback--error"
                            }`}
                    >
                        {couponMessage}
                    </div>
                )}
            </div>

        </div>
    );
}

export default PaymentStep;
