import React from "react";

const LocationDropdown = ({ isVisible, suggestions, onSelect }) => {
    if (!isVisible || suggestions.length === 0) return null;

    return (
        <div className="create-booking-modal__location-dropdown">
            {suggestions.map((loc) => (
                <div
                    key={loc.id}
                    className="create-booking-modal__location-option"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(loc);
                    }}
                >
                    {loc.name}
                </div>
            ))}
        </div>
    );
};

export default LocationDropdown;

