import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Filter, X } from "lucide-react";
import { toast } from "react-toastify";
import { adminTripStationService } from "../../../services/admin/tripStationService";
import { adminRouteService } from "../../../services/admin/routeService";
import { adminLocationService } from "../../../services/admin/locationService";
import TripStationDataGrid from "./components/TripStationDataGrid";
import TripStationFilters from "./components/TripStationFilters";
import TripStationForm from "./components/TripStationForm";
import "./TripStationManagement.scss";
import { getErrorMessage } from "../../../utils/error";

const TripStationManagement = () => {
    const [tripStations, setTripStations] = useState([]);
    const [loading, setLoading] = useState(false);
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

    // Load trip stations
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

    useEffect(() => {
        loadTripStations();
    }, [loadTripStations]);

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
        if (!window.confirm(`Bạn có chắc muốn xóa trạm tuyến này?`)) {
            return;
        }

        try {
            await adminTripStationService.deleteTripStation(station.id);
            toast.success("Xóa trạm tuyến thành công");
            loadTripStations();
        } catch (error) {
            toast.error(getErrorMessage(error, "Không thể xóa trạm tuyến"));
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            if (formMode === "create") {
                await adminTripStationService.createTripStation(data);
                toast.success("Tạo trạm tuyến thành công");
            } else {
                await adminTripStationService.updateTripStation(editingStation.id, data);
                toast.success("Cập nhật trạm tuyến thành công");
            }
            setFormOpen(false);
            loadTripStations();
        } catch (error) {
            toast.error(
                getErrorMessage(
                    error,
                    formMode === "create"
                        ? "Không thể tạo trạm tuyến"
                        : "Không thể cập nhật trạm tuyến"
                )
            );
            throw error;
        }
    };

    const hasActiveFilters = Object.values(filters).some((value) => value !== "");

    // Tính toán stats
    const stats = {
        total: pagination.total,
        avgPrice:
            tripStations.length > 0
                ? Math.round(
                      tripStations.reduce((sum, s) => sum + (s.price || 0), 0) /
                          tripStations.length
                  )
                : 0,
        avgDuration:
            tripStations.length > 0
                ? Math.round(
                      tripStations.reduce(
                          (sum, s) => sum + (s.duration_minutes || 0),
                          0
                      ) / tripStations.length
                  )
                : 0,
    };

    return (
        <div className="trip-station-management">
            <div className="trip-station-management__header">
                <div>
                    <h1 className="trip-station-management__title">
                        Quản lý trạm tuyến
                    </h1>
                    <p className="trip-station-management__subtitle">
                        Quản lý các điểm đón, điểm trả, giá vé và thời gian di
                        chuyển
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
                        Thêm trạm tuyến
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="trip-station-management__stats">
                <div className="trip-station-management__stat-card">
                    <div className="trip-station-management__stat-label">
                        Tổng số trạm
                    </div>
                    <div className="trip-station-management__stat-value">
                        {stats.total}
                    </div>
                </div>
                <div className="trip-station-management__stat-card">
                    <div className="trip-station-management__stat-label">
                        Giá trung bình
                    </div>
                    <div className="trip-station-management__stat-value">
                        {stats.avgPrice.toLocaleString("vi-VN")}đ
                    </div>
                </div>
                <div className="trip-station-management__stat-card">
                    <div className="trip-station-management__stat-label">
                        Thời gian TB
                    </div>
                    <div className="trip-station-management__stat-value">
                        {Math.floor(stats.avgDuration / 60)}h{" "}
                        {stats.avgDuration % 60}m
                    </div>
                </div>
            </div>

            {/* Search Bar */}
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

            {/* Data Grid */}
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

