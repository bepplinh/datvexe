import React, { useMemo, useState } from "react";
import { Calendar, MapPin, Clock, Edit, Trash2, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { Chip } from "@mui/material";
import "./TripGroupedView.scss";

const TripGroupedView = ({ trips = [], onView, onEdit, onDelete }) => {
    const [expandedDates, setExpandedDates] = useState(new Set());
    const [expandedRoutes, setExpandedRoutes] = useState(new Set());

    const toggleDate = (dateKey) => {
        const newExpanded = new Set(expandedDates);
        if (newExpanded.has(dateKey)) {
            newExpanded.delete(dateKey);
        } else {
            newExpanded.add(dateKey);
        }
        setExpandedDates(newExpanded);
    };

    const toggleRoute = (routeKey) => {
        const newExpanded = new Set(expandedRoutes);
        if (newExpanded.has(routeKey)) {
            newExpanded.delete(routeKey);
        } else {
            newExpanded.add(routeKey);
        }
        setExpandedRoutes(newExpanded);
    };

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

    const formatDateKey = (dateTime) => {
        if (!dateTime) return "";
        try {
            const date = new Date(dateTime);
            return date.toISOString().split("T")[0]; // YYYY-MM-DD
        } catch {
            return "";
        }
    };

    // Group trips by date and then by route
    const groupedTrips = useMemo(() => {
        const grouped = {};

        trips.forEach((trip) => {
            const dateKey = formatDateKey(trip.departure_time);
            if (!dateKey) return;

            if (!grouped[dateKey]) {
                grouped[dateKey] = {};
            }

            const routeId = trip.route_id || "no-route";
            const routeName =
                trip.route?.name || `Tuyến #${trip.route_id || "N/A"}`;

            if (!grouped[dateKey][routeId]) {
                grouped[dateKey][routeId] = {
                    routeId,
                    routeName,
                    trips: [],
                };
            }

            grouped[dateKey][routeId].trips.push(trip);
        });

        // Sort trips within each route by departure time
        Object.keys(grouped).forEach((dateKey) => {
            Object.keys(grouped[dateKey]).forEach((routeId) => {
                grouped[dateKey][routeId].trips.sort((a, b) => {
                    const timeA = a.departure_time
                        ? new Date(a.departure_time).getTime()
                        : 0;
                    const timeB = b.departure_time
                        ? new Date(b.departure_time).getTime()
                        : 0;
                    return timeA - timeB;
                });
            });
        });

        // Sort dates
        const sortedDates = Object.keys(grouped).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        return { grouped, sortedDates };
    }, [trips]);

    // Auto expand first date and first route
    React.useEffect(() => {
        if (groupedTrips.sortedDates.length > 0 && expandedDates.size === 0) {
            const firstDate = groupedTrips.sortedDates[0];
            setExpandedDates(new Set([firstDate]));
            const firstRoute = Object.keys(groupedTrips.grouped[firstDate])[0];
            if (firstRoute) {
                setExpandedRoutes(new Set([`${firstDate}-${firstRoute}`]));
            }
        }
    }, [groupedTrips, expandedDates.size]);

    if (trips.length === 0) {
        return (
            <div className="trip-grouped-view__empty">
                <p>Không có chuyến xe nào</p>
            </div>
        );
    }

    return (
        <div className="trip-grouped-view">
            {groupedTrips.sortedDates.map((dateKey) => {
                const dateTrips = groupedTrips.grouped[dateKey];
                const firstTrip = Object.values(dateTrips)[0]?.trips[0];
                const dateInfo = formatDateTime(
                    firstTrip?.departure_time || dateKey
                );
                const isDateExpanded = expandedDates.has(dateKey);
                const totalTrips = Object.values(dateTrips).reduce(
                    (sum, route) => sum + route.trips.length,
                    0
                );

                return (
                    <div key={dateKey} className="trip-grouped-view__date-group">
                        <div
                            className="trip-grouped-view__date-header"
                            onClick={() => toggleDate(dateKey)}
                        >
                            <div className="trip-grouped-view__date-header-left">
                                {isDateExpanded ? (
                                    <ChevronDown size={18} />
                                ) : (
                                    <ChevronRight size={18} />
                                )}
                                <Calendar size={18} />
                                <h3 className="trip-grouped-view__date-title">
                                    {dateInfo.date}
                                </h3>
                            </div>
                            <span className="trip-grouped-view__trip-count">
                                {totalTrips} chuyến
                            </span>
                        </div>

                        {isDateExpanded && (
                            <div className="trip-grouped-view__routes">
                                {Object.values(dateTrips).map((routeGroup) => {
                                    const routeKey = `${dateKey}-${routeGroup.routeId}`;
                                    const isRouteExpanded = expandedRoutes.has(routeKey);

                                    return (
                                        <div
                                            key={routeGroup.routeId}
                                            className="trip-grouped-view__route-group"
                                        >
                                            <div
                                                className="trip-grouped-view__route-header"
                                                onClick={() => toggleRoute(routeKey)}
                                            >
                                                <div className="trip-grouped-view__route-header-left">
                                                    {isRouteExpanded ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )}
                                                    <MapPin size={16} />
                                                    <h4 className="trip-grouped-view__route-name">
                                                        {routeGroup.routeName}
                                                    </h4>
                                                </div>
                                                <span className="trip-grouped-view__route-count">
                                                    {routeGroup.trips.length} chuyến
                                                </span>
                                            </div>

                                            {isRouteExpanded && (
                                                <div className="trip-grouped-view__trips">
                                                    {routeGroup.trips.map((trip) => {
                                                        const timeInfo = formatDateTime(
                                                            trip.departure_time
                                                        );
                                                        return (
                                                            <div
                                                                key={trip.id}
                                                                className="trip-grouped-view__trip-card"
                                                            >
                                                                <div className="trip-grouped-view__trip-main">
                                                                    <div className="trip-grouped-view__trip-time">
                                                                        <Clock size={14} />
                                                                        <span>
                                                                            {timeInfo.time}
                                                                        </span>
                                                                    </div>
                                                                    <div className="trip-grouped-view__trip-info">
                                                                        <div className="trip-grouped-view__trip-id">
                                                                            #{trip.id}
                                                                        </div>
                                                                        <div className="trip-grouped-view__trip-bus">
                                                                            {trip.bus
                                                                                ? trip.bus
                                                                                      .license_plate ||
                                                                                  trip.bus
                                                                                      .plate_number ||
                                                                                  `Xe #${trip.bus.id}`
                                                                                : "Chưa gán"}
                                                                        </div>
                                                                    </div>
                                                                    <div className="trip-grouped-view__trip-status">
                                                                        {getStatusChip(
                                                                            trip.status
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="trip-grouped-view__trip-actions">
                                                                    <button
                                                                        className="trip-grouped-view__action-btn trip-grouped-view__action-btn--view"
                                                                        onClick={() =>
                                                                            onView?.(trip)
                                                                        }
                                                                        title="Xem chi tiết"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="trip-grouped-view__action-btn trip-grouped-view__action-btn--edit"
                                                                        onClick={() =>
                                                                            onEdit?.(trip)
                                                                        }
                                                                        title="Chỉnh sửa"
                                                                    >
                                                                        <Edit size={14} />
                                                                    </button>
                                                                    <button
                                                                        className="trip-grouped-view__action-btn trip-grouped-view__action-btn--delete"
                                                                        onClick={() =>
                                                                            onDelete?.(trip)
                                                                        }
                                                                        title="Xóa"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TripGroupedView;
