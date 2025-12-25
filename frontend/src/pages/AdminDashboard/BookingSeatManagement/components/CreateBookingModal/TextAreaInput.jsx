import React from "react";

const TextAreaInput = ({ registerProp, placeholder, disabled, rows = 3, ...props }) => (
    <textarea
        {...registerProp}
        {...props}
        className="create-booking-modal__input create-booking-modal__textarea"
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
    />
);

export default TextAreaInput;

