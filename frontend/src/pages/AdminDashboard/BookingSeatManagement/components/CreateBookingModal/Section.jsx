import React from "react";

const Section = ({ title, children }) => (
    <div className="create-booking-modal__section">
        {title && <h4 className="create-booking-modal__section-title">{title}</h4>}
        {children}
    </div>
);

export default Section;

