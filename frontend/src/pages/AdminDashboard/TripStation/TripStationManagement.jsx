import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Search, Filter, X, List, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { ToggleButtonGroup, ToggleButton, Tooltip } from "@mui/material";
import RouteIcon from "@mui/icons-material/Route";
import PaidIcon from "@mui/icons-material/Paid";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { adminTripStationService } from "../../../services/admin/tripStationService";
import { adminRouteService } from "../../../services/admin/routeService";
import { adminLocationService } from "../../../services/admin/locationService";
import TripStationDataGrid from "./components/TripStationDataGrid";
import TripStationFilters from "./components/TripStationFilters";
import TripStationForm from "./components/TripStationForm";
import TripStationGroupedView from "./components/TripStationGroupedView";
import "./TripStationManagement.scss";
import { getErrorMessage } from "../../../utils/error";

const TripStationManagement = () => {
    const [tripStations, setTripStations] = useState([]);
    const [allStations, setAllStations] = useState([]); // For grouped view (no pagination)
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'grouped'
    const [groupBy, setGroupBy] = useState("from"); // 'from' or 'to'
    const [filters, setFilters] = useState({
        route_id: "",
        from_location_id: "",
        to_location_id: "",
        price_min: "",
        price_max: "",
        duration_min: "",
        duration_max: "",
        q: "",
    });
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });
    const [sortBy, setSortBy] = useState("id");
    const [sortDir, setSortDir] = useState("desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [editingStation, setEditingStation] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [locations, setLocations] = useState([]);

    // Load routes và locations cho dropdowns
    useEffect(() => {
        const loadData = async () => {
            try {
                const [routesRes, locationsRes] = await Promise.all([
                    adminRouteService.getRoutes({ per_page: 1000 }),
                    adminLocationService.getLocations({ per_page: 1000 }),
                ]);

                if (routesRes?.data) {
                    const routesData = Array.isArray(routesRes.data)
                        ? routesRes.data
                        : routesRes.data?.data || [];
                    setRoutes(routesData);
                }

                if (locationsRes?.data) {
                    const locationsData = Array.isArray(locationsRes.data)
                        ? locationsRes.data
                        : locationsRes.data?.data || [];
                    setLocations(locationsData);
                }
            } catch (error) {
                console.error("Failed to load data", error);
            }
        };

        loadData();
    }, []);

    // Load trip stations for table view (paginated)
    const loadTripStations = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                per_page: pagination.per_page,
                sort_by: sortBy,
                sort_dir: sortDir,
                ...filters,
            };

            if (searchQuery) {
                params.q = searchQuery;
            }

            const response = await adminTripStationService.getTripStations(params);

            if (response?.success && response?.data) {
                const data = response.data;
                setTripStations(data.data || []);
                setPagination({
                    page: data.current_page || 1,
                    per_page: data.per_page || 15,
                    total: data.total || 0,
                    last_page: data.last_page || 1,
                });
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Không thể tải danh sách trạm tuyến"));
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.per_page, sortBy, sortDir, filters, searchQuery]);

    // Load all stations for grouped view (no pagination)
    const loadAllStations = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                per_page: 1000,
                ...filters,
            };

            if (searchQuery) {
                params.q = searchQuery;
            }

            const response = await adminTripStationService.getTripStations(params);

            if (response?.success && response?.data) {
                const data = response.data;
                setAllStations(data.data || []);
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Không thể tải danh sách trạm tuyến"));
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery]);

    useEffect(() => {
        if (viewMode === "table") {
            loadTripStations();
        } else {
            loadAllStations();
        }
    }, [viewMode, loadTripStations, loadAllStations]);

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const handleGroupByChange = (event, newGroupBy) => {
        if (newGroupBy !== null) {
            setGroupBy(newGroupBy);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilters = () => {
        setFilters({
            route_id: "",
            from_location_id: "",
            to_location_id: "",
            price_min: "",
            price_max: "",
            duration_min: "",
            duration_max: "",
            q: "",
        });
        setSearchQuery("");
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handlePerPageChange = (newPerPage) => {
        setPagination((prev) => ({ ...prev, per_page: newPerPage, page: 1 }));
    };

    const handleSortChange = (newSortBy, newSortDir) => {
        setSortBy(newSortBy);
        setSortDir(newSortDir);
    };

    const handleCreate = () => {
        setFormMode("create");
        setEditingStation(null);
        setFormOpen(true);
    };

    const handleEdit = (station) => {
        setFormMode("edit");
        setEditingStation(station);
        setFormOpen(true);
    };

    const handleDelete = async (station) => {
        if (!window.confirm(`Bạn có chắc muốn xóa chặng này?`)) {
            return;
        }

        try {
            await adminTripStationService.deleteTripStation(station.id);
            toast.success("Xóa chặng thành công");
            if (viewMode === "table") {
                loadTripStations();
            } else {
                loadAllStations();
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Không thể xóa chặng"));
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            if (formMode === "create") {
                await adminTripStationService.createTripStation(data);
                toast.success("Tạo chặng thành công");
            } else {
                await adminTripStationService.updateTripStation(editingStation.id, data);
                toast.success("Cập nhật chặng thành công");
            }
            setFormOpen(false);
            if (viewMode === "table") {
                loadTripStations();
            } else {
                loadAllStations();
            }
        } catch (error) {
            toast.error(
                getErrorMessage(
                    error,
                    formMode === "create"
                        ? "Không thể tạo chặng"
                        : "Không thể cập nhật chặng"
                )
            );
            throw error;
        }
    };

    const hasActiveFilters = Object.values(filters).some((value) => value !== "");

    // Calculate stats
    const stats = useMemo(() => {
        const stationsToUse = viewMode === "table" ? tripStations : allStations;
        const uniqueLocations = new Set();

        stationsToUse.forEach((s) => {
            uniqueLocations.add(s.from_location_id);
            uniqueLocations.add(s.to_location_id);
        });

        return {
            total: viewMode === "table" ? pagination.total : allStations.length,
            avgPrice:
                stationsToUse.length > 0
                    ? Math.round(
                        stationsToUse.reduce((sum, s) => sum + (s.price || 0), 0) /
                        stationsToUse.length
                    )
                    : 0,
            avgDuration:
                stationsToUse.length > 0
                    ? Math.round(
                        stationsToUse.reduce(
                            (sum, s) => sum + (s.duration_minutes || 0),
                            0
                        ) / stationsToUse.length
                    )
                    : 0,
            uniqueLocations: uniqueLocations.size,
        };
    }, [tripStations, allStations, viewMode, pagination.total]);

    return (
        <div className="trip-station-management">
            <div className="trip-station-management__header">
                <div>
                    <h1 className="trip-station-management__title">
                        Quản lý chặng
                    </h1>
                    <p className="trip-station-management__subtitle">
                        Quản lý các điểm đón, điểm trả, giá vé và thời gian di chuyển
                    </p>
                </div>
                <div className="trip-station-management__actions">
                    <button
                        className="trip-station-management__filter-btn"
                        onClick={() => setShowFilters(!showFilters)}
                        data-active={showFilters || hasActiveFilters}
                    >
                        <Filter size={20} />
                        {hasActiveFilters && (
                            <span className="trip-station-management__filter-badge">
                                {Object.values(filters).filter((v) => v !== "").length}
                            </span>
                        )}
                    </button>
                    <button
                        className="trip-station-management__add-btn"
                        onClick={handleCreate}
                    >
                        <Plus size={20} />
                        Thêm chặng
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="trip-station-management__stats">
                <div className="trip-station-management__stat-card trip-station-management__stat-card--blue">
                    <div className="trip-station-management__stat-icon">
                        <RouteIcon />
                    </div>
                    <div className="trip-station-management__stat-content">
                        <div className="trip-station-management__stat-label">
                            Tổng số chặng
                        </div>
                        <div className="trip-station-management__stat-value">
                            {stats.total}
                        </div>
                    </div>
                </div>
                <div className="trip-station-management__stat-card trip-station-management__stat-card--green">
                    <div className="trip-station-management__stat-icon">
                        <PaidIcon />
                    </div>
                    <div className="trip-station-management__stat-content">
                        <div className="trip-station-management__stat-label">
                            Giá trung bình
                        </div>
                        <div className="trip-station-management__stat-value">
                            {stats.avgPrice.toLocaleString("vi-VN")}đ
                        </div>
                    </div>
                </div>
                <div className="trip-station-management__stat-card trip-station-management__stat-card--orange">
                    <div className="trip-station-management__stat-icon">
                        <AccessTimeIcon />
                    </div>
                    <div className="trip-station-management__stat-content">
                        <div className="trip-station-management__stat-label">
                            Thời gian TB
                        </div>
                        <div className="trip-station-management__stat-value">
                            {Math.floor(stats.avgDuration / 60)}h {stats.avgDuration % 60}m
                        </div>
                    </div>
                </div>
                <div className="trip-station-management__stat-card trip-station-management__stat-card--purple">
                    <div className="trip-station-management__stat-icon">
                        <LocationOnIcon />
                    </div>
                    <div className="trip-station-management__stat-content">
                        <div className="trip-station-management__stat-label">
                            Số địa điểm
                        </div>
                        <div className="trip-station-management__stat-value">
                            {stats.uniqueLocations}
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Toggle & Search */}
            <div className="trip-station-management__toolbar">
                <div className="trip-station-management__view-toggle">
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                        className="trip-station-management__toggle-group"
                    >
                        <ToggleButton value="table">
                            <Tooltip title="Xem danh sách">
                                <div className="trip-station-management__toggle-content">
                                    <List size={18} />
                                    <span>Danh sách</span>
                                </div>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="grouped">
                            <Tooltip title="Nhóm theo địa điểm">
                                <div className="trip-station-management__toggle-content">
                                    <MapPin size={18} />
                                    <span>Nhóm địa điểm</span>
                                </div>
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {viewMode === "grouped" && (
                        <ToggleButtonGroup
                            value={groupBy}
                            exclusive
                            onChange={handleGroupByChange}
                            size="small"
                            className="trip-station-management__group-toggle"
                        >
                            <ToggleButton value="from">
                                <Tooltip title="Nhóm theo điểm đi">
                                    <span>Điểm đi</span>
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="to">
                                <Tooltip title="Nhóm theo điểm đến">
                                    <span>Điểm đến</span>
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    )}
                </div>

                <div className="trip-station-management__search">
                    <div className="trip-station-management__search-input-wrapper">
                        <Search size={20} className="trip-station-management__search-icon" />
                        <input
                            type="text"
                            className="trip-station-management__search-input"
                            placeholder="Tìm kiếm theo tuyến, địa điểm..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="trip-station-management__search-clear"
                                onClick={() => handleSearch("")}
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <TripStationFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                    routes={routes}
                    locations={locations}
                />
            )}

            {/* Content based on view mode */}
            {viewMode === "table" ? (
                <TripStationDataGrid
                    tripStations={tripStations}
                    loading={loading}
                    pagination={pagination}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                    onSortChange={handleSortChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    routes={routes}
                    locations={locations}
                />
            ) : (
                <TripStationGroupedView
                    tripStations={allStations}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    locations={locations}
                    groupBy={groupBy}
                />
            )}

            {/* Form Modal */}
            <TripStationForm
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingStation(null);
                }}
                onSubmit={handleFormSubmit}
                mode={formMode}
                initialData={editingStation}
                routes={routes}
                locations={locations}
            />
        </div>
    );
};

export default TripStationManagement;
