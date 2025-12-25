import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Eye,
    Clock,
    MapPin,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
    fetchTrips,
    createTrip as createTripThunk,
    updateTrip as updateTripThunk,
    deleteTrip as deleteTripThunk,
} from "../../../store/slices/tripSlice";
import CircularIndeterminate from "../../../components/Loading/Loading";
import TripForm from "./components/TripForm";
import TripDetailModal from "./components/TripDetailModal";
import { Chip } from "@mui/material";
import dayjs from "dayjs";
import "./TripRouteDetail.scss";
import { getErrorMessage } from "../../../utils/error";

const TripRouteDetail = () => {
    const { date, routeId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { trips, loading, error } = useAppSelector((state) => state.trip);

    const [selectedDate] = useState(date ? dayjs(date) : dayjs());
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [editingTrip, setEditingTrip] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        if (!routeId || !selectedDate) return;

        const dateStr = selectedDate.format("YYYY-MM-DD");
        const params = {
            per_page: 1000,
            route_id: routeId,
            date_from: dateStr,
            date_to: dateStr,
        };

        dispatch(fetchTrips(params));
    }, [dispatch, routeId, selectedDate]);

    const filteredTrips = useMemo(() => {
        if (!routeId || !selectedDate || !trips || trips.length === 0) {
            return [];
        }

        const targetDate = selectedDate.format("YYYY-MM-DD");
        const targetRouteId = parseInt(routeId);

        const filtered = trips.filter((trip) => {
            if (!trip.departure_time) return false;

            const tripDate = dayjs(trip.departure_time).format("YYYY-MM-DD");
            const tripRouteId = trip.route_id ? parseInt(trip.route_id) : null;

            return tripRouteId === targetRouteId && tripDate === targetDate;
        });

        return filtered;
    }, [trips, routeId, selectedDate]);

    const routeInfo = useMemo(() => {
        if (filteredTrips.length > 0) {
            return filteredTrips[0].route;
        }
        return null;
    }, [filteredTrips]);

    const getStatusChip = (status) => {
        const statusMap = {
            scheduled: { label: "Đã lên lịch", color: "info", bg: "#e3f2fd" },
            running: { label: "Đang chạy", color: "success", bg: "#e8f5e9" },
            finished: { label: "Hoàn thành", color: "default", bg: "#f5f5f5" },
            cancelled: { label: "Đã hủy", color: "error", bg: "#ffebee" },
        };

        const statusInfo = statusMap[status] || {
            label: status || "N/A",
            color: "default",
            bg: "#f5f5f5",
        };

        return (
            <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
                style={{ backgroundColor: statusInfo.bg }}
            />
        );
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return "N/A";
        try {
            const date = new Date(dateTime);
            return {
                date: date.toLocaleDateString("vi-VN", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }),
                time: date.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
        } catch {
            return { date: dateTime, time: "" };
        }
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
            // Set route_id and date for new trip
            const newTripData = {
                ...formData,
                route_id: parseInt(routeId),
                departure_time: dayjs(formData.departure_time)
                    .date(selectedDate.date())
                    .month(selectedDate.month())
                    .year(selectedDate.year())
                    .format("YYYY-MM-DD HH:mm:ss"),
            };
            await dispatch(createTripThunk(newTripData)).unwrap();
        }
        setFormOpen(false);
        setEditingTrip(null);
        const params = {
            per_page: 1000,
            route_id: routeId,
            date_from: selectedDate.format("YYYY-MM-DD"),
            date_to: selectedDate.format("YYYY-MM-DD"),
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
                route_id: routeId,
                date_from: selectedDate.format("YYYY-MM-DD"),
                date_to: selectedDate.format("YYYY-MM-DD"),
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

    // Sort trips by departure time
    const sortedTrips = useMemo(() => {
        if (!filteredTrips || filteredTrips.length === 0) return [];
        return [...filteredTrips].sort((a, b) => {
            const timeA = a.departure_time
                ? new Date(a.departure_time).getTime()
                : 0;
            const timeB = b.departure_time
                ? new Date(b.departure_time).getTime()
                : 0;
            return timeA - timeB;
        });
    }, [filteredTrips]);

    return (
        <div className="trip-route-detail">
            <div className="trip-route-detail__container">
                <div className="trip-route-detail__header">
                    <button
                        className="trip-route-detail__back-btn"
                        onClick={() => navigate("/admin/trips")}
                    >
                        <ArrowLeft size={20} />
                        <span>Quay lại</span>
                    </button>
                    <div className="trip-route-detail__header-info">
                        <div className="trip-route-detail__route-info">
                            <MapPin size={20} />
                            <h1 className="trip-route-detail__route-name">
                                {routeInfo?.name || `Tuyến #${routeId}`}
                            </h1>
                        </div>
                        <div className="trip-route-detail__date-info">
                            <Clock size={18} />
                            <span>
                                {selectedDate.format("dddd, DD/MM/YYYY")}
                            </span>
                        </div>
                    </div>
                    <button
                        className="trip-route-detail__add-btn"
                        onClick={handleAddTrip}
                    >
                        <Plus size={20} />
                        <span>Thêm chuyến</span>
                    </button>
                </div>

                <div className="trip-route-detail__content">
                    {loading ? (
                        <div className="trip-route-detail__loading">
                            <CircularIndeterminate />
                        </div>
                    ) : error ? (
                        <div className="trip-route-detail__empty">
                            <p style={{ color: "#dc3545" }}>{error}</p>
                            <button
                                type="button"
                                className="trip-route-detail__retry-btn"
                                onClick={() => {
                                    const params = {
                                        per_page: 1000,
                                        route_id: routeId,
                                        date_from:
                                            selectedDate.format("YYYY-MM-DD"),
                                        date_to:
                                            selectedDate.format("YYYY-MM-DD"),
                                    };
                                    dispatch(fetchTrips(params));
                                }}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : sortedTrips.length === 0 ? (
                        <div className="trip-route-detail__empty">
                            <p>
                                Không có chuyến nào trong ngày{" "}
                                {selectedDate.format("DD/MM/YYYY")} cho tuyến{" "}
                                {routeInfo?.name || `#${routeId}`}
                            </p>
                            <div className="trip-route-detail__debug-info">
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#6c757d",
                                    }}
                                >
                                    Đang tìm: Route ID {routeId}, Ngày{" "}
                                    {selectedDate.format("YYYY-MM-DD")}
                                </p>
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#6c757d",
                                    }}
                                >
                                    Tổng số chuyến đã load: {trips.length}
                                </p>
                            </div>
                            <button
                                className="trip-route-detail__add-first-btn"
                                onClick={handleAddTrip}
                            >
                                <Plus size={18} />
                                <span>Thêm chuyến đầu tiên</span>
                            </button>
                        </div>
                    ) : (
                        <div className="trip-route-detail__trips-grid">
                            {sortedTrips.map((trip) => {
                                const timeInfo = formatDateTime(
                                    trip.departure_time
                                );
                                return (
                                    <div
                                        key={trip.id}
                                        className="trip-route-detail__trip-card"
                                    >
                                        <div className="trip-route-detail__trip-header">
                                            <div className="trip-route-detail__trip-time">
                                                <Clock size={18} />
                                                <span className="trip-route-detail__trip-time-value">
                                                    {timeInfo.time}
                                                </span>
                                            </div>
                                            <div className="trip-route-detail__trip-status">
                                                {getStatusChip(trip.status)}
                                            </div>
                                        </div>
                                        <div className="trip-route-detail__trip-body">
                                            <div className="trip-route-detail__trip-info">
                                                <div className="trip-route-detail__trip-id">
                                                    Chuyến #{trip.id}
                                                </div>
                                                {trip.bus ? (
                                                    <>
                                                        <div className="trip-route-detail__trip-bus">
                                                            {trip.bus.plate_number ||
                                                                `Xe #${trip.bus.id}`}
                                                        </div>
                                                        <div className="trip-route-detail__trip-bus-id">
                                                            ID Bus: {trip.bus.id}
                                                        </div>
                                                        {(trip.bus.typeBus || trip.bus.type_bus) && (
                                                            <div className="trip-route-detail__trip-bus-type">
                                                                Loại: {(trip.bus.typeBus || trip.bus.type_bus)?.name || "N/A"}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="trip-route-detail__trip-bus">
                                                        Chưa gán xe
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="trip-route-detail__trip-actions">
                                            <button
                                                className="trip-route-detail__action-btn trip-route-detail__action-btn--view"
                                                onClick={() =>
                                                    handleViewTrip(trip)
                                                }
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16} />
                                                <span>Xem</span>
                                            </button>
                                            <button
                                                className="trip-route-detail__action-btn trip-route-detail__action-btn--edit"
                                                onClick={() =>
                                                    handleEditTrip(trip)
                                                }
                                                title="Chỉnh sửa"
                                            >
                                                <Edit size={16} />
                                                <span>Sửa</span>
                                            </button>
                                            <button
                                                className="trip-route-detail__action-btn trip-route-detail__action-btn--delete"
                                                onClick={() =>
                                                    handleDeleteRequest(trip)
                                                }
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                                <span>Xóa</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                <div className="trip-route-detail__confirm-overlay">
                    <div className="trip-route-detail__confirm-modal">
                        <h3>Xóa chuyến xe</h3>
                        <p>
                            Bạn có chắc muốn xóa chuyến xe{" "}
                            <strong>#{tripToDelete?.id}</strong>? Hành động này
                            không thể hoàn tác.
                        </p>
                        {deleteError && (
                            <p className="trip-route-detail__confirm-error">
                                {deleteError}
                            </p>
                        )}
                        <div className="trip-route-detail__confirm-actions">
                            <button
                                type="button"
                                className="trip-route-detail__confirm-btn trip-route-detail__confirm-btn--cancel"
                                onClick={handleCloseDeleteDialog}
                                disabled={deleteLoading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="trip-route-detail__confirm-btn trip-route-detail__confirm-btn--danger"
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

export default TripRouteDetail;
