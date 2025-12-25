import React, { useState } from "react";
import { X } from "lucide-react";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { toast } from "react-toastify";
import RefundModal from "../../BookingSeatManagement/components/RefundModal";
import "./PaymentDetailModal.scss";

const PaymentDetailModal = ({ payment, onClose, onRefundSuccess }) => {
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    if (!payment) return null;

    const booking = payment.booking || {};
    const canRefund =
        payment.status === "succeeded" &&
        booking.status === "paid" &&
        (payment.refund_amount || 0) < (payment.amount || 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getProviderLabel = (provider) => {
        const labels = {
            payos: "PayOS",
            vnpay: "VNPay",
            momo: "MoMo",
            cash: "Tiền mặt",
            bank_transfer: "Chuyển khoản",
        };
        return labels[provider] || provider || "-";
    };

    const getStatusConfig = (status) => {
        const configs = {
            paid: { label: "Đã thanh toán", class: "status-success" },
            pending: { label: "Chờ thanh toán", class: "status-warning" },
            cancelled: { label: "Đã hủy", class: "status-danger" },
            failed: { label: "Thất bại", class: "status-danger" },
        };
        return (
            configs[status] || { label: status, class: "status-default" }
        );
    };

    const statusConfig = getStatusConfig(booking.status || "pending");

    return (
        <div className="payment-detail-modal-overlay" onClick={onClose}>
            <div
                className="payment-detail-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="payment-detail-modal__header">
                    <h2>Chi tiết thanh toán</h2>
                    <button
                        className="payment-detail-modal__close"
                        onClick={onClose}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="payment-detail-modal__content">
                    <div className="payment-detail-modal__section">
                        <h3>Thông tin thanh toán</h3>
                        <div className="payment-detail-modal__grid">
                            <div className="payment-detail-modal__field">
                                <label>ID Thanh toán</label>
                                <span>{payment.id}</span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Số tiền</label>
                                <span className="amount">
                                    {formatCurrency(payment.amount)}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Phương thức thanh toán</label>
                                <span className="provider">
                                    {getProviderLabel(payment.provider)}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Mã giao dịch</label>
                                <span className="transaction-id">
                                    {payment.transaction_id || "-"}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Thời gian thanh toán</label>
                                <span>{formatDate(payment.payment_time)}</span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Trạng thái</label>
                                <span
                                    className={`status ${statusConfig.class}`}
                                >
                                    {statusConfig.label}
                                </span>
                            </div>
                            {payment.refund_amount > 0 && (
                                <div className="payment-detail-modal__field">
                                    <label>Đã hoàn tiền</label>
                                    <span className="amount refunded">
                                        {formatCurrency(payment.refund_amount)}
                                    </span>
                                </div>
                            )}
                            {payment.refund_amount > 0 && (
                                <div className="payment-detail-modal__field">
                                    <label>Còn lại</label>
                                    <span className="amount remaining">
                                        {formatCurrency(
                                            (payment.amount || 0) -
                                                (payment.refund_amount || 0)
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="payment-detail-modal__section">
                        <h3>Thông tin đặt vé</h3>
                        <div className="payment-detail-modal__grid">
                            <div className="payment-detail-modal__field">
                                <label>Mã đặt vé</label>
                                <span className="booking-code">
                                    {booking.code || "-"}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Tên khách hàng</label>
                                <span>
                                    {booking.passenger_name ||
                                        booking.user?.name ||
                                        booking.user?.username ||
                                        "-"}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Số điện thoại</label>
                                <span>{booking.passenger_phone || "-"}</span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Email</label>
                                <span>
                                    {booking.passenger_email ||
                                        booking.user?.email ||
                                        "-"}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Tổng tiền đặt vé</label>
                                <span className="amount">
                                    {formatCurrency(booking.total_price)}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Giảm giá</label>
                                <span>
                                    {formatCurrency(booking.discount_amount)}
                                </span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Ngày đặt</label>
                                <span>{formatDate(booking.created_at)}</span>
                            </div>
                            <div className="payment-detail-modal__field">
                                <label>Ngày thanh toán</label>
                                <span>{formatDate(booking.paid_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="payment-detail-modal__footer">
                    {canRefund && (
                        <button
                            className="payment-detail-modal__btn-refund"
                            onClick={() => {
                                if (!booking.id) {
                                    toast.error(
                                        "Không tìm thấy thông tin booking"
                                    );
                                    return;
                                }
                                setIsRefundModalOpen(true);
                            }}
                        >
                            Hoàn tiền
                        </button>
                    )}
                    <button
                        className="payment-detail-modal__btn-close"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>

            {isRefundModalOpen && booking.id && (
                <RefundModal
                    isOpen={isRefundModalOpen}
                    onClose={() => setIsRefundModalOpen(false)}
                    bookingId={booking.id}
                    bookingCode={booking.code}
                    onSuccess={() => {
                        if (onRefundSuccess) {
                            onRefundSuccess();
                        }
                        onClose();
                    }}
                />
            )}
        </div>
    );
};

export default PaymentDetailModal;

