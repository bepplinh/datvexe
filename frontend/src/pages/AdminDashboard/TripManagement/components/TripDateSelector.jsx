import React, { useState, useMemo } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TripDateSelector.scss";

dayjs.locale("vi");

const TripDateSelector = ({ trips = [] }) => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(dayjs());

    const formatDateKey = (dateTime) => {
        if (!dateTime) return "";
        try {
            const date = new Date(dateTime);
            return date.toISOString().split("T")[0]; // YYYY-MM-DD
        } catch {
            return "";
        }
    };

    // Group trips by date and route
    const routesByDate = useMemo(() => {
        const dateKey = selectedDate.format("YYYY-MM-DD");
        const grouped = {};

        trips.forEach((trip) => {
            const tripDateKey = formatDateKey(trip.departure_time);
            if (tripDateKey !== dateKey) return;

            const routeId = trip.route_id || "no-route";
            const routeName =
                trip.route?.name || `Tuyến #${trip.route_id || "N/A"}`;

            if (!grouped[routeId]) {
                grouped[routeId] = {
                    routeId,
                    routeName,
                    tripCount: 0,
                };
            }

            grouped[routeId].tripCount++;
        });

        return Object.values(grouped).sort((a, b) =>
            a.routeName.localeCompare(b.routeName)
        );
    }, [trips, selectedDate]);

    const handleRouteClick = (routeId) => {
        const dateKey = selectedDate.format("YYYY-MM-DD");
        navigate(`/admin/trips/${dateKey}/${routeId}`);
    };

    return (
        <div className="trip-date-selector">
            <div className="trip-date-selector__header">
                <Calendar size={20} />
                <h2 className="trip-date-selector__title">
                    Chọn ngày và tuyến để quản lý
                </h2>
            </div>

            <div className="trip-date-selector__date-picker">
                <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="vi"
                >
                    <DatePicker
                        label="Chọn ngày"
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date || dayjs())}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: "medium",
                                className: "trip-date-selector__date-input",
                            },
                        }}
                    />
                </LocalizationProvider>
            </div>

            {routesByDate.length > 0 ? (
                <div className="trip-date-selector__routes">
                    <h3 className="trip-date-selector__routes-title">
                        Các tuyến trong ngày{" "}
                        {selectedDate.format("DD/MM/YYYY")}
                    </h3>
                    <div className="trip-date-selector__routes-grid">
                        {routesByDate.map((route) => (
                            <div
                                key={route.routeId}
                                className="trip-date-selector__route-card"
                                onClick={() => handleRouteClick(route.routeId)}
                            >
                                <div className="trip-date-selector__route-icon">
                                    <MapPin size={24} />
                                </div>
                                <div className="trip-date-selector__route-info">
                                    <h4 className="trip-date-selector__route-name">
                                        {route.routeName}
                                    </h4>
                                    <p className="trip-date-selector__route-count">
                                        {route.tripCount} chuyến
                                    </p>
                                </div>
                                <div className="trip-date-selector__route-arrow">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="trip-date-selector__empty">
                    <p>Không có chuyến nào trong ngày này</p>
                </div>
            )}
        </div>
    );
};

export default TripDateSelector;

