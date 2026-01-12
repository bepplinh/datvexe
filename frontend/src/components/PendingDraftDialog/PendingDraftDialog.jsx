import { useState, useEffect } from "react";
import "./PendingDraftDialog.scss";

const formatCurrency = (value = 0) =>
    `${new Intl.NumberFormat("vi-VN").format(value)} đ`;

function PendingDraftDialog({ pendingDraft, onContinue, onNewBooking, isLoading }) {
    const [timeLeft, setTimeLeft] = useState(null);

    // Khởi tạo countdown từ expires_at
    useEffect(() => {
        if (!pendingDraft?.expires_at) return;

        const calculateTimeLeft = () => {
            const expiresAt = new Date(pendingDraft.expires_at).getTime();
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
            return diff;
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            // Tự động đóng dialog khi hết thời gian
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [pendingDraft?.expires_at]);

    if (!pendingDraft) return null;

    const { trips, pricing } = pendingDraft;

    // Format thời gian còn lại
    const formatTimeLeft = (seconds) => {
        if (seconds === null || seconds <= 0) return "Đã hết hạn";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const isExpired = timeLeft !== null && timeLeft <= 0;

    return (
        <div className="pending-draft-dialog">
            <div className="pending-draft-dialog__backdrop" onClick={onNewBooking} />
            <div className="pending-draft-dialog__content">
                <div className="pending-draft-dialog__header">
                    <h3>Bạn có đơn đặt vé đang chờ thanh toán</h3>
                    <p className={`pending-draft-dialog__expire ${isExpired ? 'pending-draft-dialog__expire--expired' : ''}`}>
                        {isExpired ? (
                            <span className="pending-draft-dialog__expired-text">Đơn đã hết hạn</span>
                        ) : (
                            <>
                                Còn <strong className="pending-draft-dialog__countdown">{formatTimeLeft(timeLeft)}</strong> để hoàn tất
                            </>
                        )}
                    </p>
                </div>

                <div className="pending-draft-dialog__body">
                    {trips?.map((trip, index) => (
                        <div key={index} className="pending-draft-dialog__trip">
                            <div className="pending-draft-dialog__leg">
                                {trip.leg === "OUT" ? "Chiều đi" : trip.leg === "RETURN" ? "Chiều về" : "Chuyến xe"}
                            </div>
                            <div className="pending-draft-dialog__route">
                                {trip.route?.from} → {trip.route?.to}
                            </div>
                            <div className="pending-draft-dialog__seats">
                                Ghế: {trip.seats?.map((s) => s.label).join(", ")}
                            </div>
                            <div className="pending-draft-dialog__price">
                                {formatCurrency(trip.total_price)}
                            </div>
                        </div>
                    ))}

                    <div className="pending-draft-dialog__total">
                        <span>Tổng tiền:</span>
                        <strong>{formatCurrency(pricing?.total)}</strong>
                    </div>
                </div>

                <div className="pending-draft-dialog__actions">
                    <button
                        className="pending-draft-dialog__btn pending-draft-dialog__btn--secondary"
                        onClick={onNewBooking}
                        disabled={isLoading}
                    >
                        Đặt vé mới
                    </button>
                    <button
                        className="pending-draft-dialog__btn pending-draft-dialog__btn--primary"
                        onClick={onContinue}
                        disabled={isLoading || isExpired}
                    >
                        {isExpired ? "Đã hết hạn" : "Tiếp tục đơn cũ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PendingDraftDialog;
