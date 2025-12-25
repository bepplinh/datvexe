import { useState, useEffect, useCallback } from "react";
import { revenueService } from "../../../services/admin/revenueService";
import { statisticsService } from "../../../services/admin/statisticsService";
import { financialService } from "../../../services/admin/financialService";
import { toast } from "react-toastify";
import { Loader2, Calendar, TrendingUp, Clock } from "lucide-react";
import dayjs from "dayjs";
import PeriodFilter from "../../../components/shared/PeriodFilter/PeriodFilter";
import StatsCard from "../../../components/shared/StatsCard/StatsCard";
import LineChart from "../../../components/shared/charts/LineChart/LineChart";
import BarChart from "../../../components/shared/charts/BarChart/BarChart";
import { formatCurrency } from "../../../utils/formatUtils";
import "./TimeBasedReport.scss";

const PERIOD_OPTIONS = [
    { value: "day", label: "Hàng ngày" },
    { value: "week", label: "Hàng tuần" },
    { value: "month", label: "Hàng tháng" },
    { value: "quarter", label: "Hàng quý" },
    { value: "year", label: "Hàng năm" },
];

export default function TimeBasedReport() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("day");
    const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [fromDate, setFromDate] = useState(
        dayjs().subtract(30, "day").format("YYYY-MM-DD")
    );
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [trendData, setTrendData] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [topRoutes, setTopRoutes] = useState([]);
    const [activeReport, setActiveReport] = useState("revenue");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [trendRes, dashboardRes, routesRes] = await Promise.all([
                revenueService.getTrend({
                    period,
                    from_date: fromDate,
                    to_date: toDate,
                }),
                revenueService.getDashboard({
                    period,
                    date,
                }),
                revenueService.getTopRoutes({
                    from_date: fromDate,
                    to_date: toDate,
                    limit: 10,
                }),
            ]);

            if (trendRes.success) {
                setTrendData(trendRes.data.trend || []);
            }
            if (dashboardRes.success) {
                setDashboardData(dashboardRes.data);
            }
            if (routesRes.success) {
                setTopRoutes(routesRes.data.top_routes || []);
            }
        } catch (error) {
            console.error("Error loading time-based data:", error);
            toast.error("Không thể tải dữ liệu báo cáo theo thời gian");
        } finally {
            setLoading(false);
        }
    }, [period, date, fromDate, toDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        const today = dayjs();
        let newFromDate, newToDate;

        switch (newPeriod) {
            case "day":
                newFromDate = today.subtract(30, "day").format("YYYY-MM-DD");
                newToDate = today.format("YYYY-MM-DD");
                break;
            case "week":
                newFromDate = today.subtract(12, "week").format("YYYY-MM-DD");
                newToDate = today.format("YYYY-MM-DD");
                break;
            case "month":
                newFromDate = today.subtract(12, "month").format("YYYY-MM-DD");
                newToDate = today.format("YYYY-MM-DD");
                break;
            case "quarter":
                newFromDate = today.subtract(4, "quarter").format("YYYY-MM-DD");
                newToDate = today.format("YYYY-MM-DD");
                break;
            case "year":
                newFromDate = today.subtract(5, "year").format("YYYY-MM-DD");
                newToDate = today.format("YYYY-MM-DD");
                break;
            default:
                return;
        }

        setFromDate(newFromDate);
        setToDate(newToDate);
    };

    if (loading && !trendData.length) {
        return (
            <div className="time-based-report time-based-report--loading">
                <Loader2 className="time-based-report__loader" size={48} />
                <p>Đang tải báo cáo theo thời gian...</p>
            </div>
        );
    }

    return (
        <div className="time-based-report">
            <div className="time-based-report__header">
                <div>
                    <h1 className="time-based-report__title">Báo cáo Theo Thời gian</h1>
                    <p className="time-based-report__subtitle">
                        Phân tích xu hướng và so sánh theo các kỳ báo cáo
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="time-based-report__filters">
                <PeriodFilter
                    period={period}
                    date={date}
                    onPeriodChange={handlePeriodChange}
                    onDateChange={setDate}
                />
            </div>

            {/* Report Type Tabs */}
            <div className="time-based-report__tabs">
                {PERIOD_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handlePeriodChange(option.value)}
                        className={`time-based-report__tab ${
                            period === option.value ? "time-based-report__tab--active" : ""
                        }`}
                    >
                        <Calendar size={16} />
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Dashboard Stats */}
            {dashboardData && (
                <div className="time-based-report__stats">
                    <StatsCard
                        title="Doanh thu kỳ này"
                        value={dashboardData.current_period?.revenue || 0}
                        previousValue={dashboardData.previous_period?.revenue}
                        trend={dashboardData.comparison?.revenue_change}
                        trendLabel="so với kỳ trước"
                        unit="đ"
                        formatValue={formatCurrency}
                        icon={TrendingUp}
                    />
                    <StatsCard
                        title="Số vé kỳ này"
                        value={dashboardData.current_period?.booking_count || 0}
                        previousValue={dashboardData.previous_period?.booking_count}
                        trend={dashboardData.comparison?.booking_change}
                        trendLabel="so với kỳ trước"
                        unit="vé"
                        icon={Clock}
                    />
                </div>
            )}

            {/* Charts */}
            <div className="time-based-report__charts">
                <div className="time-based-report__chart-card">
                    <LineChart
                        title={`Xu hướng Doanh thu (${PERIOD_OPTIONS.find((p) => p.value === period)?.label || period})`}
                        data={trendData}
                        lines={[
                            { key: "revenue", name: "Doanh thu", color: "#3b82f6" },
                            { key: "booking_count", name: "Số vé", color: "#10b981" },
                        ]}
                        xKey="label"
                        height={400}
                        formatValue={formatCurrency}
                    />
                </div>
                <div className="time-based-report__chart-card">
                    <BarChart
                        title="Top 10 Tuyến đường"
                        data={topRoutes.slice(0, 10)}
                        dataKey="revenue"
                        xKey="route_name"
                        height={400}
                        formatValue={formatCurrency}
                    />
                </div>
            </div>

            {/* Period Comparison */}
            {dashboardData && (
                <div className="time-based-report__comparison">
                    <div className="time-based-report__comparison-card">
                        <h3>So sánh Kỳ</h3>
                        <div className="time-based-report__comparison-grid">
                            <div className="time-based-report__comparison-item">
                                <span className="time-based-report__comparison-label">
                                    Kỳ hiện tại:
                                </span>
                                <span className="time-based-report__comparison-value">
                                    {dayjs(dashboardData.current_period?.start).format(
                                        "DD/MM/YYYY"
                                    )}{" "}
                                    -{" "}
                                    {dayjs(dashboardData.current_period?.end).format(
                                        "DD/MM/YYYY"
                                    )}
                                </span>
                            </div>
                            <div className="time-based-report__comparison-item">
                                <span className="time-based-report__comparison-label">
                                    Kỳ trước:
                                </span>
                                <span className="time-based-report__comparison-value">
                                    {dayjs(dashboardData.previous_period?.start).format(
                                        "DD/MM/YYYY"
                                    )}{" "}
                                    -{" "}
                                    {dayjs(dashboardData.previous_period?.end).format(
                                        "DD/MM/YYYY"
                                    )}
                                </span>
                            </div>
                            <div className="time-based-report__comparison-item">
                                <span className="time-based-report__comparison-label">
                                    Thay đổi doanh thu:
                                </span>
                                <span
                                    className={`time-based-report__comparison-value ${
                                        (dashboardData.comparison?.revenue_change || 0) >= 0
                                            ? "time-based-report__comparison-value--positive"
                                            : "time-based-report__comparison-value--negative"
                                    }`}
                                >
                                    {dashboardData.comparison?.revenue_change >= 0 ? "+" : ""}
                                    {dashboardData.comparison?.revenue_change?.toFixed(2)}% (
                                    {formatCurrency(
                                        dashboardData.comparison?.revenue_change_amount || 0
                                    )}
                                    )
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

