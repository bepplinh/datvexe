import React from "react";

const TextInput = ({ type = "text", registerProp, error, placeholder, disabled, ...props }) => (
    <input
        type={type}
        {...registerProp}
        {...props}
        className={`create-booking-modal__input ${error ? "error" : ""}`}
        placeholder={placeholder}
        disabled={disabled}
    />
);

export default TextInput;

