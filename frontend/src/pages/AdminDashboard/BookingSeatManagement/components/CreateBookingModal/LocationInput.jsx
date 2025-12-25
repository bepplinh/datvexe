import React from "react";
import { useFormContext } from "react-hook-form";
import FormField from "./FormField";
import TextInput from "./TextInput";
import LocationDropdown from "./LocationDropdown";

const LocationInput = ({
    fieldPrefix,
    label,
    suggestions,
    isFocused,
    onFocus,
    onBlur,
    onSelect,
    disabled,
}) => {
    const { register } = useFormContext();

    const handleBlur = () => {
        setTimeout(() => {
            onBlur();
        }, 150);
    };

    return (
        <FormField label={label} required>
            <TextInput
                registerProp={register(`${fieldPrefix}_location`)}
                placeholder={label}
                disabled={disabled}
                onFocus={onFocus}
                onBlur={handleBlur}
            />
            <LocationDropdown
                isVisible={isFocused}
                suggestions={suggestions}
                onSelect={onSelect}
            />
        </FormField>
    );
};

export default LocationInput;

