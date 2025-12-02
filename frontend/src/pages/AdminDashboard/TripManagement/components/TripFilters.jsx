import React, { useEffect, useState } from "react";
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Button,
    Collapse,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { adminLocationService } from "../../../../services/admin/locationService";
import { adminRouteService } from "../../../../services/admin/routeService";
import { adminBusService } from "../../../../services/admin/busService";
import "./TripFilters.scss";

dayjs.locale("vi");

const TripFilters = ({ filters, onFilterChange, onReset }) => {
    const [cities, setCities] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [loadingBuses, setLoadingBuses] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoadingCities(true);
            setLoadingRoutes(true);
            setLoadingBuses(true);

            try {
                const [citiesRes, routesRes, busesRes] = await Promise.all([
                    adminLocationService.getCities(),
                    adminRouteService.getRoutes({ per_page: 1000 }),
                    adminBusService.getBuses({ per_page: 1000 }),
                ]);

                if (citiesRes?.data) {
                    setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);
                }
                if (routesRes?.data) {
                    // Handle both array and paginated response
                    const routesData = routesRes.data;
                    setRoutes(Array.isArray(routesData) ? routesData : (routesData?.data || []));
                }
                if (busesRes?.data) {
                    // Handle both array and paginated response
                    const busesData = busesRes.data;
                    setBuses(Array.isArray(busesData) ? busesData : (busesData?.data || []));
                }
            } catch (error) {
                console.error("Failed to load filter data", error);
                // Set empty arrays on error to prevent map errors
                setCities([]);
                setRoutes([]);
                setBuses([]);
            } finally {
                setLoadingCities(false);
                setLoadingRoutes(false);
                setLoadingBuses(false);
            }
        };

        loadData();
    }, []);

    const handleChange = (field, value) => {
        onFilterChange({
            ...filters,
            [field]: value,
        });
    };

    const hasActiveFilters =
        filters.route_id ||
        filters.status ||
        filters.bus_id ||
        filters.date_from ||
        filters.date_to ||
        filters.from_city ||
        filters.to_city ||
        filters.direction;

    const statusOptions = [
        { value: "scheduled", label: "Đã lên lịch" },
        { value: "running", label: "Đang chạy" },
        { value: "finished", label: "Hoàn thành" },
        { value: "cancelled", label: "Đã hủy" },
    ];

    const directionOptions = [
        { value: "forward", label: "Chiều đi" },
        { value: "backward", label: "Chiều về" },
    ];

    return (
        <div className="trip-filters">
            <div
                className="trip-filters__header"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="trip-filters__header-left">
                    <Filter size={18} />
                    <h3 className="trip-filters__title">Bộ lọc</h3>
                    {hasActiveFilters && (
                        <span className="trip-filters__badge">
                            {Object.values(filters).filter((v) => v).length}
                        </span>
                    )}
                </div>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            <Collapse in={expanded}>
                <div className="trip-filters__content">
                    <div className="trip-filters__grid">
                        <FormControl fullWidth size="small" className="trip-filters__field">
                            <InputLabel id="route-label">Tuyến đường</InputLabel>
                            <Select
                                labelId="route-label"
                                value={filters.route_id || ""}
                                label="Tuyến đường"
                                onChange={(event) =>
                                    handleChange("route_id", event.target.value)
                                }
                                disabled={loadingRoutes}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {Array.isArray(routes) && routes.map((route) => (
                                    <MenuItem key={route.id} value={route.id}>
                                        {route.name || `Tuyến #${route.id}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" className="trip-filters__field">
                            <InputLabel id="status-label">Trạng thái</InputLabel>
                            <Select
                                labelId="status-label"
                                value={filters.status || ""}
                                label="Trạng thái"
                                onChange={(event) =>
                                    handleChange("status", event.target.value)
                                }
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" className="trip-filters__field">
                            <InputLabel id="bus-label">Xe bus</InputLabel>
                            <Select
                                labelId="bus-label"
                                value={filters.bus_id || ""}
                                label="Xe bus"
                                onChange={(event) =>
                                    handleChange("bus_id", event.target.value)
                                }
                                disabled={loadingBuses}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {Array.isArray(buses) && buses.map((bus) => (
                                    <MenuItem key={bus.id} value={bus.id}>
                                        {bus.license_plate || bus.plate_number || `Xe #${bus.id}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" className="trip-filters__field">
                            <InputLabel id="from-city-label">
                                Thành phố đi
                            </InputLabel>
                            <Select
                                labelId="from-city-label"
                                value={filters.from_city || ""}
                                label="Thành phố đi"
                                onChange={(event) =>
                                    handleChange("from_city", event.target.value)
                                }
                                disabled={loadingCities}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {Array.isArray(cities) && cities.map((city) => (
                                    <MenuItem key={city.id} value={city.id}>
                                        {city.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" className="trip-filters__field">
                            <InputLabel id="to-city-label">Thành phố đến</InputLabel>
                            <Select
                                labelId="to-city-label"
                                value={filters.to_city || ""}
                                label="Thành phố đến"
                                onChange={(event) =>
                                    handleChange("to_city", event.target.value)
                                }
                                disabled={loadingCities}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {Array.isArray(cities) && cities.map((city) => (
                                    <MenuItem key={city.id} value={city.id}>
                                        {city.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" className="trip-filters__field">
                            <InputLabel id="direction-label">Hướng</InputLabel>
                            <Select
                                labelId="direction-label"
                                value={filters.direction || ""}
                                label="Hướng"
                                onChange={(event) =>
                                    handleChange("direction", event.target.value)
                                }
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                {directionOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>

                    <LocalizationProvider
                        dateAdapter={AdapterDayjs}
                        adapterLocale="vi"
                    >
                        <div className="trip-filters__date-row">
                            <DatePicker
                                label="Từ ngày"
                                value={
                                    filters.date_from
                                        ? dayjs(filters.date_from)
                                        : null
                                }
                                onChange={(date) =>
                                    handleChange(
                                        "date_from",
                                        date ? date.format("YYYY-MM-DD") : ""
                                    )
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        className: "trip-filters__date-field",
                                    },
                                }}
                            />
                            <DatePicker
                                label="Đến ngày"
                                value={
                                    filters.date_to
                                        ? dayjs(filters.date_to)
                                        : null
                                }
                                onChange={(date) =>
                                    handleChange(
                                        "date_to",
                                        date ? date.format("YYYY-MM-DD") : ""
                                    )
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        className: "trip-filters__date-field",
                                    },
                                }}
                            />
                        </div>
                    </LocalizationProvider>

                    {hasActiveFilters && (
                        <div className="trip-filters__actions">
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<X size={16} />}
                                onClick={onReset}
                                className="trip-filters__reset-btn"
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    )}
                </div>
            </Collapse>
        </div>
    );
};

export default TripFilters;
