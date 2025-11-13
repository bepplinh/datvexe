// src/components/form/RHFTextField.jsx
import React from "react";
import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

export const RHFTextField = ({
    name,
    label,
    helperText,
    type = "text",
    InputLabelProps,
    ...other
}) => {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    const fieldError = errors[name];

    return (
        <TextField
            {...register(name)}
            label={label}
            type={type}
            fullWidth
            size="small"
            error={!!fieldError}
            helperText={fieldError?.message || helperText}
            InputLabelProps={InputLabelProps}
            {...other}
        />
    );
};
