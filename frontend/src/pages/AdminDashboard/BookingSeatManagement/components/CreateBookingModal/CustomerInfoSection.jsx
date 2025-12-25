import React from "react";
import { useFormContext } from "react-hook-form";
import Section from "./Section";
import FormField from "./FormField";
import TextInput from "./TextInput";

const CustomerInfoSection = ({ isSubmitting, errors }) => {
    const { register } = useFormContext();

    const fields = [
        {
            name: "customer_name",
            label: "Tên khách hàng",
            required: true,
            type: "text",
            placeholder: "Nhập tên khách hàng",
            error: errors.customer_name?.message,
        },
        {
            name: "customer_phone",
            label: "Số điện thoại",
            required: true,
            type: "tel",
            placeholder: "Nhập số điện thoại",
            error: errors.customer_phone?.message,
        },
        {
            name: "customer_email",
            label: "Email",
            required: false,
            type: "email",
            placeholder: "Nhập email (tùy chọn)",
            error: errors.customer_email?.message,
        },
    ];

    return (
        <Section title="Thông tin khách hàng">
            {fields.map((field) => (
                <FormField
                    key={field.name}
                    label={field.label}
                    required={field.required}
                    error={field.error}
                >
                    <TextInput
                        type={field.type}
                        registerProp={register(field.name)}
                        error={field.error}
                        placeholder={field.placeholder}
                        disabled={isSubmitting}
                    />
                </FormField>
            ))}
        </Section>
    );
};

export default CustomerInfoSection;

