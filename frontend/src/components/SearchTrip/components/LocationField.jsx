import React from "react";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import "./LocationField.scss";
import LocationMenu from "./LocationMenu";

/**
 * LocationField Component
 * Displays a location selection field with dropdown menu
 */
const LocationField = ({
    label,
    value,
    fieldType, // 'from' or 'to'
    excludedLocation, // Location to exclude from list (the other field's value)
    isOpen,
    onToggle,
    onSelect,
}) => {
    const handleSelect = (location) => {
        if (onSelect) {
            onSelect(location);
        }
    };

    return (
        <div
            className="location-field"
            onClick={onToggle}
        >
            <LocationOnIcon className="location-field__icon" />
            <div className="location-field__label-small">{label}</div>
            <div className="location-field__value">
                {value?.name || `Chọn ${label.toLowerCase()}`}
            </div>

            {isOpen && (
                <LocationMenu 
                    fieldType={fieldType}
                    excludedLocation={excludedLocation}
                    onSelect={handleSelect} 
                />
            )}
        </div>
    );
};

export default LocationField;

