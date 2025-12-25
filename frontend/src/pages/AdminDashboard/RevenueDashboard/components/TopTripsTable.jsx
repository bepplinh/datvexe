import dayjs from "dayjs";
import { formatCurrency, formatNumber } from "../utils/formatUtils";

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
                    <th>Giờ khởi hành</th>
                    <th>Doanh thu</th>
                    <th>Số vé</th>
                    <th>Số chặng</th>
                </tr>
            </thead>
            <tbody>
                {data.map((trip, index) => (
                    <tr key={trip.trip_id}>
                        <td>{index + 1}</td>
                        <td>{trip.route_name}</td>
                        <td>
                            {dayjs(trip.departure_time).format(
                                "DD/MM/YYYY HH:mm"
                            )}
                        </td>
                        <td className="revenue-table__revenue">
                            {formatCurrency(trip.revenue)}
                        </td>
                        <td>{formatNumber(trip.booking_count)}</td>
                        <td>{formatNumber(trip.leg_count)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

