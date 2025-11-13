// src/components/common/InputCommon.jsx
import React from "react";
import TextField from "@mui/material/TextField";

const InputCommon = React.forwardRef(function InputCommon(props, ref) {
    const {
        name,
        label,
        value,
        onChange,
        onBlur,
        error,
        helperText,
        fullWidth = true,
        size = "small",
        variant = "outlined",
        ...rest
    } = props;

    return (
        <TextField
            inputRef={ref} // để RHF attach đúng input element
            name={name}
            label={label}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={Boolean(error)} // true/false
            helperText={helperText}
            fullWidth={fullWidth}
            size={size}
            variant={variant}
            {...rest} // cho phép pass thêm props MUI (type, multiline, InputProps, v.v.)
        />
    );
});

export default InputCommon;
