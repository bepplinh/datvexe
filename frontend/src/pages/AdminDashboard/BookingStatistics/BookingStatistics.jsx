import { useState, useEffect, useCallback } from "react";
import { statisticsService } from "../../../services/admin/statisticsService";
import { toast } from "react-toastify";
import { Loader2, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import dayjs from "dayjs";
import DateRangeFilter from "../../../components/shared/DateRangeFilter/DateRangeFilter";
import StatsCard from "../../../components/shared/StatsCard/StatsCard";
import BarChart from "../../../components/shared/charts/BarChart/BarChart";
import PieChart from "../../../components/shared/charts/PieChart/PieChart";
import "./BookingStatistics.scss";

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả" },
    { value: "paid", label: "Đã thanh toán" },
    { value: "pending", label: "Đang chờ" },
    { value: "cancelled", label: "Đã hủy" },
];

export default function BookingStatistics() {
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(
        dayjs().subtract(30, "day").format("YYYY-MM-DD")
    );
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [status, setStatus] = useState("all");
    const [statistics, setStatistics] = useState(null);

    const loadStatistics = useCallback(async () => {
        try {
            setLoading(true);
            const response = await statisticsService.getBookingStatistics({
                from_date: fromDate,
                to_date: toDate,
                status,
            });

            if (response.success) {
                setStatistics(response.data.statistics);
            }
        } catch (error) {
            console.error("Error loading statistics:", error);
            toast.error("Không thể tải thống kê booking");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, status]);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    const getStatusChartData = () => {
        if (!statistics) return [];
        return [
            {
                name: "Đã thanh toán",
                value: statistics.paid_bookings || 0,
                color: "#10b981",
            },
            {
                name: "Đang chờ",
                value: statistics.pending_bookings || 0,
                color: "#f59e0b",
            },
            {
                name: "Đã hủy",
                value: statistics.cancelled_bookings || 0,
                color: "#ef4444",
            },
        ];
    };

    if (loading && !statistics) {
        return (
            <div className="booking-statistics booking-statistics--loading">
                <Loader2 className="booking-statistics__loader" size={48} />
                <p>Đang tải thống kê booking...</p>
            </div>
        );
    }

    return (
        <div className="booking-statistics">
            <div className="booking-statistics__header">
                <div>
                    <h1 className="booking-statistics__title">Thống kê Đặt vé</h1>
                    <p className="booking-statistics__subtitle">
                        Phân tích chi tiết về tình trạng đặt vé và thanh toán
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="booking-statistics__filters">
                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                />
                <div className="booking-statistics__status-filter">
                    <label className="booking-statistics__status-label">Trạng thái:</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="booking-statistics__status-select"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            {statistics && (
                <>
                    <div className="booking-statistics__stats">
                        <StatsCard
                            title="Tổng số vé"
                            value={statistics.total_bookings || 0}
                            unit="vé"
                            icon={TrendingUp}
                        />
                        <StatsCard
                            title="Đã thanh toán"
                            value={statistics.paid_bookings || 0}
                            unit="vé"
                            icon={CheckCircle}
                        />
                        <StatsCard
                            title="Đang chờ"
                            value={statistics.pending_bookings || 0}
                            unit="vé"
                            icon={Clock}
                        />
                        <StatsCard
                            title="Đã hủy"
                            value={statistics.cancelled_bookings || 0}
                            unit="vé"
                            icon={XCircle}
                        />
                    </div>

                    <div className="booking-statistics__metrics">
                        <StatsCard
                            title="Tỷ lệ hủy vé"
                            value={statistics.cancellation_rate || 0}
                            unit="%"
                        />
                        <StatsCard
                            title="Tỷ lệ chuyển đổi"
                            value={statistics.conversion_rate || 0}
                            unit="%"
                        />
                        <StatsCard
                            title="Số vé TB/Booking"
                            value={statistics.avg_tickets_per_booking || 0}
                            unit="vé"
                        />
                        <StatsCard
                            title="Thời gian TB thanh toán"
                            value={statistics.avg_payment_time_hours || 0}
                            unit="giờ"
                        />
                    </div>

                    {/* Charts */}
                    <div className="booking-statistics__charts">
                        <div className="booking-statistics__chart-card">
                            <PieChart
                                title="Phân bổ Trạng thái Booking"
                                data={getStatusChartData()}
                                dataKey="value"
                                nameKey="name"
                                height={350}
                            />
                        </div>
                        <div className="booking-statistics__chart-card">
                            <BarChart
                                title="So sánh Trạng thái"
                                data={getStatusChartData()}
                                dataKey="value"
                                xKey="name"
                                height={350}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

