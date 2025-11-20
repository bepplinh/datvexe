import React from "react";

const countryOptions = [
    { value: "+84", label: "(VN) +84" },
    { value: "+1", label: "+1" },
    { value: "+65", label: "+65" },
];

function ContactForm({ values, onChange }) {
    const handleChange = (field) => (event) => {
        onChange?.(field, event.target.value);
    };

    const handleProxyToggle = (event) => {
        const checked = event.target.checked;
        onChange?.("isProxyBooking", checked);
        if (!checked) {
            onChange?.("bookerName", "");
            onChange?.("bookerPhone", "");
        }
    };

    return (
        <div className="card">
            <div className="card__title">Thông tin liên hệ</div>
            <div className="form">
                <div className="form__row">
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={values.isProxyBooking}
                            onChange={handleProxyToggle}
                        />
                        <span>Đặt hộ người khác</span>
                    </label>
                </div>

                {values.isProxyBooking && (
                    <div className="form__row">
                        <div className="form__field form__field--half">
                            <label>Họ tên người đặt hộ *</label>
                            <input
                                value={values.bookerName}
                                onChange={handleChange("bookerName")}
                                placeholder="Họ và tên người đặt hộ"
                            />
                        </div>
                        <div className="form__field form__field--half">
                            <label>Số điện thoại người đặt hộ *</label>
                            <input
                                value={values.bookerPhone}
                                onChange={handleChange("bookerPhone")}
                                placeholder="Số điện thoại người đặt hộ"
                            />
                        </div>
                    </div>
                )}

                <div className="form__row">
                    <div className="form__field form__field--half">
                        <label>Họ tên *</label>
                        <input
                            value={values.name}
                            onChange={handleChange("name")}
                            placeholder="Họ và tên"
                        />
                    </div>
                </div>
                <div className="form__row">
                    <div className="form__field form__field--half">
                        <label>Số điện thoại *</label>
                        <div className="phone">
                            <select
                                value={values.countryCode}
                                onChange={handleChange("countryCode")}
                            >
                                {countryOptions.map((option) => (
                                    <option
                                        value={option.value}
                                        key={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                value={values.phone}
                                onChange={handleChange("phone")}
                            />
                        </div>
                    </div>
                    <div className="form__field form__field--half">
                        <label>Ghi chú</label>
                        <input
                            value={values.note}
                            onChange={handleChange("note")}
                            placeholder="Ghi chú"
                        />
                    </div>
                </div>
                <div className="form__row">
                    <div className="form__field form__field--half">
                        <label>NHẬP ĐIỂM ĐÓN CHI TIẾT</label>
                        <input
                            value={values.pickup}
                            onChange={handleChange("pickup")}
                            placeholder="Điểm đón chi tiết"
                        />
                    </div>
                    <div className="form__field form__field--half">
                        <label>NHẬP ĐIỂM TRẢ CHI TIẾT</label>
                        <input
                            value={values.dropoff}
                            onChange={handleChange("dropoff")}
                            placeholder="Điểm trả chi tiết"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactForm;
