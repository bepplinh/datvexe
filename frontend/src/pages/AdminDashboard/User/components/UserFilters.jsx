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
import "./UserFilters.scss";

dayjs.locale("vi");

const UserFilters = ({ filters, onFilterChange, onReset }) => {
    const handleStatusChange = (event) => {
        onFilterChange({
            ...filters,
            status: event.target.value,
        });
    };

    const handleRoleChange = (event) => {
        onFilterChange({
            ...filters,
            role: event.target.value,
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
        filters.status !== "" ||
        filters.role !== "" ||
        filters.from_date !== "" ||
        filters.to_date !== "";

    return (
        <div className="user-filters">
            <div className="user-filters__header">
                <Filter size={20} />
                <h3 className="user-filters__title">Bộ lọc</h3>
            </div>

            <div className="user-filters__content">
                <Box className="user-filters__row">
                    <FormControl fullWidth className="user-filters__field">
                        <InputLabel id="status-label">Trạng thái</InputLabel>
                        <Select
                            labelId="status-label"
                            id="status"
                            value={filters.status}
                            label="Trạng thái"
                            onChange={handleStatusChange}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="active">Đang hoạt động</MenuItem>
                            <MenuItem value="inactive">Tạm ngưng</MenuItem>
                            <MenuItem value="banned">Đã khóa</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box className="user-filters__row">
                    <FormControl fullWidth className="user-filters__field">
                        <InputLabel id="role-label">Vai trò</InputLabel>
                        <Select
                            labelId="role-label"
                            id="role"
                            value={filters.role}
                            label="Vai trò"
                            onChange={handleRoleChange}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="customer">Khách hàng</MenuItem>
                            <MenuItem value="staff">Nhân viên</MenuItem>
                            <MenuItem value="admin">Quản trị viên</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="vi"
                >
                    <Box className="user-filters__row user-filters__date-row">
                        <DatePicker
                            label="Đăng ký từ ngày"
                            value={
                                filters.from_date
                                    ? dayjs(filters.from_date)
                                    : null
                            }
                            onChange={handleFromDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    className: "user-filters__date-field",
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
                                    className: "user-filters__date-field",
                                },
                            }}
                        />
                    </Box>
                </LocalizationProvider>

                {hasActiveFilters && (
                    <Box className="user-filters__actions">
                        <Button
                            variant="outlined"
                            startIcon={<X size={18} />}
                            onClick={onReset}
                            className="user-filters__reset-btn"
                        >
                            Xóa bộ lọc
                        </Button>
                    </Box>
                )}
            </div>
        </div>
    );
};

export default UserFilters;
