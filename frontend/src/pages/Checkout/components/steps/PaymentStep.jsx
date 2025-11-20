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

function PaymentStep({ selectedMethod, onSelect }) {
    return (
        <div className="card">
            <div className="card__title">Chọn phương thức thanh toán</div>
            <div className="paymentOptions">
                {PAYMENT_OPTIONS.map((option) => (
                    <label
                        key={option.value}
                        className={`paymentOption ${
                            selectedMethod === option.value
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
        </div>
    );
}

export default PaymentStep;
