import React from "react";
import "./TripTypeSelector.scss";

const TripTypeSelector = ({ tripType, onTripTypeChange }) => {
    return (
        <div className="trip-type-selector">
            <label className="trip-type-selector__option">
                <input
                    type="radio"
                    value="oneway"
                    checked={tripType === "oneway"}
                    onChange={() => onTripTypeChange("oneway")}
                />
                <span>Một chiều</span>
            </label>
            <label className="trip-type-selector__option">
                <input
                    type="radio"
                    value="roundtrip"
                    checked={tripType === "roundtrip"}
                    onChange={() => onTripTypeChange("roundtrip")}
                />
                <span>Khứ hồi</span>
            </label>
        </div>
    );
};

export default TripTypeSelector;

