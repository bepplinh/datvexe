import React, { useRef } from "react";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import date_picker from "../../../assets/date_picker.svg";
import { formatDate, getMinDate, getMaxDate } from "../utils/dateUtils";
import "./DateField.scss";

const DateField = ({
    label,
    value,
    onChange,
    minDate,
    maxDate,
    isOpen,
    onOpen,
    onClose,
    disabled = false,
}) => {
    const fieldRef = useRef(null);

    return (
        <div
            className={`date-field-wrapper ${
                disabled
                    ? "date-field-wrapper--disabled"
                    : "date-field-wrapper--active"
            }`}
        >
            <div
                ref={fieldRef}
                className="date-field"
                onClick={() => !disabled && onOpen()}
            >
                <img
                    src={date_picker}
                    alt="calendar"
                    className="date-field__calendar-icon"
                />
                <div className="date-field__content">
                    <div className="date-field__label-small">{label}</div>
                    <div className="date-field__value">
                        {formatDate(value)}
                    </div>
                </div>
            </div>
            <DesktopDatePicker
                value={value}
                onChange={onChange}
                minDate={minDate || getMinDate()}
                maxDate={maxDate || getMaxDate()}
                disabled={disabled}
                open={isOpen && !disabled}
                onOpen={onOpen}
                onClose={onClose}
                enableAccessibleFieldDOMStructure={false}
                slots={{
                    textField: (params) => (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width:
                                    fieldRef.current?.offsetWidth || "180px",
                                height:
                                    fieldRef.current?.offsetHeight || "70px",
                                pointerEvents: "none",
                                opacity: 0,
                            }}
                        >
                            <input
                                {...params.inputProps}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                            />
                        </div>
                    ),
                }}
                slotProps={{
                    popper: {
                        placement: "bottom-start",
                        anchorEl: isOpen && !disabled
                            ? fieldRef.current
                            : null,
                        sx: {
                            zIndex: 1000,
                        },
                    },
                    textField: {
                        sx: {
                            "& .MuiInputBase-root": {
                                fontFamily: "Lexend",
                            },
                        },
                    },
                }}
                localeText={{
                    calendarWeekNumberHeaderText: "Tuần",
                    calendarWeekNumberHeaderLabel: "Số tuần",
                    calendarWeekNumberAriaLabel: (weekNumber) =>
                        `Tuần ${weekNumber}`,
                    calendarWeekNumberText: (weekNumber) =>
                        `${weekNumber}`,
                }}
            />
        </div>
    );
};

export default DateField;

