import React from "react";
import { useFormContext } from "react-hook-form";
import Section from "./Section";
import FormField from "./FormField";
import TextInput from "./TextInput";
import TextAreaInput from "./TextAreaInput";
import LocationInput from "./LocationInput";

const TripInfoSection = ({
    isSubmitting,
    fromSuggestions,
    toSuggestions,
    focusedLocationField,
    onLocationFocus,
    onLocationBlur,
    onLocationSelect,
}) => {
    const { register } = useFormContext();

    return (
        <>
            <Section title="Thông tin hành trình">
                <div className="create-booking-modal__form-group-row">
                    <LocationInput
                        fieldPrefix="from"
                        label="Địa điểm đi"
                        suggestions={fromSuggestions}
                        isFocused={focusedLocationField === "from"}
                        onFocus={() => onLocationFocus("from")}
                        onBlur={() => onLocationBlur("from")}
                        onSelect={(loc) => onLocationSelect("from", loc)}
                        disabled={isSubmitting}
                    />
                    <LocationInput
                        fieldPrefix="to"
                        label="Địa điểm đến"
                        suggestions={toSuggestions}
                        isFocused={focusedLocationField === "to"}
                        onFocus={() => onLocationFocus("to")}
                        onBlur={() => onLocationBlur("to")}
                        onSelect={(loc) => onLocationSelect("to", loc)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="create-booking-modal__form-group-row">
                    <FormField label="Điểm đón">
                        <TextInput
                            registerProp={register("pickup_address")}
                            placeholder="Ví dụ: Đón tại nhà, văn phòng..."
                            disabled={isSubmitting}
                        />
                    </FormField>
                    <FormField label="Điểm trả">
                        <TextInput
                            registerProp={register("dropoff_address")}
                            placeholder="Ví dụ: Trả tại bến xe, điểm hẹn..."
                            disabled={isSubmitting}
                        />
                    </FormField>
                </div>
            </Section>

            <Section title="Ghi chú">
                <FormField label="Ghi chú">
                    <TextAreaInput
                        registerProp={register("note")}
                        placeholder="Nhập ghi chú (tùy chọn)"
                        disabled={isSubmitting}
                        rows={3}
                    />
                </FormField>
            </Section>
        </>
    );
};

export default TripInfoSection;

