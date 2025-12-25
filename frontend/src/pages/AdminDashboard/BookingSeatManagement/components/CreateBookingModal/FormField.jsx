import React from "react";

const FormField = ({ label, required, error, children }) => (
    <div className="create-booking-modal__form-group">
        <label className="create-booking-modal__label">
            {label} {required ? <span className="required">*</span> : null}
        </label>
        {children}
        {error ? <span className="create-booking-modal__error">{error}</span> : null}
    </div>
);

export default FormField;

