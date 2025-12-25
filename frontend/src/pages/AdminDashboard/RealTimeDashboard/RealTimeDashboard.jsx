import { useState, useEffect, useCallback } from "react";
import { realTimeService } from "../../../services/admin/realTimeService";
import { toast } from "react-toastify";
import { Loader2, AlertCircle, TrendingUp, Clock, Users, DollarSign } from "lucide-react";
import StatsCard from "../../../components/shared/StatsCard/StatsCard";
import LineChart from "../../../components/shared/charts/LineChart/LineChart";
import DataTable from "../../../components/shared/DataTable/DataTable";
import "./RealTimeDashboard.scss";

export default function RealTimeDashboard() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [hourlyRevenue, setHourlyRevenue] = useState([]);
    const [upcomingTrips, setUpcomingTrips] = useState([]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [metricsRes, hourlyRes, tripsRes] = await Promise.all([
                realTimeService.getMetrics(),
                realTimeService.getTodayRevenueByHour(),
                realTimeService.getUpcomingTrips({ limit: 10 }),
            ]);

            if (metricsRes.success) {
                setMetrics(metricsRes.data);
            }
            if (hourlyRes.success) {
                setHourlyRevenue(hourlyRes.data);
            }
            if (tripsRes.success) {
                setUpcomingTrips(tripsRes.data.upcoming_trips || []);
            }
        } catch (error) {
            console.error("Error loading real-time data:", error);
            toast.error("Không thể tải dữ liệu real-time");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [loadData]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    const tripColumns = [
        {
            key: "route_name",
            header: "Tuyến đường",
            width: "30%",
        },
        {
            key: "departure_time",
            header: "Giờ khởi hành",
            format: (value) => new Date(value).toLocaleString("vi-VN"),
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
            key: "available_seats",
            header: "Ghế trống",
        },
        {
            key: "occupancy_rate",
            header: "Tỷ lệ lấp đầy",
            format: (value) => `${value}%`,
            render: (value) => (
                <span
                    className={`occupancy-badge ${
                        value >= 80
                            ? "occupancy-badge--high"
                            : value >= 50
                            ? "occupancy-badge--medium"
                            : "occupancy-badge--low"
                    }`}
                >
                    {value}%
                </span>
            ),
        },
    ];

    if (loading && !metrics) {
        return (
            <div className="realtime-dashboard realtime-dashboard--loading">
                <Loader2 className="realtime-dashboard__loader" size={48} />
                <p>Đang tải dữ liệu real-time...</p>
            </div>
        );
    }

    return (
        <div className="realtime-dashboard">
            <div className="realtime-dashboard__header">
                <div>
                    <h1 className="realtime-dashboard__title">Dashboard Real-time</h1>
                    <p className="realtime-dashboard__subtitle">
                        Theo dõi hoạt động hệ thống theo thời gian thực
                    </p>
                </div>
                <div className="realtime-dashboard__timestamp">
                    <Clock size={16} />
                    Cập nhật: {metrics?.timestamp || "Đang tải..."}
                </div>
            </div>

            {/* Warnings */}
            {metrics?.warnings && (
                <div className="realtime-dashboard__warnings">
                    {metrics.warnings.payment_failure && (
                        <div className="realtime-dashboard__warning realtime-dashboard__warning--error">
                            <AlertCircle size={20} />
                            <span>
                                Cảnh báo: Có {metrics.recent_failed_payments} thanh toán thất bại
                                trong giờ qua
                            </span>
                        </div>
                    )}
                    {metrics.warnings.near_full_trips && (
                        <div className="realtime-dashboard__warning realtime-dashboard__warning--warning">
                            <AlertCircle size={20} />
                            <span>
                                Cảnh báo: Có {metrics.near_full_trips?.length || 0} chuyến sắp hết
                                chỗ
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className="realtime-dashboard__stats">
                <StatsCard
                    title="Doanh thu hôm nay"
                    value={metrics?.today_revenue || 0}
                    previousValue={metrics?.yesterday_same_time_revenue}
                    trend={metrics?.revenue_change_percent}
                    trendLabel="so với hôm qua"
                    unit="đ"
                    icon={DollarSign}
                    formatValue={formatCurrency}
                />
                <StatsCard
                    title="Số vé đã bán"
                    value={metrics?.today_bookings || 0}
                    unit="vé"
                    icon={Users}
                />
                <StatsCard
                    title="Vé đang chờ thanh toán"
                    value={metrics?.pending_bookings || 0}
                    unit="vé"
                    icon={Clock}
                />
                <StatsCard
                    title="Chuyến sắp khởi hành"
                    value={metrics?.upcoming_trips || 0}
                    unit="chuyến"
                    icon={TrendingUp}
                />
            </div>

            {/* Charts */}
            <div className="realtime-dashboard__charts">
                <div className="realtime-dashboard__chart-card">
                    <LineChart
                        title="Doanh thu theo giờ hôm nay"
                        data={hourlyRevenue}
                        dataKey="revenue"
                        xKey="hour_label"
                        height={300}
                        formatValue={formatCurrency}
                    />
                </div>
            </div>

            {/* Upcoming Trips Table */}
            <div className="realtime-dashboard__table-card">
                <DataTable
                    title="Chuyến sắp khởi hành hôm nay"
                    data={upcomingTrips}
                    columns={tripColumns}
                    searchable
                    sortable
                    pageSize={10}
                />
            </div>
        </div>
    );
}

