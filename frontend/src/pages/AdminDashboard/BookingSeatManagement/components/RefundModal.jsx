import React, { useState, useEffect } from "react";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { toast } from "react-toastify";
import CircularIndeterminate from "../../../../components/Loading/Loading";
import "./SeatMap.scss";

const RefundModal = ({
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
        refund_amount: "",
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
                
                // Tự động điền số tiền hoàn:
                // - Nếu có pending_refund_from_modification: đề xuất hoàn phần đó trước
                // - Nếu không: dùng suggested_refund_amount hoặc max_refundable
                const pendingRefund = response.data.pending_refund_from_modification || 0;
                const suggestedAmount = response.data.suggested_refund_amount || 0;
                const maxRefundable = response.data.max_refundable || 0;
                
                let amountToFill = '';
                
                if (pendingRefund > 0) {
                    // Ưu tiên: hoàn phần chênh lệch trước
                    // Có thể hoàn thêm nếu muốn (tối đa = max_refundable)
                    amountToFill = pendingRefund;
                } else if (suggestedAmount > 0) {
                    amountToFill = suggestedAmount;
                } else if (maxRefundable > 0) {
                    amountToFill = maxRefundable;
                }
                
                if (amountToFill) {
                    setFormData((prev) => ({
                        ...prev,
                        refund_amount: amountToFill,
                    }));
                } else {
                    setFormData((prev) => ({
                        ...prev,
                        refund_amount: '',
                    }));
                }
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
        }).format(amount || 0);
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: null,
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.refund_amount || formData.refund_amount <= 0) {
            newErrors.refund_amount = "Vui lòng nhập số tiền hoàn (lớn hơn 0)";
        } else if (
            refundPolicy &&
            formData.refund_amount > refundPolicy.max_refundable
        ) {
            newErrors.refund_amount = `Số tiền hoàn không được vượt quá ${formatCurrency(refundPolicy.max_refundable)}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (
            !window.confirm(
                `Xác nhận hoàn tiền ${formatCurrency(
                    formData.refund_amount
                )} cho booking ${bookingCode}?`
            )
        ) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                refund_amount: parseInt(formData.refund_amount),
                reason: formData.reason || null,
                bank_account: formData.bank_account || null,
                bank_name: formData.bank_name || null,
                transfer_date: formData.transfer_date || null,
                transfer_reference: formData.transfer_reference || null,
                note: formData.note || null,
            };

            const response = await adminBookingService.refund(bookingId, payload);

            if (response.success) {
                toast.success(response.message || "Hoàn tiền thành công!");
                if (onSuccess) {
                    onSuccess();
                }
                handleClose();
            } else {
                toast.error(response.message || "Có lỗi xảy ra khi hoàn tiền");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Có lỗi xảy ra khi hoàn tiền. Vui lòng thử lại.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            refund_amount: "",
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
                    <h3>Hoàn tiền - Booking {bookingCode}</h3>
                    <button
                        className="seat-map__booking-modal-close"
                        onClick={handleClose}
                        type="button"
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <div className="seat-map__booking-modal-body">
                    {policyLoading ? (
                        <div className="seat-map__refund-loading">
                            <CircularIndeterminate />
                            <p>Đang tải chính sách hoàn tiền...</p>
                        </div>
                    ) : (
                        <>
                            {refundPolicy && (
                                <div className="seat-map__refund-policy">
                                    <h4>Chính sách hoàn tiền</h4>
                                    <div className="seat-map__refund-policy-info">
                                        <div className="seat-map__refund-policy-item">
                                            <span className="label">
                                                Tổng tiền booking:
                                            </span>
                                            <span className="value amount">
                                                {formatCurrency(
                                                    refundPolicy.total_price || 0
                                                )}
                                            </span>
                                        </div>
                                        {refundPolicy.already_refunded > 0 && (
                                            <div className="seat-map__refund-policy-item">
                                                <span className="label">
                                                    Đã hoàn tiền:
                                                </span>
                                                <span className="value amount" style={{ color: '#e53e3e' }}>
                                                    {formatCurrency(
                                                        refundPolicy.already_refunded
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="seat-map__refund-policy-item">
                                            <span className="label">
                                                Thời gian đến giờ xuất bến:
                                            </span>
                                            <span className="value">
                                                {refundPolicy.hours_until_departure !==
                                                    null
                                                    ? `${refundPolicy.hours_until_departure} giờ`
                                                    : "Không xác định"}
                                            </span>
                                        </div>
                                        <div className="seat-map__refund-policy-item">
                                            <span className="label">
                                                Tỷ lệ hoàn tiền:
                                            </span>
                                            <span className="value">
                                                {refundPolicy.percent}%
                                            </span>
                                        </div>
                                        <div className="seat-map__refund-policy-item">
                                            <span className="label">
                                                Tổng đã thanh toán:
                                            </span>
                                            <span className="value amount">
                                                {formatCurrency(
                                                    refundPolicy.total_paid || refundPolicy.payment_amount || 0
                                                )}
                                            </span>
                                        </div>
                                        {refundPolicy.pending_refund_from_modification > 0 && (
                                            <div className="seat-map__refund-policy-item">
                                                <span className="label">
                                                    Chênh lệch cần hoàn (từ đổi chuyến):
                                                </span>
                                                <span className="value amount" style={{ color: '#ed8936' }}>
                                                    {formatCurrency(
                                                        refundPolicy.pending_refund_from_modification
                                                    )}
                                                </span>
                                                <span className="note" style={{ fontSize: '0.85rem', color: '#6c757d', marginLeft: '0.5rem' }}>
                                                    (Chưa hoàn thực tế)
                                                </span>
                                            </div>
                                        )}
                                        {refundPolicy.already_refunded > 0 && (
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
                                        <div className="seat-map__refund-policy-item">
                                            <span className="label">
                                                Số tiền có thể hoàn tối đa:
                                            </span>
                                            <span className="value amount">
                                                {formatCurrency(
                                                    refundPolicy.max_refundable
                                                )}
                                            </span>
                                        </div>
                                        {refundPolicy.pending_refund_from_modification > 0 && (
                                            <div className="seat-map__refund-policy-item" style={{ 
                                                background: '#fff3cd', 
                                                border: '1px solid #ffc107',
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                marginTop: '0.5rem'
                                            }}>
                                                <span className="label" style={{ fontWeight: 700, color: '#856404' }}>
                                                    💡 Lưu ý:
                                                </span>
                                                <span className="value" style={{ fontSize: '0.9rem', color: '#856404', marginTop: '0.25rem', display: 'block' }}>
                                                    Có {formatCurrency(refundPolicy.pending_refund_from_modification)} chênh lệch từ đổi chuyến chưa được hoàn. 
                                                    Bạn có thể hoàn phần này hoặc hoàn thêm nếu muốn.
                                                </span>
                                            </div>
                                        )}
                                        {refundPolicy.suggested_refund_amount >
                                            0 && (
                                            <div className="seat-map__refund-policy-item">
                                                <span className="label">
                                                    Số tiền đề xuất (theo chính sách):
                                                </span>
                                                <span className="value amount suggested">
                                                    {formatCurrency(
                                                        refundPolicy.suggested_refund_amount
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
                                            Số tiền hoàn (VND) <span className="required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="refund_amount"
                                            value={formData.refund_amount}
                                            onChange={handleInputChange}
                                            placeholder="Nhập số tiền hoàn"
                                            min="1"
                                            max={
                                                refundPolicy?.max_refundable ||
                                                999999999
                                            }
                                            required
                                            disabled={loading}
                                        />
                                        {errors.refund_amount && (
                                            <span className="error">
                                                {errors.refund_amount}
                                            </span>
                                        )}
                                    </div>

                                    <div className="seat-map__refund-form-group">
                                        <label>Lý do hoàn tiền</label>
                                        <textarea
                                            name="reason"
                                            value={formData.reason}
                                            onChange={handleInputChange}
                                            placeholder="Nhập lý do hoàn tiền (tùy chọn)"
                                            rows="3"
                                            maxLength="500"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="seat-map__refund-form-section">
                                        <h4>Thông tin chuyển khoản (tùy chọn)</h4>
                                        <div className="seat-map__refund-form-row">
                                            <div className="seat-map__refund-form-group">
                                                <label>Số tài khoản</label>
                                                <input
                                                    type="text"
                                                    name="bank_account"
                                                    value={formData.bank_account}
                                                    onChange={handleInputChange}
                                                    placeholder="Số tài khoản đã chuyển"
                                                    maxLength="100"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="seat-map__refund-form-group">
                                                <label>Tên ngân hàng</label>
                                                <input
                                                    type="text"
                                                    name="bank_name"
                                                    value={formData.bank_name}
                                                    onChange={handleInputChange}
                                                    placeholder="VD: Vietcombank"
                                                    maxLength="100"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                        <div className="seat-map__refund-form-row">
                                            <div className="seat-map__refund-form-group">
                                                <label>Ngày chuyển khoản</label>
                                                <input
                                                    type="date"
                                                    name="transfer_date"
                                                    value={formData.transfer_date}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="seat-map__refund-form-group">
                                                <label>Mã tham chiếu</label>
                                                <input
                                                    type="text"
                                                    name="transfer_reference"
                                                    value={
                                                        formData.transfer_reference
                                                    }
                                                    onChange={handleInputChange}
                                                    placeholder="Mã giao dịch ngân hàng"
                                                    maxLength="100"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                        <div className="seat-map__refund-form-group">
                                            <label>Ghi chú</label>
                                            <textarea
                                                name="note"
                                                value={formData.note}
                                                onChange={handleInputChange}
                                                placeholder="Ghi chú thêm (tùy chọn)"
                                                rows="2"
                                                maxLength="1000"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="seat-map__booking-modal-footer">
                                    <button
                                        type="button"
                                        className="seat-map__booking-modify-btn seat-map__booking-modify-btn--cancel"
                                        onClick={handleClose}
                                        disabled={loading}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="seat-map__booking-modify-btn seat-map__booking-modify-btn--refund"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Đang xử lý..."
                                            : "Xác nhận hoàn tiền"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RefundModal;

