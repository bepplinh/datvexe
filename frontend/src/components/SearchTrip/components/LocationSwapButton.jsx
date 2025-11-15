import React from "react";
import "./LocationSwapButton.scss";

const LocationSwapButton = ({ onSwap }) => {
    return (
        <button
            type="button"
            aria-label="Đổi vị trí"
            className="location-swap-button"
            onClick={(e) => {
                e.stopPropagation();
                onSwap();
            }}
        >
            ⇄
        </button>
    );
};

export default LocationSwapButton;

