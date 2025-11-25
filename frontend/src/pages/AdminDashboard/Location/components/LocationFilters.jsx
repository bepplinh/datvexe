import React, { useState, useEffect } from "react";
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
    CircularProgress,
} from "@mui/material";
import { Filter, X } from "lucide-react";
import { adminLocationService } from "../../../../services/admin/locationService";
import "./LocationFilters.scss";

dayjs.locale("vi");

export const LocationFilters = ({
    filters,
    onFilterChange,
    onReset,
    allLocations = [],
}) => {
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // Load cities khi component mount
    useEffect(() => {
        loadCities();
    }, []);

    // Load districts khi có city_id được chọn
    useEffect(() => {
        if (filters.city_id) {
            loadDistricts(filters.city_id);
        } else {
            setDistricts([]);
        }
    }, [filters.city_id]);

    const loadCities = async () => {
        try {
            setLoadingCities(true);
            const response = await adminLocationService.getCities();
            if (response.success && response.data) {
                setCities(response.data);
            }
        } catch (error) {
            console.error("Error loading cities:", error);
        } finally {
            setLoadingCities(false);
        }
    };

    const loadDistricts = async (cityId) => {
        try {
            setLoadingDistricts(true);
            const response = await adminLocationService.getDistricts(cityId);
            if (response.success && response.data) {
                setDistricts(response.data);
            }
        } catch (error) {
            console.error("Error loading districts:", error);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const handleTypeChange = (event) => {
        const newType = event.target.value;
        onFilterChange({
            ...filters,
            type: newType,
            // Reset parent filters khi đổi type
            city_id: "",
            district_id: "",
            parent_id: "",
        });
    };

    const handleCityChange = (event) => {
        const cityId = event.target.value;
        onFilterChange({
            ...filters,
            city_id: cityId,
            district_id: "", // Reset district khi đổi city
            parent_id: cityId || "", // Set parent_id nếu chọn city
        });
    };

    const handleDistrictChange = (event) => {
        const districtId = event.target.value;
        onFilterChange({
            ...filters,
            district_id: districtId,
            parent_id: districtId || filters.city_id || "", // Set parent_id
        });
    };

    const handleParentChange = (event) => {
        onFilterChange({
            ...filters,
            parent_id: event.target.value,
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
        filters.type !== "" ||
        filters.city_id !== "" ||
        filters.district_id !== "" ||
        filters.parent_id !== "" ||
        filters.from_date !== "" ||
        filters.to_date !== "";

    // Lấy danh sách parent locations từ allLocations
    const getParentOptions = () => {
        if (!allLocations || allLocations.length === 0) return [];

        // Nếu đã chọn type, chỉ hiển thị parent phù hợp
        if (filters.type === "district") {
            return allLocations.filter((loc) => loc.type === "city");
        }
        if (filters.type === "ward") {
            return allLocations.filter((loc) => loc.type === "district");
        }

        // Nếu không chọn type, hiển thị tất cả có thể làm parent
        return allLocations.filter(
            (loc) => loc.type === "city" || loc.type === "district"
        );
    };

    return (
        <div className="location-filters">
            <div className="location-filters__header">
                <Filter size={20} />
                <h3 className="location-filters__title">Bộ lọc</h3>
            </div>

            <div className="location-filters__content">
                <Box className="location-filters__row">
                    <FormControl fullWidth className="location-filters__field">
                        <InputLabel id="type-label">Loại địa điểm</InputLabel>
                        <Select
                            labelId="type-label"
                            id="type"
                            value={filters.type || ""}
                            label="Loại địa điểm"
                            onChange={handleTypeChange}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="city">Thành phố</MenuItem>
                            <MenuItem value="district">Quận/Huyện</MenuItem>
                            <MenuItem value="ward">Phường/Xã</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Cascade Filter: City -> District */}
                {(!filters.type ||
                    filters.type === "district" ||
                    filters.type === "ward") && (
                    <Box className="location-filters__row">
                        <FormControl
                            fullWidth
                            className="location-filters__field"
                        >
                            <InputLabel id="city-label">Thành phố</InputLabel>
                            <Select
                                labelId="city-label"
                                id="city"
                                value={filters.city_id || ""}
                                label="Thành phố"
                                onChange={handleCityChange}
                                disabled={loadingCities}
                                endAdornment={
                                    loadingCities ? (
                                        <CircularProgress size={20} />
                                    ) : null
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
                )}

                {/* Cascade Filter: District (chỉ hiển thị khi đã chọn city) */}
                {filters.city_id &&
                    (!filters.type || filters.type === "ward") && (
                        <Box className="location-filters__row">
                            <FormControl
                                fullWidth
                                className="location-filters__field"
                            >
                                <InputLabel id="district-label">
                                    Quận/Huyện
                                </InputLabel>
                                <Select
                                    labelId="district-label"
                                    id="district"
                                    value={filters.district_id || ""}
                                    label="Quận/Huyện"
                                    onChange={handleDistrictChange}
                                    disabled={loadingDistricts}
                                    endAdornment={
                                        loadingDistricts ? (
                                            <CircularProgress size={20} />
                                        ) : null
                                    }
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {districts.map((district) => (
                                        <MenuItem
                                            key={district.id}
                                            value={district.id}
                                        >
                                            {district.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                {/* Fallback: Generic parent selector */}
                <Box className="location-filters__row">
                    <FormControl fullWidth className="location-filters__field">
                        <InputLabel id="parent-label">
                            Địa điểm cha (tùy chọn)
                        </InputLabel>
                        <Select
                            labelId="parent-label"
                            id="parent"
                            value={filters.parent_id || ""}
                            label="Địa điểm cha (tùy chọn)"
                            onChange={handleParentChange}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {getParentOptions().map((parent) => (
                                <MenuItem key={parent.id} value={parent.id}>
                                    {parent.name} (
                                    {parent.type === "city"
                                        ? "Thành phố"
                                        : "Quận/Huyện"}
                                    )
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="vi"
                >
                    <Box className="location-filters__row location-filters__date-row">
                        <DatePicker
                            label="Tạo từ ngày"
                            value={
                                filters.from_date
                                    ? dayjs(filters.from_date)
                                    : null
                            }
                            onChange={handleFromDateChange}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    className: "location-filters__date-field",
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
                                    className: "location-filters__date-field",
                                },
                            }}
                        />
                    </Box>
                </LocalizationProvider>

                {hasActiveFilters && (
                    <Box className="location-filters__actions">
                        <Button
                            variant="outlined"
                            startIcon={<X size={18} />}
                            onClick={onReset}
                            className="location-filters__reset-btn"
                        >
                            Xóa bộ lọc
                        </Button>
                    </Box>
                )}
            </div>
        </div>
    );
};

export default LocationFilters;
