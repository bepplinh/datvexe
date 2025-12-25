import React from "react";
import { X } from "lucide-react";

const ModalHeader = ({ title, onClose, isSubmitting }) => (
    <div className="create-booking-modal__header">
        <h3>{title}</h3>
        <button
            className="create-booking-modal__close"
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
        >
            <X size={20} />
        </button>
    </div>
);

export default ModalHeader;

