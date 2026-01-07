import { formatCurrency, formatNumber } from "../utils/formatUtils";
import { formatDateTime } from "../../../../utils/formatUtils";

export default function TopTripsTable({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">Không có dữ liệu</div>
        );
    }

    return (
        <table className="revenue-table">
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Tuyến đường</th>
                    <th>Thời gian khởi hành</th>
                    <th>Số vé</th>
                    <th>Doanh thu</th>
                </tr>
            </thead>
            <tbody>
                {data.map((trip, index) => (
                    <tr key={trip.trip_id}>
                        <td>{index + 1}</td>
                        <td>{trip.route_name || `${trip.from_city} → ${trip.to_city}`}</td>
                        <td>
                            {trip.departure_time
                                ? formatDateTime(trip.departure_time, "DD/MM/YYYY HH:mm")
                                : "-"}
                        </td>
                        <td>{formatNumber(trip.booking_count)}</td>
                        <td className="revenue-table__revenue">
                            {formatCurrency(trip.revenue)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

