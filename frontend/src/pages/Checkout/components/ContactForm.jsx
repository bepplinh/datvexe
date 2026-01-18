import React, { useEffect } from "react";

const countryOptions = [
    { value: "+84", label: "(VN) +84" },
    { value: "+1", label: "+1" },
    { value: "+65", label: "+65" },
];

function ContactForm({ register, errors, watch, setValue, clearErrors }) {
    const isProxyBooking = watch("isProxyBooking");

    // Clear booker info if not booking for others
    useEffect(() => {
        if (!isProxyBooking) {
            setValue("bookerName", "");
            setValue("bookerPhone", "");
            clearErrors(["bookerName", "bookerPhone"]);
        }
    }, [isProxyBooking, setValue, clearErrors]);

    return (
        <div className="card">
            <div className="card__title">Thông tin liên hệ</div>
            <div className="form">
                <div className="form__row">
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            {...register("isProxyBooking")}
                        />
                        <span>Đặt hộ người khác</span>
                    </label>
                </div>

                {isProxyBooking && (
                    <div className="form__row">
                        <div className="form__field form__field--half">
                            <label>Họ tên người đặt hộ *</label>
                            <input
                                {...register("bookerName", {
                                    onChange: () => clearErrors("bookerName"),
                                })}
                                placeholder="Họ và tên người đặt hộ"
                                className={errors.bookerName ? "input-error" : ""}
                            />
                            {errors.bookerName && (
                                <span className="error-message">
                                    {errors.bookerName.message}
                                </span>
                            )}
                        </div>
                        <div className="form__field form__field--half">
                            <label>Số điện thoại người đặt hộ *</label>
                            <input
                                {...register("bookerPhone", {
                                    onChange: () => clearErrors("bookerPhone"),
                                })}
                                placeholder="Số điện thoại người đặt hộ"
                                className={errors.bookerPhone ? "input-error" : ""}
                            />
                            {errors.bookerPhone && (
                                <span className="error-message">
                                    {errors.bookerPhone.message}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="form__row">
                    <div className="form__field form__field--half">
                        <label>Họ tên *</label>
                        <input
                            {...register("name", {
                                onChange: () => clearErrors("name"),
                            })}
                            placeholder="Họ và tên"
                            className={errors.name ? "input-error" : ""}
                        />
                        {errors.name && (
                            <span className="error-message">{errors.name.message}</span>
                        )}
                    </div>
                </div>
                <div className="form__row">
                    <div className="form__field form__field--half">
                        <label>Số điện thoại *</label>
                        <div className="phone">
                            <select {...register("countryCode")}>
                                {countryOptions.map((option) => (
                                    <option value={option.value} key={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                {...register("phone", {
                                    onChange: () => clearErrors("phone"),
                                })}
                                className={errors.phone ? "input-error" : ""}
                            />
                        </div>
                        {errors.phone && (
                            <span className="error-message">{errors.phone.message}</span>
                        )}
                    </div>
                    <div className="form__field form__field--half">
                        <label>Ghi chú</label>
                        <input
                            {...register("note", {
                                onChange: () => clearErrors("note"),
                            })}
                            placeholder="Ghi chú"
                        />
                    </div>
                </div>
                <div className="form__row">
                    <div className="form__field form__field--half">
                        <label>NHẬP ĐIỂM ĐÓN CHI TIẾT</label>
                        <input
                            {...register("pickup", {
                                onChange: () => clearErrors("pickup"),
                            })}
                            placeholder="Điểm đón chi tiết"
                        />
                    </div>
                    <div className="form__field form__field--half">
                        <label>NHẬP ĐIỂM TRẢ CHI TIẾT</label>
                        <input
                            {...register("dropoff", {
                                onChange: () => clearErrors("dropoff"),
                            })}
                            placeholder="Điểm trả chi tiết"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactForm;
