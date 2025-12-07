import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import "./CouponFormModal.scss";

const CouponFormModal = ({ open, onClose, coupon, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discount_type: "fixed",
        discount_value: "",
        max_discount_amount: "",
        min_order_value: "",
        start_date: "",
        end_date: "",
        usage_limit_global: "",
        usage_limit_per_user: "",
        is_active: true,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (coupon) {
            // Handle both field name formats (from API response)
            const discountType = coupon.discount_type === "fixed_amount" ? "fixed" : (coupon.discount_type || "fixed");
            const minOrderValue = coupon.min_order_value || coupon.minimum_order_amount || "";
            const usageLimit = coupon.usage_limit_global || coupon.max_usage || "";
            const startDate = coupon.start_date || coupon.valid_from || "";
            const endDate = coupon.end_date || coupon.valid_until || "";

            setFormData({
                code: coupon.code || "",
                description: coupon.description || "",
                discount_type: discountType,
                discount_value: coupon.discount_value || "",
                max_discount_amount: coupon.max_discount_amount || "",
                min_order_value: minOrderValue,
                start_date: startDate
                    ? new Date(startDate).toISOString().split("T")[0]
                    : "",
                end_date: endDate
                    ? new Date(endDate).toISOString().split("T")[0]
                    : "",
                usage_limit_global: usageLimit,
                usage_limit_per_user: coupon.usage_limit_per_user || "",
                is_active: coupon.is_active !== undefined ? coupon.is_active : true,
            });
        } else {
            setFormData({
                code: "",
                description: "",
                discount_type: "fixed",
                discount_value: "",
                max_discount_amount: "",
                min_order_value: "",
                start_date: "",
                end_date: "",
                usage_limit_global: "",
                usage_limit_per_user: "",
                is_active: true,
            });
        }
        setErrors({});
    }, [coupon, open]);

    const validate = () => {
        const newErrors = {};

        if (!formData.code.trim()) {
            newErrors.code = "Mã coupon là bắt buộc";
        }

        if (!formData.discount_value || formData.discount_value <= 0) {
            newErrors.discount_value = "Giá trị giảm giá phải lớn hơn 0";
        }

        if (formData.discount_type === "percentage") {
            if (formData.discount_value > 100) {
                newErrors.discount_value = "Phần trăm giảm giá không được vượt quá 100%";
            }
        }

        if (formData.start_date && formData.end_date) {
            if (new Date(formData.end_date) <= new Date(formData.start_date)) {
                newErrors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
            }
        }

        if (formData.usage_limit_global && formData.usage_limit_global < 1) {
            newErrors.usage_limit_global = "Giới hạn sử dụng phải lớn hơn 0";
        }

        if (formData.usage_limit_per_user && formData.usage_limit_per_user < 1) {
            newErrors.usage_limit_per_user = "Giới hạn sử dụng/user phải lớn hơn 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }

        // Transform data to match API request format (CouponStoreRequest)
        const submitData = {
            code: formData.code.trim().toUpperCase(),
            name: formData.code.trim().toUpperCase(), // Use code as name since API requires name
            description: formData.description || null,
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value),
            max_discount_amount: formData.max_discount_amount
                ? parseFloat(formData.max_discount_amount)
                : null,
            minimum_order_amount: formData.min_order_value
                ? parseFloat(formData.min_order_value)
                : null,
            max_usage: formData.usage_limit_global
                ? parseInt(formData.usage_limit_global)
                : null,
            usage_limit_per_user: formData.usage_limit_per_user
                ? parseInt(formData.usage_limit_per_user)
                : null,
            valid_from: formData.start_date ? `${formData.start_date} 00:00:00` : null,
            valid_until: formData.end_date ? `${formData.end_date} 23:59:59` : null,
            is_active: formData.is_active,
        };

        onSubmit(submitData);
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    if (!open) return null;

    return (
        <div className="coupon-form-modal__backdrop" onClick={onClose}>
            <div
                className="coupon-form-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="coupon-form-modal__header">
                    <h2>{coupon ? "Chỉnh sửa Coupon" : "Tạo Coupon Mới"}</h2>
                    <button
                        className="coupon-form-modal__close-btn"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="coupon-form-modal__form">
                    <div className="coupon-form-modal__row">
                        <div className="coupon-form-modal__field">
                            <label>
                                Mã Coupon <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) =>
                                    handleChange("code", e.target.value.toUpperCase())
                                }
                                placeholder="VD: SUMMER2024"
                                disabled={!!coupon}
                            />
                            {errors.code && (
                                <span className="coupon-form-modal__error">
                                    {errors.code}
                                </span>
                            )}
                        </div>

                    </div>

                    <div className="coupon-form-modal__field">
                        <label>Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Mô tả về coupon..."
                            rows={3}
                        />
                    </div>

                    <div className="coupon-form-modal__row">
                        <div className="coupon-form-modal__field">
                            <label>
                                Loại giảm giá <span className="required">*</span>
                            </label>
                            <select
                                value={formData.discount_type}
                                onChange={(e) =>
                                    handleChange("discount_type", e.target.value)
                                }
                            >
                                <option value="fixed">Giảm cố định (VNĐ)</option>
                                <option value="percentage">Giảm phần trăm (%)</option>
                            </select>
                        </div>

                        <div className="coupon-form-modal__field">
                            <label>
                                Giá trị giảm giá <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.discount_value}
                                onChange={(e) =>
                                    handleChange("discount_value", e.target.value)
                                }
                                placeholder={
                                    formData.discount_type === "percentage"
                                        ? "VD: 10"
                                        : "VD: 50000"
                                }
                                min="0"
                                max={formData.discount_type === "percentage" ? "100" : undefined}
                                step={formData.discount_type === "percentage" ? "1" : "1000"}
                            />
                            {errors.discount_value && (
                                <span className="coupon-form-modal__error">
                                    {errors.discount_value}
                                </span>
                            )}
                        </div>
                    </div>

                    {formData.discount_type === "percentage" && (
                        <div className="coupon-form-modal__field">
                            <label>Giảm tối đa (VNĐ)</label>
                            <input
                                type="number"
                                value={formData.max_discount_amount}
                                onChange={(e) =>
                                    handleChange("max_discount_amount", e.target.value)
                                }
                                placeholder="VD: 100000"
                                min="0"
                                step="1000"
                            />
                        </div>
                    )}

                    <div className="coupon-form-modal__row">
                        <div className="coupon-form-modal__field">
                            <label>Đơn hàng tối thiểu (VNĐ)</label>
                            <input
                                type="number"
                                value={formData.min_order_value}
                                onChange={(e) =>
                                    handleChange("min_order_value", e.target.value)
                                }
                                placeholder="VD: 200000"
                                min="0"
                                step="1000"
                            />
                        </div>

                        <div className="coupon-form-modal__field">
                            <label>Giới hạn sử dụng (tổng)</label>
                            <input
                                type="number"
                                value={formData.usage_limit_global}
                                onChange={(e) =>
                                    handleChange("usage_limit_global", e.target.value)
                                }
                                placeholder="Để trống = không giới hạn"
                                min="1"
                            />
                            {errors.usage_limit_global && (
                                <span className="coupon-form-modal__error">
                                    {errors.usage_limit_global}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="coupon-form-modal__field">
                        <label>Giới hạn sử dụng/user</label>
                        <input
                            type="number"
                            value={formData.usage_limit_per_user}
                            onChange={(e) =>
                                handleChange("usage_limit_per_user", e.target.value)
                            }
                            placeholder="Để trống = không giới hạn"
                            min="1"
                        />
                        {errors.usage_limit_per_user && (
                            <span className="coupon-form-modal__error">
                                {errors.usage_limit_per_user}
                            </span>
                        )}
                    </div>

                    <div className="coupon-form-modal__row">
                        <div className="coupon-form-modal__field">
                            <label>Ngày bắt đầu</label>
                            <input
                                type="datetime-local"
                                value={
                                    formData.start_date
                                        ? `${formData.start_date}T00:00`
                                        : ""
                                }
                                onChange={(e) => {
                                    const date = e.target.value.split("T")[0];
                                    handleChange("start_date", date);
                                }}
                            />
                        </div>

                        <div className="coupon-form-modal__field">
                            <label>Ngày kết thúc</label>
                            <input
                                type="datetime-local"
                                value={
                                    formData.end_date
                                        ? `${formData.end_date}T23:59`
                                        : ""
                                }
                                onChange={(e) => {
                                    const date = e.target.value.split("T")[0];
                                    handleChange("end_date", date);
                                }}
                            />
                            {errors.end_date && (
                                <span className="coupon-form-modal__error">
                                    {errors.end_date}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="coupon-form-modal__field">
                        <label className="coupon-form-modal__checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) =>
                                    handleChange("is_active", e.target.checked)
                                }
                            />
                            <span>Kích hoạt coupon</span>
                        </label>
                    </div>

                    <div className="coupon-form-modal__actions">
                        <button
                            type="button"
                            className="coupon-form-modal__btn coupon-form-modal__btn--cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="coupon-form-modal__btn coupon-form-modal__btn--submit"
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : coupon ? "Cập nhật" : "Tạo mới"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CouponFormModal;

