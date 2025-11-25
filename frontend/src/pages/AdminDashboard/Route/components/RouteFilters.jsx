import React, { useEffect, useState } from "react";
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Button,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { Filter, X } from "lucide-react";
import { adminLocationService } from "../../../../services/admin/locationService";
import "./RouteFilters.scss";

dayjs.locale("vi");

const RouteFilters = ({ filters, onFilterChange, onReset }) => {
    const [cities, setCities] = useState([]);

    useEffect(() => {
        const loadCities = async () => {
            try {
                const response = await adminLocationService.getCities();
                if (response?.data) {
                    setCities(response.data);
                }
            } catch (error) {
                console.error("Failed to load cities", error);
            }
        };

        loadCities();
    }, []);

    const handleChange = (field, value) => {
        onFilterChange({
            ...filters,
            [field]: value,
        });
    };

    const hasActiveFilters =
        filters.from_city ||
        filters.to_city ||
        filters.created_from ||
        filters.created_to;

    return (
        <div className="route-filters">
            <div className="route-filters__header">
                <Filter size={20} />
                <h3 className="route-filters__title">Bộ lọc tuyến</h3>
            </div>

            <div className="route-filters__content">
                <Box className="route-filters__row">
                    <FormControl fullWidth className="route-filters__field">
                        <InputLabel id="from-city-label">
                            Thành phố xuất phát
                        </InputLabel>
                        <Select
                            labelId="from-city-label"
                            value={filters.from_city || ""}
                            label="Thành phố xuất phát"
                            onChange={(event) =>
                                handleChange("from_city", event.target.value)
                            }
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {cities.map((city) => (
                                <MenuItem key={city.id} value={city.id}>
                                    {city.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box className="route-filters__row">
                    <FormControl fullWidth className="route-filters__field">
                        <InputLabel id="to-city-label">
                            Thành phố đích
                        </InputLabel>
                        <Select
                            labelId="to-city-label"
                            value={filters.to_city || ""}
                            label="Thành phố đích"
                            onChange={(event) =>
                                handleChange("to_city", event.target.value)
                            }
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {cities.map((city) => (
                                <MenuItem key={city.id} value={city.id}>
                                    {city.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="vi"
                >
                    <Box className="route-filters__row route-filters__date-row">
                        <DatePicker
                            label="Tạo từ ngày"
                            value={
                                filters.created_from
                                    ? dayjs(filters.created_from)
                                    : null
                            }
                            onChange={(date) =>
                                handleChange(
                                    "created_from",
                                    date ? date.format("YYYY-MM-DD") : ""
                                )
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    className: "route-filters__date-field",
                                },
                            }}
                        />
                        <DatePicker
                            label="Đến ngày"
                            value={
                                filters.created_to
                                    ? dayjs(filters.created_to)
                                    : null
                            }
                            onChange={(date) =>
                                handleChange(
                                    "created_to",
                                    date ? date.format("YYYY-MM-DD") : ""
                                )
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    className: "route-filters__date-field",
                                },
                            }}
                        />
                    </Box>
                </LocalizationProvider>
            </div>
            {hasActiveFilters && (
                <div className="route-filters__actions">
                    <Button
                        variant="outlined"
                        startIcon={<X size={18} />}
                        onClick={onReset}
                        className="route-filters__reset-btn"
                    >
                        Xóa bộ lọc
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RouteFilters;
