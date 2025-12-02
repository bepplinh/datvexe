import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, XCircle, List, Calendar } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
    fetchTrips,
    createTrip as createTripThunk,
    updateTrip as updateTripThunk,
    deleteTrip as deleteTripThunk,
} from "../../../store/slices/tripSlice";
import CircularIndeterminate from "../../../components/Loading/Loading";
import TripDataGrid from "./components/TripDataGrid";
import TripGroupedView from "./components/TripGroupedView";
import TripDateSelector from "./components/TripDateSelector";
import TripFilters from "./components/TripFilters";
import TripForm from "./components/TripForm";
import TripDetailModal from "./components/TripDetailModal";
import "./TripManagement.scss";
import { getErrorMessage } from "../../../utils/error";

const TripManagement = () => {
    const dispatch = useAppDispatch();
    const { trips, loading, error, pagination } = useAppSelector(
        (state) => state.trip
    );

    const [filteredTrips, setFilteredTrips] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        route_id: "",
        status: "",
        bus_id: "",
        date_from: "",
        date_to: "",
        from_city: "",
        to_city: "",
        direction: "",
    });
    const [sortOption, setSortOption] = useState("newest");
    const [activeQuickFilter, setActiveQuickFilter] = useState("all");
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [editingTrip, setEditingTrip] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [viewMode, setViewMode] = useState("date-selector"); // "list", "grouped", or "date-selector"

    useEffect(() => {
        const params = {
            per_page: 1000,
            ...filters,
        };
        dispatch(fetchTrips(params));
    }, [dispatch, filters]);


    useEffect(() => {
        let result = [...trips];

        if (filters.route_id) {
            result = result.filter(
                (trip) => String(trip.route_id) === String(filters.route_id)
            );
        }

        if (filters.status) {
            result = result.filter(
                (trip) => trip.status === filters.status
            );
        }

        if (filters.bus_id) {
            result = result.filter(
                (trip) => String(trip.bus_id) === String(filters.bus_id)
            );
        }

        if (filters.date_from) {
            const fromDate = new Date(filters.date_from);
            fromDate.setHours(0, 0, 0, 0);
            result = result.filter((trip) => {
                if (!trip.departure_time) return false;
                const tripDate = new Date(trip.departure_time);
                tripDate.setHours(0, 0, 0, 0);
                return tripDate >= fromDate;
            });
        }

        if (filters.date_to) {
            const toDate = new Date(filters.date_to);
            toDate.setHours(23, 59, 59, 999);
            result = result.filter((trip) => {
                if (!trip.departure_time) return false;
                const tripDate = new Date(trip.departure_time);
                return tripDate <= toDate;
            });
        }

        if (filters.from_city) {
            result = result.filter((trip) => {
                if (!trip.route) return false;
                const route = trip.route;
                if (route.from_city) {
                    return String(route.from_city) === String(filters.from_city);
                }
                return false;
            });
        }

        if (filters.to_city) {
            result = result.filter((trip) => {
                if (!trip.route) return false;
                const route = trip.route;
                if (route.to_city) {
                    return String(route.to_city) === String(filters.to_city);
                }
                return false;
            });
        }

        if (searchQuery.trim()) {
            const keyword = searchQuery.toLowerCase();
            result = result.filter((trip) => {
                const routeName = trip.route?.name || "";
                const busPlate = trip.bus?.license_plate || "";
                const tripId = String(trip.id);
                return (
                    routeName.toLowerCase().includes(keyword) ||
                    busPlate.toLowerCase().includes(keyword) ||
                    tripId.includes(keyword)
                );
            });
        }

        if (activeQuickFilter === "scheduled") {
            result = result.filter((trip) => trip.status === "scheduled");
        } else if (activeQuickFilter === "running") {
            result = result.filter((trip) => trip.status === "running");
        } else if (activeQuickFilter === "today") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            result = result.filter((trip) => {
                if (!trip.departure_time) return false;
                const tripDate = new Date(trip.departure_time);
                return tripDate >= today && tripDate < tomorrow;
            });
        } else if (activeQuickFilter === "upcoming") {
            const now = new Date();
            result = result.filter((trip) => {
                if (!trip.departure_time) return false;
                const tripDate = new Date(trip.departure_time);
                return tripDate > now;
            });
        }

        result.sort((a, b) => {
            if (sortOption === "departure-asc") {
                const dateA = a.departure_time
                    ? new Date(a.departure_time).getTime()
                    : 0;
                const dateB = b.departure_time
                    ? new Date(b.departure_time).getTime()
                    : 0;
                return dateA - dateB;
            }
            if (sortOption === "departure-desc") {
                const dateA = a.departure_time
                    ? new Date(a.departure_time).getTime()
                    : 0;
                const dateB = b.departure_time
                    ? new Date(b.departure_time).getTime()
                    : 0;
                return dateB - dateA;
            }
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            if (sortOption === "oldest") {
                return dateA - dateB;
            }
            return dateB - dateA;
        });

        setFilteredTrips(result);
    }, [
        trips,
        filters,
        searchQuery,
        sortOption,
        activeQuickFilter,
    ]);

    const quickFilters = [
        { key: "all", label: "Tất cả chuyến" },
        { key: "scheduled", label: "Đã lên lịch" },
        { key: "running", label: "Đang chạy" },
        { key: "today", label: "Hôm nay" },
        { key: "upcoming", label: "Sắp tới" },
    ];

    const handleQuickFilter = (filter) => {
        setActiveQuickFilter(filter.key);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            route_id: "",
            status: "",
            bus_id: "",
            date_from: "",
            date_to: "",
            from_city: "",
            to_city: "",
            direction: "",
        });
    };

    const handleAddTrip = () => {
        setFormMode("create");
        setEditingTrip(null);
        setFormOpen(true);
    };

    const handleEditTrip = (trip) => {
        setFormMode("edit");
        setEditingTrip(trip);
        setFormOpen(true);
    };

    const handleViewTrip = (trip) => {
        setSelectedTrip(trip);
        setDetailModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        if (formMode === "edit" && editingTrip) {
            await dispatch(
                updateTripThunk({
                    id: editingTrip.id,
                    tripData: formData,
                })
            ).unwrap();
        } else {
            await dispatch(createTripThunk(formData)).unwrap();
        }
        setFormOpen(false);
        setEditingTrip(null);
        const params = {
            per_page: 1000,
            ...filters,
        };
        dispatch(fetchTrips(params));
    };

    const handleDeleteRequest = (trip) => {
        setTripToDelete(trip);
        setDeleteDialogOpen(true);
        setDeleteError("");
    };

    const handleConfirmDelete = async () => {
        if (!tripToDelete) return;
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await dispatch(deleteTripThunk(tripToDelete.id)).unwrap();
            setDeleteDialogOpen(false);
            setTripToDelete(null);
            const params = {
                per_page: 1000,
                ...filters,
            };
            dispatch(fetchTrips(params));
        } catch (err) {
            setDeleteError(
                getErrorMessage(
                    err,
                    "Không thể xóa chuyến xe. Vui lòng thử lại."
                )
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        if (deleteLoading) return;
        setDeleteDialogOpen(false);
        setTripToDelete(null);
        setDeleteError("");
    };

    return (
        <div className="trip-management">
            <div className="trip-management__container">
                <div className="trip-management__header">
                    <div>
                        <h1 className="trip-management__title">
                            Quản lý chuyến xe
                        </h1>
                        <p className="trip-management__subtitle">
                            Theo dõi và vận hành tất cả chuyến xe trong hệ
                            thống
                        </p>
                    </div>
                    <button
                        className="trip-management__add-btn"
                        onClick={handleAddTrip}
                    >
                        <Plus size={20} />
                        <span>Thêm chuyến mới</span>
                    </button>
                </div>

                <div className="trip-management__actions">
                    <div className="trip-management__actions-left">
                        <div className="trip-management__search">
                            <label htmlFor="trip-search">
                                Tìm kiếm chuyến xe
                            </label>
                            <div className="trip-management__search-input">
                                <Search size={18} color="#6c757d" />
                                <input
                                    id="trip-search"
                                    type="text"
                                    placeholder="Nhập ID, tuyến đường, biển số xe..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="trip-management__quick-filters">
                            {quickFilters.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    className={`trip-management__chip ${
                                        activeQuickFilter === filter.key
                                            ? "trip-management__chip--active"
                                            : ""
                                    }`}
                                    onClick={() => handleQuickFilter(filter)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="trip-management__sort">
                            <label htmlFor="trip-sort">Sắp xếp</label>
                            <select
                                id="trip-sort"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                                <option value="departure-asc">
                                    Khởi hành sớm nhất
                                </option>
                                <option value="departure-desc">
                                    Khởi hành muộn nhất
                                </option>
                            </select>
                        </div>

                        <div className="trip-management__view-toggle">
                            <label>Chế độ xem</label>
                            <div className="trip-management__view-buttons">
                                <button
                                    type="button"
                                    className={`trip-management__view-btn ${
                                        viewMode === "date-selector"
                                            ? "trip-management__view-btn--active"
                                            : ""
                                    }`}
                                    onClick={() => setViewMode("date-selector")}
                                    title="Chọn ngày và tuyến"
                                >
                                    <Calendar size={18} />
                                    <span>Chọn ngày/tuyến</span>
                                </button>
                                <button
                                    type="button"
                                    className={`trip-management__view-btn ${
                                        viewMode === "list"
                                            ? "trip-management__view-btn--active"
                                            : ""
                                    }`}
                                    onClick={() => setViewMode("list")}
                                    title="Xem danh sách"
                                >
                                    <List size={18} />
                                    <span>Danh sách</span>
                                </button>
                                <button
                                    type="button"
                                    className={`trip-management__view-btn ${
                                        viewMode === "grouped"
                                            ? "trip-management__view-btn--active"
                                            : ""
                                    }`}
                                    onClick={() => setViewMode("grouped")}
                                    title="Xem theo ngày và tuyến"
                                >
                                    <Calendar size={18} />
                                    <span>Nhóm</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="trip-management__actions-right">
                        <TripFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onReset={handleResetFilters}
                        />
                    </div>
                </div>

                <div className="trip-management__content">
                    {loading ? (
                        <div className="trip-management__loading">
                            <CircularIndeterminate />
                        </div>
                    ) : error ? (
                        <div className="trip-management__empty">
                            <p style={{ color: "#dc3545" }}>{error}</p>
                            <button
                                type="button"
                                className="trip-management__reset-btn"
                                onClick={() => {
                                    const params = {
                                        per_page: 1000,
                                        ...filters,
                                    };
                                    dispatch(fetchTrips(params));
                                }}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : viewMode === "date-selector" ? (
                        <TripDateSelector trips={trips} />
                    ) : viewMode === "grouped" ? (
                        <TripGroupedView
                            trips={filteredTrips}
                            onView={handleViewTrip}
                            onEdit={handleEditTrip}
                            onDelete={handleDeleteRequest}
                        />
                    ) : (
                        <TripDataGrid
                            trips={filteredTrips}
                            onView={handleViewTrip}
                            onEdit={handleEditTrip}
                            onDelete={handleDeleteRequest}
                        />
                    )}
                </div>

                <TripForm
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    initialData={formMode === "edit" ? editingTrip : null}
                />

                <TripDetailModal
                    open={detailModalOpen}
                    onClose={() => {
                        setDetailModalOpen(false);
                        setSelectedTrip(null);
                    }}
                    trip={selectedTrip}
                />
            </div>

            {deleteDialogOpen && (
                <div className="trip-management__confirm-overlay">
                    <div className="trip-management__confirm-modal">
                        <h3>Xóa chuyến xe</h3>
                        <p>
                            Bạn có chắc muốn xóa chuyến xe{" "}
                            <strong>
                                #{tripToDelete?.id} -{" "}
                                {tripToDelete?.route?.name ||
                                    `Tuyến #${tripToDelete?.route_id}`}
                            </strong>
                            ? Hành động này không thể hoàn tác.
                        </p>
                        {deleteError && (
                            <p className="trip-management__confirm-error">
                                {deleteError}
                            </p>
                        )}
                        <div className="trip-management__confirm-actions">
                            <button
                                type="button"
                                className="trip-management__confirm-btn trip-management__confirm-btn--cancel"
                                onClick={handleCloseDeleteDialog}
                                disabled={deleteLoading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="trip-management__confirm-btn trip-management__confirm-btn--danger"
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripManagement;

