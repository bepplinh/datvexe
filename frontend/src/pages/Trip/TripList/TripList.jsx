import TripInfo from "../TripInfo/TripInfo";
import "./TripList.scss";
import { useSearchTrip } from "../../../contexts/SearchTripProvider";
import { useTripFilter } from "../../../contexts/TripFilterProvider";

export default function TripList({ activeTab }) {
    const { results } = useSearchTrip();
    const { giuongNam, limousineCabin, timeMin, timeMax, seatMin, seatMax } =
        useTripFilter();

    const currentTrips =
        activeTab === "outboundTrip" ? results?.outbound : results?.return;

    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const filteredTrips =
        currentTrips?.filter((trip) => {
            if (giuongNam || limousineCabin) {
                const busType = trip.bus?.type || "";
                const busTypeUpper = busType.toUpperCase();
                const isGiuongNam = busTypeUpper.includes("GIƯỜNG NẰM");
                const isLimousineCabin =
                    busTypeUpper.includes("LIMOUSINE-CABIN");

                if (giuongNam && limousineCabin) {
                    if (!isGiuongNam && !isLimousineCabin) return false;
                } else if (giuongNam && !isGiuongNam) {
                    return false;
                } else if (limousineCabin && !isLimousineCabin) {
                    return false;
                }
            }

            // Lọc theo giờ khởi hành
            const tripTimeMinutes = timeToMinutes(trip.departure_time);
            if (tripTimeMinutes < timeMin || tripTimeMinutes > timeMax) {
                return false;
            }

            // Lọc theo số ghế trống
            const availableSeats = trip.available_seats || 0;
            if (availableSeats < seatMin || availableSeats > seatMax) {
                return false;
            }

            return true;
        }) || [];

    if (!currentTrips || currentTrips.length === 0) {
        return (
            <div className="trip-list-empty">
                <p>
                    Không có chuyến xe nào cho chiều{" "}
                    {activeTab === "outboundTrip" ? "đi" : "về"}
                </p>
            </div>
        );
    }

    if (filteredTrips.length === 0) {
        return (
            <div className="trip-list-empty">
                <p>
                    Không có chuyến xe nào phù hợp với bộ lọc cho chiều{" "}
                    {activeTab === "outboundTrip" ? "đi" : "về"}
                </p>
            </div>
        );
    }

    return (
        <div className="trip-list">
            {filteredTrips.map((trip, index) => (
                <TripInfo key={trip.trip_id || index} trip={trip} />
            ))}
        </div>
    );
}
