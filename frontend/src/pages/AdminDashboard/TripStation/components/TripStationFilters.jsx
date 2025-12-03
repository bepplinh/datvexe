import React from "react";
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Button,
} from "@mui/material";
import { Filter, X } from "lucide-react";
import "./TripStationFilters.scss";

const TripStationFilters = ({
    filters,
    onFilterChange,
    onReset,
    routes = [],
    locations = [],
}) => {
    const handleChange = (field, value) => {
        onFilterChange({
            ...filters,
            [field]: value,
        });
    };

    const hasActiveFilters =
        filters.route_id ||
        filters.from_location_id ||
        filters.to_location_id ||
        filters.price_min ||
        filters.price_max ||
        filters.duration_min ||
        filters.duration_max;

    return (
        <div className="trip-station-filters">
            <div className="trip-station-filters__header">
                <Filter size={20} />
                <h3 className="trip-station-filters__title">Bộ lọc trạm tuyến</h3>
            </div>

            <div className="trip-station-filters__content">
                <Box className="trip-station-filters__row">
                    <FormControl fullWidth className="trip-station-filters__field">
                        <InputLabel id="route-filter-label">Tuyến đường</InputLabel>
                        <Select
                            labelId="route-filter-label"
                            value={filters.route_id || ""}
                            label="Tuyến đường"
                            onChange={(e) => handleChange("route_id", e.target.value)}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {routes.map((route) => (
                                <MenuItem key={route.id} value={route.id}>
                                    {route.name || `Tuyến #${route.id}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box className="trip-station-filters__row">
                    <FormControl fullWidth className="trip-station-filters__field">
                        <InputLabel id="from-location-filter-label">
                            Điểm đón
                        </InputLabel>
                        <Select
                            labelId="from-location-filter-label"
                            value={filters.from_location_id || ""}
                            label="Điểm đón"
                            onChange={(e) =>
                                handleChange("from_location_id", e.target.value)
                            }
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {locations.map((location) => (
                                <MenuItem key={location.id} value={location.id}>
                                    {location.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box className="trip-station-filters__row">
                    <FormControl fullWidth className="trip-station-filters__field">
                        <InputLabel id="to-location-filter-label">Điểm trả</InputLabel>
                        <Select
                            labelId="to-location-filter-label"
                            value={filters.to_location_id || ""}
                            label="Điểm trả"
                            onChange={(e) =>
                                handleChange("to_location_id", e.target.value)
                            }
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            {locations.map((location) => (
                                <MenuItem key={location.id} value={location.id}>
                                    {location.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box className="trip-station-filters__row trip-station-filters__price-row">
                    <TextField
                        fullWidth
                        label="Giá tối thiểu (đ)"
                        type="number"
                        value={filters.price_min || ""}
                        onChange={(e) =>
                            handleChange("price_min", e.target.value || "")
                        }
                        className="trip-station-filters__number-field"
                        inputProps={{ min: 0 }}
                    />
                    <TextField
                        fullWidth
                        label="Giá tối đa (đ)"
                        type="number"
                        value={filters.price_max || ""}
                        onChange={(e) =>
                            handleChange("price_max", e.target.value || "")
                        }
                        className="trip-station-filters__number-field"
                        inputProps={{ min: 0 }}
                    />
                </Box>

                <Box className="trip-station-filters__row trip-station-filters__duration-row">
                    <TextField
                        fullWidth
                        label="Thời gian tối thiểu (phút)"
                        type="number"
                        value={filters.duration_min || ""}
                        onChange={(e) =>
                            handleChange("duration_min", e.target.value || "")
                        }
                        className="trip-station-filters__number-field"
                        inputProps={{ min: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Thời gian tối đa (phút)"
                        type="number"
                        value={filters.duration_max || ""}
                        onChange={(e) =>
                            handleChange("duration_max", e.target.value || "")
                        }
                        className="trip-station-filters__number-field"
                        inputProps={{ min: 1 }}
                    />
                </Box>
            </div>

            {hasActiveFilters && (
                <div className="trip-station-filters__actions">
                    <Button
                        variant="outlined"
                        startIcon={<X size={18} />}
                        onClick={onReset}
                        className="trip-station-filters__reset-btn"
                    >
                        Xóa bộ lọc
                    </Button>
                </div>
            )}
        </div>
    );
};

export default TripStationFilters;

