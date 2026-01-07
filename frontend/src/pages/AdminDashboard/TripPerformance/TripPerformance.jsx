import { useState, useEffect, useCallback } from "react";
import { tripPerformanceService } from "../../../services/admin/tripPerformanceService";
import { toast } from "react-toastify";
import { Loader2, TrendingUp, TrendingDown, Clock, MapPin } from "lucide-react";
import dayjs from "dayjs";
import DateRangeFilter from "../../../components/shared/DateRangeFilter/DateRangeFilter";
import StatsCard from "../../../components/shared/StatsCard/StatsCard";
import BarChart from "../../../components/shared/charts/BarChart/BarChart";
import LineChart from "../../../components/shared/charts/LineChart/LineChart";
import DataTable from "../../../components/shared/DataTable/DataTable";
import { formatCurrency, formatPercentage } from "../../../utils/formatUtils";
import "./TripPerformance.scss";

export default function TripPerformance() {
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(
        dayjs().subtract(30, "day").format("YYYY-MM-DD")
    );
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [occupancy, setOccupancy] = useState([]);
    const [lowOccupancy, setLowOccupancy] = useState([]);
    const [popularTrips, setPopularTrips] = useState([]);
    const [popularTimes, setPopularTimes] = useState([]);
    const [mostBookedSeats, setMostBookedSeats] = useState([]);
    const [seatUsage, setSeatUsage] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [
                occupancyRes,
                lowOccupancyRes,
                popularRes,
                timesRes,
                seatsRes,
                usageRes,
            ] = await Promise.all([
                tripPerformanceService.getOccupancy({
                    from_date: fromDate,
                    to_date: toDate,
                }),
                tripPerformanceService.getLowOccupancy({
                    from_date: fromDate,
                    to_date: toDate,
                    threshold: 50,
                    limit: 20,
                }),
                tripPerformanceService.getPopularTrips({
                    from_date: fromDate,
                    to_date: toDate,
                    limit: 10,
                }),
                tripPerformanceService.getPopularDepartureTimes({
                    from_date: fromDate,
                    to_date: toDate,
                }),
                tripPerformanceService.getMostBookedSeats({
                    from_date: fromDate,
                    to_date: toDate,
                    limit: 20,
                }),
                tripPerformanceService.getSeatUsageByType({
                    from_date: fromDate,
                    to_date: toDate,
                }),
            ]);

            if (occupancyRes.success) {
                setOccupancy(occupancyRes.data.occupancy || []);
            }
            if (lowOccupancyRes.success) {
                setLowOccupancy(lowOccupancyRes.data.low_occupancy_trips || []);
            }
            if (popularRes.success) {
                setPopularTrips(popularRes.data.popular_trips || []);
            }
            if (timesRes.success) {
                setPopularTimes(timesRes.data.popular_departure_times || []);
            }
            if (seatsRes.success) {
                setMostBookedSeats(seatsRes.data.most_booked_seats || []);
            }
            if (usageRes.success) {
                setSeatUsage(usageRes.data.seat_usage_by_type || []);
            }
        } catch (error) {
            console.error("Error loading trip performance:", error);
            toast.error("Không thể tải dữ liệu hiệu suất chuyến xe");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const occupancyColumns = [
        {
            key: "route_name",
            header: "Tuyến đường",
            width: "25%",
        },
        {
            key: "departure_time",
            header: "Giờ khởi hành",
            format: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
        },
        {
            key: "booked_seats",
            header: "Ghế đã đặt",
        },
        {
            key: "total_seats",
            header: "Tổng ghế",
        },
        {
            key: "occupancy_rate",
            header: "Tỷ lệ lấp đầy",
            format: formatPercentage,
            render: (value) => (
                <span
                    className={`occupancy-badge ${value >= 80
                        ? "occupancy-badge--high"
                        : value >= 50
                            ? "occupancy-badge--medium"
                            : "occupancy-badge--low"
                        }`}
                >
                    {formatPercentage(value)}
                </span>
            ),
        },
    ];

    const seatColumns = [
        {
            key: "seat_number",
            header: "Số ghế",
        },
        {
            key: "seat_type",
            header: "Loại ghế",
        },
        {
            key: "deck",
            header: "Tầng",
        },
        {
            key: "booking_count",
            header: "Số lần đặt",
            sortable: true,
        },
        {
            key: "total_revenue",
            header: "Tổng doanh thu",
            format: formatCurrency,
            sortable: true,
        },
    ];

    if (loading && !occupancy.length) {
        return (
            <div className="trip-performance trip-performance--loading">
                <Loader2 className="trip-performance__loader" size={48} />
                <p>Đang tải dữ liệu hiệu suất chuyến xe...</p>
            </div>
        );
    }

    return (
        <div className="trip-performance">
            <div className="trip-performance__header">
                <div>
                    <h1 className="trip-performance__title">Hiệu suất Chuyến xe</h1>
                    <p className="trip-performance__subtitle">
                        Phân tích tỷ lệ lấp đầy, chuyến phổ biến và sử dụng ghế
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="trip-performance__filters">
                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                />
            </div>

            {/* Tabs */}
            <div className="trip-performance__tabs">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`trip-performance__tab ${activeTab === "overview" ? "trip-performance__tab--active" : ""
                        }`}
                >
                    Tổng quan
                </button>
                <button
                    onClick={() => setActiveTab("occupancy")}
                    className={`trip-performance__tab ${activeTab === "occupancy" ? "trip-performance__tab--active" : ""
                        }`}
                >
                    Tỷ lệ lấp đầy
                </button>
                <button
                    onClick={() => setActiveTab("seats")}
                    className={`trip-performance__tab ${activeTab === "seats" ? "trip-performance__tab--active" : ""
                        }`}
                >
                    Phân tích Ghế
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <>
                    <div className="trip-performance__stats">
                        <StatsCard
                            title="Chuyến phổ biến"
                            value={popularTrips.length}
                            unit="chuyến"
                            icon={MapPin}
                        />
                        <StatsCard
                            title="Chuyến cần tối ưu"
                            value={lowOccupancy.length}
                            unit="chuyến"
                            icon={TrendingDown}
                        />
                        <StatsCard
                            title="Tổng chuyến phân tích"
                            value={occupancy.length}
                            unit="chuyến"
                            icon={Clock}
                        />
                    </div>

                    <div className="trip-performance__charts">
                        <div className="trip-performance__chart-card">
                            <BarChart
                                title="Top 10 Chuyến phổ biến nhất"
                                data={popularTrips.slice(0, 10)}
                                dataKey="ticket_count"
                                xKey="route_name"
                                height={350}
                            />
                        </div>
                        <div className="trip-performance__chart-card">
                            <LineChart
                                title="Thời gian khởi hành phổ biến"
                                data={popularTimes}
                                dataKey="ticket_count"
                                xKey="hour_label"
                                height={350}
                            />
                        </div>
                    </div>

                    <div className="trip-performance__table-card">
                        <DataTable
                            title="Top Chuyến phổ biến"
                            data={popularTrips}
                            columns={occupancyColumns}
                            searchable
                            sortable
                            exportable
                            pageSize={10}
                        />
                    </div>
                </>
            )}

            {/* Occupancy Tab */}
            {activeTab === "occupancy" && (
                <>
                    <div className="trip-performance__table-card">
                        <DataTable
                            title="Tỷ lệ lấp đầy theo Chuyến"
                            data={occupancy}
                            columns={occupancyColumns}
                            searchable
                            sortable
                            exportable
                            pageSize={15}
                        />
                    </div>

                    <div className="trip-performance__table-card">
                        <DataTable
                            title="Chuyến có tỷ lệ lấp đầy thấp (Cần tối ưu)"
                            data={lowOccupancy}
                            columns={occupancyColumns}
                            searchable
                            sortable
                            exportable
                            pageSize={15}
                        />
                    </div>
                </>
            )}

            {/* Seats Tab */}
            {activeTab === "seats" && (
                <>
                    <div className="trip-performance__charts">
                        <div className="trip-performance__chart-card">
                            <BarChart
                                title="Tỷ lệ sử dụng Ghế theo Loại"
                                data={seatUsage}
                                dataKey="usage_rate"
                                xKey="seat_type"
                                height={300}
                                formatValue={formatPercentage}
                            />
                        </div>
                    </div>

                    <div className="trip-performance__table-card">
                        <DataTable
                            title="Ghế được đặt nhiều nhất"
                            data={mostBookedSeats}
                            columns={seatColumns}
                            searchable
                            sortable
                            exportable
                            pageSize={15}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

