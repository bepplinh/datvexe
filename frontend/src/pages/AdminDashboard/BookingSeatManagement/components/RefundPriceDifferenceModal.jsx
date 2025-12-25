import React, { useState, useEffect } from "react";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { toast } from "react-toastify";
import CircularIndeterminate from "../../../../components/Loading/Loading";
import "./SeatMap.scss";

const RefundPriceDifferenceModal = ({
    isOpen,
    onClose,
    bookingId,
    bookingCode,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [policyLoading, setPolicyLoading] = useState(false);
    const [refundPolicy, setRefundPolicy] = useState(null);
    const [formData, setFormData] = useState({
        reason: "",
        bank_account: "",
        bank_name: "",
        transfer_date: "",
        transfer_reference: "",
        note: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && bookingId) {
            loadRefundPolicy();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, bookingId]);

    const loadRefundPolicy = async () => {
        if (!bookingId) return;

        try {
            setPolicyLoading(true);
            const response = await adminBookingService.getRefundPolicy(bookingId);

            if (response.success && response.data) {
                setRefundPolicy(response.data);
            }
        } catch (error) {
            console.error("Error loading refund policy:", error);
            toast.error("Không thể tải chính sách hoàn tiền");
        } finally {
            setPolicyLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: null,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const pendingRefund = refundPolicy?.pending_refund_from_modification || 0;
        if (pendingRefund <= 0) {
            toast.error("Không có chênh lệch cần hoàn từ booking modification.");
            return;
        }

        if (
            !window.confirm(
                `Xác nhận hoàn tiền chênh lệch ${formatCurrency(
                    pendingRefund
                )} cho booking ${bookingCode}?`
            )
        ) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                reason: formData.reason || null,
                bank_account: formData.bank_account || null,
                bank_name: formData.bank_name || null,
                transfer_date: formData.transfer_date || null,
                transfer_reference: formData.transfer_reference || null,
                note: formData.note || null,
            };

            const response = await adminBookingService.refundPriceDifference(
                bookingId,
                payload
            );

            if (response.success) {
                toast.success(
                    response.message || "Hoàn tiền chênh lệch thành công!"
                );
                if (onSuccess) {
                    onSuccess();
                }
                handleClose();
            } else {
                toast.error(
                    response.message || "Có lỗi xảy ra khi hoàn tiền chênh lệch"
                );
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Có lỗi xảy ra khi hoàn tiền chênh lệch. Vui lòng thử lại.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            reason: "",
            bank_account: "",
            bank_name: "",
            transfer_date: "",
            transfer_reference: "",
            note: "",
        });
        setErrors({});
        setRefundPolicy(null);
        onClose();
    };

    if (!isOpen) return null;

    const pendingRefund = refundPolicy?.pending_refund_from_modification || 0;

    return (
        <div
            className="seat-map__booking-modal-overlay"
            onClick={handleClose}
        >
            <div
                className="seat-map__booking-modal seat-map__booking-modal--refund"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="seat-map__booking-modal-header">
                    <h3>Hoàn tiền chênh lệch</h3>
                    <button
                        type="button"
                        className="seat-map__booking-modal-close"
                        onClick={handleClose}
                    >
                        ×
                    </button>
                </div>

                <div className="seat-map__booking-modal-body">
                    {policyLoading ? (
                        <div style={{ textAlign: "center", padding: "1.5rem" }}>
                            <CircularIndeterminate />
                        </div>
                    ) : (
                        <>
                            {pendingRefund <= 0 ? (
                                <div className="seat-map__refund-warning-box">
                                    Không có chênh lệch cần hoàn từ booking
                                    modification.
                                </div>
                            ) : (
                                <>
                                    <div className="seat-map__refund-info-box">
                                        <h4>
                                            Thông tin hoàn tiền chênh lệch
                                        </h4>
                                        <div className="seat-map__refund-amount">
                                            Số tiền cần hoàn:{" "}
                                            {formatCurrency(pendingRefund)}
                                        </div>
                                        <div className="seat-map__refund-description">
                                            Đây là số tiền chênh lệch từ việc đổi
                                            chuyến (giá giảm) chưa được hoàn.
                                        </div>
                                    </div>

                                    {refundPolicy && (
                                        <div className="seat-map__refund-policy">
                                            <h4>Thông tin thanh toán</h4>
                                            <div className="seat-map__refund-policy-info">
                                                <div className="seat-map__refund-policy-item">
                                                    <span className="label">
                                                        Tổng tiền booking:
                                                    </span>
                                                    <span className="value amount">
                                                        {formatCurrency(
                                                            refundPolicy.total_price ||
                                                                0
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="seat-map__refund-policy-item">
                                                    <span className="label">
                                                        Tổng đã thanh toán:
                                                    </span>
                                                    <span className="value amount">
                                                        {formatCurrency(
                                                            refundPolicy.total_paid ||
                                                                refundPolicy.payment_amount ||
                                                                0
                                                        )}
                                                    </span>
                                                </div>
                                                {refundPolicy.already_refunded >
                                                    0 && (
                                                    <div className="seat-map__refund-policy-item">
                                                        <span className="label">
                                                            Đã hoàn tiền thực tế:
                                                        </span>
                                                        <span className="value amount" style={{ color: '#e53e3e' }}>
                                                            {formatCurrency(
                                                                refundPolicy.already_refunded
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="seat-map__refund-form">
                                            <div className="seat-map__refund-form-group">
                                                <label>
                                                    Lý do hoàn tiền (tùy chọn)
                                                </label>
                                                <textarea
                                                    name="reason"
                                                    value={formData.reason}
                                                    onChange={handleChange}
                                                    rows={3}
                                                    placeholder="Nhập lý do hoàn tiền..."
                                                />
                                            </div>

                                            <div className="seat-map__refund-form-group">
                                                <label>
                                                    Thông tin chuyển khoản (tùy chọn)
                                                </label>
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "1fr 1fr",
                                                        gap: "0.625rem",
                                                    }}
                                                >
                                                    <div>
                                                        <input
                                                            type="text"
                                                            name="bank_account"
                                                            value={
                                                                formData.bank_account
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            placeholder="Số tài khoản"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            name="bank_name"
                                                            value={
                                                                formData.bank_name
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            placeholder="Tên ngân hàng"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="date"
                                                            name="transfer_date"
                                                            value={
                                                                formData.transfer_date
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            placeholder="Ngày chuyển"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            name="transfer_reference"
                                                            value={
                                                                formData.transfer_reference
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            placeholder="Mã tham chiếu"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="seat-map__refund-form-group">
                                                <label>
                                                    Ghi chú (tùy chọn)
                                                </label>
                                                <textarea
                                                    name="note"
                                                    value={formData.note}
                                                    onChange={handleChange}
                                                    rows={2}
                                                    placeholder="Nhập ghi chú..."
                                                />
                                            </div>
                                        </div>

                                        <div className="seat-map__booking-modal-footer">
                                            <button
                                                type="button"
                                                className="seat-map__booking-cancel-btn"
                                                onClick={handleClose}
                                                disabled={loading}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                className="seat-map__booking-submit-btn"
                                                disabled={loading || pendingRefund <= 0}
                                            >
                                                {loading
                                                    ? "Đang xử lý..."
                                                    : "Xác nhận hoàn tiền chênh lệch"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RefundPriceDifferenceModal;

