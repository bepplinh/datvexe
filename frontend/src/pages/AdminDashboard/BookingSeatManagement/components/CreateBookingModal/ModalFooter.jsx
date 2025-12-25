import React from "react";

const ModalFooter = ({ onCancel, isSubmitting, cancelLabel = "Hủy", submitLabel = "Xác nhận đặt vé" }) => (
    <div className="create-booking-modal__footer">
        <button
            type="button"
            className="create-booking-modal__btn create-booking-modal__btn--cancel"
            onClick={onCancel}
            disabled={isSubmitting}
        >
            {cancelLabel}
        </button>
        <button
            type="submit"
            className="create-booking-modal__btn create-booking-modal__btn--submit"
            disabled={isSubmitting}
        >
            {isSubmitting ? "Đang xử lý..." : submitLabel}
        </button>
    </div>
);

export default ModalFooter;

