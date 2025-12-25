import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchRoutes } from "../../../store/slices/routeSlice";
import { fetchTrips } from "../../../store/slices/tripSlice";
import { SeatSelectionProvider } from "./contexts/SeatSelectionContext.jsx";
import { useSeatSelection } from "./contexts/useSeatSelection";
import FilterPanel from "./components/FilterPanel";
import TripList from "./components/TripList";
import SeatMap from "./components/SeatMap";
import SelectedSeatsPanel from "./components/SelectedSeatsPanel";
import BookingSearchPanel from "./components/BookingSearchPanel";
import CreateBookingModal from "./components/CreateBookingModal";
import { adminBookingService } from "../../../services/admin/bookingService";
import { adminTripService } from "../../../services/admin/tripService";
import { toast } from "react-toastify";
import BookingLookupModal from "./components/BookingLookupModal";
import "./BookingSeatManagement.scss";

const BookingSeatManagementContent = () => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { routes, loading: routesLoading } = useAppSelector(
        (state) => state.route
    );
    const { trips, loading: tripsLoading } = useAppSelector(
        (state) => state.trip
    );
    const { selectedSeats } = useSeatSelection();

    const [bookingCode, setBookingCode] = useState("");
    const [bookingSearchLoading, setBookingSearchLoading] = useState(false);
    const [lookupBooking, setLookupBooking] = useState(null);
    const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);

    // Đọc từ URL params khi component mount
    const [selectedRouteId, setSelectedRouteId] = useState(
        searchParams.get("route") || ""
    );
    const [selectedDate, setSelectedDate] = useState(
        searchParams.get("date") || ""
    );
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [seatsData, setSeatsData] = useState(null);
    const [highlightedSeats, setHighlightedSeats] = useState([]);
    const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);
    const [seatMapReloadTrigger, setSeatMapReloadTrigger] = useState(0);

    // Cập nhật URL params khi state thay đổi
    const updateURLParams = useCallback(
        (updates) => {
            const newParams = new URLSearchParams(searchParams);
            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    newParams.set(key, value);
                } else {
                    newParams.delete(key);
                }
            });
            setSearchParams(newParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    useEffect(() => {
        dispatch(fetchRoutes());
    }, [dispatch]);

    // Load trip từ URL params nếu có
    useEffect(() => {
        const tripIdFromURL = searchParams.get("trip");
        if (tripIdFromURL && selectedRouteId && selectedDate) {
            // Tìm trip trong filteredTrips hoặc fetch nếu chưa có
            const findAndSelectTrip = async () => {
                try {
                    const tripRes = await adminTripService.getTripById(
                        parseInt(tripIdFromURL)
                    );
                    if (tripRes?.data) {
                        const trip = tripRes.data;
                        // Kiểm tra xem trip có match với route và date không
                        const tripDate = trip.departure_time
                            ? new Date(trip.departure_time)
                                .toISOString()
                                .split("T")[0]
                            : null;
                        if (
                            String(trip.route_id) === selectedRouteId &&
                            tripDate === selectedDate
                        ) {
                            setSelectedTrip(trip);
                        }
                    }
                } catch (error) {
                    console.error("Error loading trip from URL:", error);
                }
            };
            findAndSelectTrip();
        }
    }, [searchParams, selectedRouteId, selectedDate]);

    useEffect(() => {
        if (selectedRouteId && selectedDate) {
            const params = {
                route_id: selectedRouteId,
                date_from: selectedDate,
                date_to: selectedDate,
                per_page: 1000,
            };
            dispatch(fetchTrips(params));
        } else {
            setFilteredTrips([]);
        }
    }, [selectedRouteId, selectedDate, dispatch]);

    useEffect(() => {
        if (trips && Array.isArray(trips)) {
            // Filter trips by selected date
            const filtered = trips.filter((trip) => {
                if (!trip.departure_time) return false;
                const tripDate = new Date(trip.departure_time)
                    .toISOString()
                    .split("T")[0];
                return tripDate === selectedDate;
            });
            setFilteredTrips(filtered);
        } else {
            setFilteredTrips([]);
        }
    }, [trips, selectedDate]);

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        setSelectedRouteId(routeId);
        updateURLParams({ route: routeId });
        // Reset trip khi đổi route
        if (routeId !== selectedRouteId) {
            setSelectedTrip(null);
            updateURLParams({ route: routeId, trip: null });
        }
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        setSelectedDate(date);
        updateURLParams({ date: date });
        // Reset trip khi đổi date
        if (date !== selectedDate) {
            setSelectedTrip(null);
            updateURLParams({ date: date, trip: null });
        }
    };

    const handleTripClick = (trip) => {
        setSelectedTrip(trip);
        updateURLParams({ trip: trip.id ? String(trip.id) : null });
    };

    const handleCloseSeatMap = () => {
        setSelectedTrip(null);
        updateURLParams({ trip: null });
    };

    const handleBookSeats = () => {
        if (selectedSeats.length === 0) {
            return;
        }
        setIsCreateBookingModalOpen(true);
    };

    const handleCloseCreateBookingModal = (success = false) => {
        setIsCreateBookingModalOpen(false);
        if (success) {
            // Trigger reload of seat map
            setSeatMapReloadTrigger((prev) => prev + 1);
        }
    };

    const handleLookupBooking = async () => {
        const code = bookingCode.trim();
        if (!code) {
            toast.error("Vui lòng nhập mã vé");
            return;
        }

        setBookingSearchLoading(true);
        try {
            const res = await adminBookingService.lookupByCode(code);
            if (!res.success || !res.data?.booking) {
                toast.error(res.message || "Không tìm thấy mã vé");
                return;
            }

            const booking = res.data.booking;
            if (!booking.legs || booking.legs.length === 0) {
                toast.error("Booking không có thông tin chuyến");
                return;
            }

            // Mở modal cho phép chọn leg (chiều đi / chiều về)
            setLookupBooking(booking);
            setIsLookupModalOpen(true);
        } catch (error) {
            const msg = error?.response?.data?.message || "Không tìm thấy mã vé hoặc có lỗi xảy ra";
            toast.error(msg);
        } finally {
            setBookingSearchLoading(false);
        }
    };

    const handleSelectLookupLeg = async (leg) => {
        if (!leg) return;

        // Lấy thông tin chuyến để hiển thị (nếu cần departure_time / route)
        let tripDetail = { id: leg.trip_id };
        try {
            const tripRes = await adminTripService.getTripById(leg.trip_id);
            if (tripRes?.data) {
                tripDetail = tripRes.data;
                if (tripDetail.departure_time) {
                    const tripDate = new Date(tripDetail.departure_time)
                        .toISOString()
                        .split("T")[0];
                    setSelectedDate(tripDate);
                    updateURLParams({ date: tripDate });
                }
                if (tripDetail.route_id) {
                    const routeId = String(tripDetail.route_id);
                    setSelectedRouteId(routeId);
                    updateURLParams({ route: routeId });
                }
            }
        } catch {
            // bỏ qua, vẫn dùng trip id tối thiểu
        }

        const seatLabels =
            leg.items?.map((i) => i.seat_label).filter(Boolean) || [];
        setHighlightedSeats(seatLabels);

        setSelectedTrip(tripDetail);
        updateURLParams({ trip: tripDetail.id ? String(tripDetail.id) : null });
        setSeatMapReloadTrigger((prev) => prev + 1);
        setIsLookupModalOpen(false);
    };

    return (
        <div className="booking-seat-management">
            <div className="booking-seat-management__container">
                <div className="booking-seat-management__header">
                    <div>
                        <h1 className="booking-seat-management__title">
                            Quản lý đặt ghế qua sơ đồ
                        </h1>
                        <p className="booking-seat-management__subtitle">
                            Chọn tuyến và ngày để xem danh sách chuyến và đặt
                            ghế cho khách hàng
                        </p>
                    </div>
                    <div className="booking-seat-management__lookup">
                        <input
                            type="text"
                            placeholder="Nhập mã vé (booking code)"
                            value={bookingCode}
                            onChange={(e) => setBookingCode(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={handleLookupBooking}
                            disabled={bookingSearchLoading}
                        >
                            {bookingSearchLoading ? "Đang tìm..." : "Tìm mã vé"}
                        </button>
                    </div>
                </div>

                <div className="booking-seat-management__content">
                    <div className="booking-seat-management__sidebar">
                        <FilterPanel
                            routes={routes}
                            routesLoading={routesLoading}
                            selectedRouteId={selectedRouteId}
                            selectedDate={selectedDate}
                            onRouteChange={handleRouteChange}
                            onDateChange={handleDateChange}
                        />
                    </div>
                    <div className="booking-seat-management__main">
                        <TripList
                            trips={filteredTrips}
                            loading={tripsLoading}
                            selectedRouteId={selectedRouteId}
                            selectedDate={selectedDate}
                            onTripClick={handleTripClick}
                            selectedTripId={selectedTrip?.id}
                        />
                    </div>
                </div>

                {selectedTrip && (
                    <>
                        <div className="booking-seat-management__search-row">
                            <BookingSearchPanel
                                seatsData={seatsData}
                                onSearchResultsChange={setHighlightedSeats}
                            />
                        </div>
                        <div className="booking-seat-management__seat-map-section">
                            <div className="booking-seat-management__seat-map-wrapper">
                                <SeatMap
                                    trip={selectedTrip}
                                    onClose={handleCloseSeatMap}
                                    onSeatsDataChange={setSeatsData}
                                    highlightedSeats={highlightedSeats}
                                    reloadTrigger={seatMapReloadTrigger}
                                />
                            </div>
                            <div className="booking-seat-management__selected-panel-wrapper">
                                <SelectedSeatsPanel onBookSeats={handleBookSeats} />
                            </div>
                        </div>
                    </>
                )}

                <CreateBookingModal
                    isOpen={isCreateBookingModalOpen}
                    onClose={handleCloseCreateBookingModal}
                    trip={selectedTrip}
                    selectedSeats={selectedSeats}
                    seatsData={seatsData}
                />

                {isLookupModalOpen && lookupBooking && (
                    <BookingLookupModal
                        isOpen={isLookupModalOpen}
                        booking={lookupBooking}
                        onClose={() => setIsLookupModalOpen(false)}
                        onSelectLeg={handleSelectLookupLeg}
                    />
                )}
            </div>
        </div>
    );
};

const BookingSeatManagement = () => {
    return (
        <SeatSelectionProvider>
            <BookingSeatManagementContent />
        </SeatSelectionProvider>
    );
};

export default BookingSeatManagement;
