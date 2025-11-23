import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Button,
} from "@mui/material";
import { Filter, X } from "lucide-react";
import "./TicketFilters.scss";

dayjs.locale("vi");

const TicketFilters = ({ filters, onFilterChange, onReset }) => {
    const handlePaymentStatusChange = (event) => {
        onFilterChange({
            ...filters,
            payment_status: event.target.value,
        });
    };

    const handleTicketStatusChange = (event) => {
        onFilterChange({
            ...filters,
            ticket_status: event.target.value,
        });
    };

    const handleFromDateChange = (date) => {
        onFilterChange({
            ...filters,
            from_date: date ? date.format("YYYY-MM-DD") : "",
        });
    };

    const handleToDateChange = (date) => {
        onFilterChange({
            ...filters,
            to_date: date ? date.format("YYYY-MM-DD") : "",
        });
    };

    const hasActiveFilters =
        filters.payment_status !== "" ||
        filters.ticket_status !== "" ||
        filters.from_date !== "" ||
        filters.to_date !== "";

    return (
        <div className="ticket-filters">
            <div className="ticket-filters__header">
                <Filter size={20} />
                <h3 className="ticket-filters__title">Bộ lọc</h3>
            </div>

            <div className="ticket-filters__content">
                <Box className="ticket-filters__row">
                    <FormControl fullWidth className="ticket-filters__field">
                        <InputLabel id="payment-status-label">
                            Trạng thái thanh toán
                        </InputLabel>
                        <Select
                            labelId="payment-status-label"
                            id="payment-status"
                            value={filters.payment_status}
                            label="Trạng thái thanh toán"
                            onChange={handlePaymentStatusChange}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="paid">Đã thanh toán</MenuItem>
                            <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box className="ticket-filters__row">
                    <FormControl fullWidth className="ticket-filters__field">
                        <InputLabel id="ticket-status-label">
                            Tình trạng vé
                        </InputLabel>
                        <Select
                            labelId="ticket-status-label"
                            id="ticket-status"
                            value={filters.ticket_status}
                            label="Tình trạng vé"
                            onChange={handleTicketStatusChange}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="not-departed">Chưa đi</MenuItem>
                            <MenuItem value="departed">Đã đi</MenuItem>
                            <MenuItem value="cancelled">Đã hủy</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                    <Box className="ticket-filters__row ticket-filters__date-row">
                        <DatePicker
                            label="Từ ngày"
                            value={
                                filters.from_date
                                    ? dayjs(filters.from_date)
                                    : null
                            }
                            onChange={handleFromDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    className: "ticket-filters__date-field",
                                },
                            }}
                        />
                        <DatePicker
                            label="Đến ngày"
                            value={
                                filters.to_date ? dayjs(filters.to_date) : null
                            }
                            onChange={handleToDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    className: "ticket-filters__date-field",
                                },
                            }}
                        />
                    </Box>
                </LocalizationProvider>

                {hasActiveFilters && (
                    <Box className="ticket-filters__actions">
                        <Button
                            variant="outlined"
                            startIcon={<X size={18} />}
                            onClick={onReset}
                            className="ticket-filters__reset-btn"
                        >
                            Xóa bộ lọc
                        </Button>
                    </Box>
                )}
            </div>
        </div>
    );
};

export default TicketFilters;

