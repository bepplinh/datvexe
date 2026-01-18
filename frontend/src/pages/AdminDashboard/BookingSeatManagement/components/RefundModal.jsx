import React, { useState, useEffect } from "react";
import { adminBookingService } from "../../../../services/admin/bookingService";
import { toast } from "react-toastify";
import CircularIndeterminate from "../../../../components/Loading/Loading";
import "./RefundModal.scss";

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

                const pendingRefund = response.data.pending_refund_from_modification || 0;
                const suggestedAmount = response.data.suggested_refund_amount || 0;
                const maxRefundable = response.data.max_refundable || 0;

                let amountToFill = '';

                if (pendingRefund > 0) {
                    amountToFill = pendingRefund;
                } else if (suggestedAmount > 0) {
                    amountToFill = suggestedAmount;
                } else if (maxRefundable > 0) {
                    amountToFill = maxRefundable;
                }

                setFormData((prev) => ({
                    ...prev,
                    refund_amount: amountToFill || '',
                }));
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

    const formatHoursToHoursMinutes = (decimalHours) => {
        if (decimalHours === null || decimalHours === undefined) {
            return "Không xác định";
        }
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        if (hours === 0) return `${minutes} phút`;
        if (minutes === 0) return `${hours} giờ`;
        return `${hours} giờ ${minutes} phút`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.refund_amount || formData.refund_amount <= 0) {
            newErrors.refund_amount = "Vui lòng nhập số tiền hoàn (lớn hơn 0)";
        } else if (refundPolicy && formData.refund_amount > refundPolicy.max_refundable) {
            newErrors.refund_amount = `Số tiền hoàn không được vượt quá ${formatCurrency(refundPolicy.max_refundable)}`;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (!window.confirm(`Xác nhận hoàn tiền ${formatCurrency(formData.refund_amount)} cho booking ${bookingCode}?`)) {
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
                if (onSuccess) onSuccess();
                handleClose();
            } else {
                toast.error(response.message || "Có lỗi xảy ra khi hoàn tiền");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi hoàn tiền. Vui lòng thử lại.");
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
        <div className="refund-modal__overlay" onClick={handleClose}>
            <div className="refund-modal__container" onClick={(e) => e.stopPropagation()}>
                <div className="refund-modal__header">
                    <h3>Hoàn tiền - Booking {bookingCode}</h3>
                    <button
                        className="refund-modal__close-btn"
                        onClick={handleClose}
                        type="button"
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <div className="refund-modal__body">
                    {policyLoading ? (
                        <div className="refund-modal__loading">
                            <CircularIndeterminate />
                            <p>Đang tải chính sách hoàn tiền...</p>
                        </div>
                    ) : (
                        <div className="refund-modal__content-layout">
                            {/* Cột trái: Chính sách hoàn tiền */}
                            {refundPolicy && (
                                <div className="refund-modal__policy">
                                    <h4>Chính sách hoàn tiền</h4>
                                    <div className="refund-modal__policy-info">
                                        <div className="refund-modal__policy-item">
                                            <span className="refund-modal__policy-label">Tổng tiền booking:</span>
                                            <span className="refund-modal__policy-value refund-modal__policy-value--amount">
                                                {formatCurrency(refundPolicy.total_price || 0)}
                                            </span>
                                        </div>
                                        {refundPolicy.already_refunded > 0 && (
                                            <div className="refund-modal__policy-item">
                                                <span className="refund-modal__policy-label">Đã hoàn tiền:</span>
                                                <span className="refund-modal__policy-value refund-modal__policy-value--danger">
                                                    {formatCurrency(refundPolicy.already_refunded)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="refund-modal__policy-item">
                                            <span className="refund-modal__policy-label">Thời gian đến giờ xuất bến:</span>
                                            <span className="refund-modal__policy-value">
                                                {formatHoursToHoursMinutes(refundPolicy.hours_until_departure)}
                                            </span>
                                        </div>
                                        <div className="refund-modal__policy-item">
                                            <span className="refund-modal__policy-label">Tỷ lệ hoàn tiền:</span>
                                            <span className="refund-modal__policy-value">{refundPolicy.percent}%</span>
                                        </div>
                                        <div className="refund-modal__policy-item">
                                            <span className="refund-modal__policy-label">Tổng đã thanh toán:</span>
                                            <span className="refund-modal__policy-value refund-modal__policy-value--amount">
                                                {formatCurrency(refundPolicy.total_paid || refundPolicy.payment_amount || 0)}
                                            </span>
                                        </div>
                                        {refundPolicy.pending_refund_from_modification > 0 && (
                                            <div className="refund-modal__policy-item">
                                                <span className="refund-modal__policy-label">Chênh lệch (đổi chuyến):</span>
                                                <span className="refund-modal__policy-value refund-modal__policy-value--warning">
                                                    {formatCurrency(refundPolicy.pending_refund_from_modification)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="refund-modal__policy-item refund-modal__policy-item--highlight">
                                            <span className="refund-modal__policy-label">Có thể hoàn tối đa:</span>
                                            <span className="refund-modal__policy-value refund-modal__policy-value--amount">
                                                {formatCurrency(refundPolicy.max_refundable)}
                                            </span>
                                        </div>
                                        {refundPolicy.suggested_refund_amount > 0 && (
                                            <div className="refund-modal__policy-item refund-modal__policy-item--suggested">
                                                <span className="refund-modal__policy-label">Đề xuất:</span>
                                                <span className="refund-modal__policy-value refund-modal__policy-value--suggested">
                                                    {formatCurrency(refundPolicy.suggested_refund_amount)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {refundPolicy.pending_refund_from_modification > 0 && (
                                        <div className="refund-modal__notice">
                                            💡 Có {formatCurrency(refundPolicy.pending_refund_from_modification)} từ đổi chuyến chưa hoàn.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cột phải: Form hoàn tiền */}
                            <div className="refund-modal__form-column">
                                <form onSubmit={handleSubmit}>
                                    <div className="refund-modal__form">
                                        <div className="refund-modal__form-group">
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
                                                max={refundPolicy?.max_refundable || 999999999}
                                                required
                                                disabled={loading}
                                            />
                                            {errors.refund_amount && (
                                                <span className="error">{errors.refund_amount}</span>
                                            )}
                                        </div>

                                        <div className="refund-modal__form-group">
                                            <label>Lý do hoàn tiền</label>
                                            <textarea
                                                name="reason"
                                                value={formData.reason}
                                                onChange={handleInputChange}
                                                placeholder="Nhập lý do (tùy chọn)"
                                                rows="2"
                                                maxLength="500"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="refund-modal__bank-section">
                                            <h5>Thông tin chuyển khoản (tùy chọn)</h5>
                                            <div className="refund-modal__form-row">
                                                <div className="refund-modal__form-group">
                                                    <label>Số tài khoản</label>
                                                    <input
                                                        type="text"
                                                        name="bank_account"
                                                        value={formData.bank_account}
                                                        onChange={handleInputChange}
                                                        placeholder="Số TK"
                                                        maxLength="100"
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="refund-modal__form-group">
                                                    <label>Ngân hàng</label>
                                                    <input
                                                        type="text"
                                                        name="bank_name"
                                                        value={formData.bank_name}
                                                        onChange={handleInputChange}
                                                        placeholder="VCB, MB..."
                                                        maxLength="100"
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                            <div className="refund-modal__form-row">
                                                <div className="refund-modal__form-group">
                                                    <label>Ngày CK</label>
                                                    <input
                                                        type="date"
                                                        name="transfer_date"
                                                        value={formData.transfer_date}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="refund-modal__form-group">
                                                    <label>Mã GD</label>
                                                    <input
                                                        type="text"
                                                        name="transfer_reference"
                                                        value={formData.transfer_reference}
                                                        onChange={handleInputChange}
                                                        placeholder="Mã GD"
                                                        maxLength="100"
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                            <div className="refund-modal__form-group">
                                                <label>Ghi chú</label>
                                                <input
                                                    type="text"
                                                    name="note"
                                                    value={formData.note}
                                                    onChange={handleInputChange}
                                                    placeholder="Ghi chú thêm"
                                                    maxLength="1000"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="refund-modal__footer">
                                        <button
                                            type="button"
                                            className="refund-modal__btn refund-modal__btn--cancel"
                                            onClick={handleClose}
                                            disabled={loading}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            className="refund-modal__btn refund-modal__btn--submit"
                                            disabled={loading}
                                        >
                                            {loading ? "Đang xử lý..." : "Xác nhận hoàn tiền"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RefundModal;
