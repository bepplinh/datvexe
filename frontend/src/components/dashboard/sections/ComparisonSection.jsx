import { useMemo, useState } from "react";
import ComparisonCard from "../ComparisonCard";
import RevenueLineChart from "../charts/RevenueLineChart";
import RevenueBarChart from "../charts/RevenueBarChart";
import RevenueAreaChart from "../charts/RevenueAreaChart";
import RevenueStackedBarChart from "../charts/RevenueStackedBarChart";
import {
    DollarSign,
    TrendingUp,
    ShoppingCart,
    Percent,
    BarChart3,
    LineChart,
    Layers,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "../../../utils/dashboardFormatters";
import "./ComparisonSection.scss";

const CHART_TYPES = [
    { value: "line", label: "Đường", icon: LineChart },
    { value: "bar", label: "Cột", icon: BarChart3 },
    { value: "area", label: "Vùng", icon: Layers },
    { value: "stacked", label: "Cột Xếp Chồng", icon: BarChart3 },
];

export default function ComparisonSection({ data, period, loading }) {
    const [chartType, setChartType] = useState("bar");

    const chartData = useMemo(() => {
        if (!data?.current_period?.metrics || !data?.previous_period?.metrics) {
            return [];
        }
        // Tạo dữ liệu cho chart từ comparison data
        return [
            {
                period: "Kỳ trước",
                gross_revenue: data.previous_period.metrics.gross_revenue || 0,
                net_revenue: data.previous_period.metrics.net_revenue || 0,
                total_refunds: data.previous_period.metrics.total_refunds || 0,
            },
            {
                period: "Kỳ hiện tại",
                gross_revenue: data.current_period.metrics.gross_revenue || 0,
                net_revenue: data.current_period.metrics.net_revenue || 0,
                total_refunds: data.current_period.metrics.total_refunds || 0,
            },
        ];
    }, [data]);

    const renderChart = () => {
        if (!chartData || chartData.length === 0) {
            return (
                <div className="chart-empty">
                    <p>Chưa có dữ liệu để hiển thị</p>
                </div>
            );
        }

        switch (chartType) {
            case "bar":
                return <RevenueBarChart key="bar" data={chartData} periodType={period} />;
            case "area":
                return <RevenueAreaChart key="area" data={chartData} periodType={period} />;
            case "stacked":
                return <RevenueStackedBarChart key="stacked" data={chartData} periodType={period} />;
            case "line":
            default:
                return <RevenueLineChart key="line" data={chartData} periodType={period} />;
        }
    };

    if (loading) {
        return (
            <div className="comparison-section">
                <div className="comparison-section__skeleton">
                    <div className="skeleton-card" style={{ height: "200px" }} />
                    <div className="skeleton-card" style={{ height: "300px" }} />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="comparison-section">
                <div className="comparison-section__empty">
                    <p>Chưa có dữ liệu để so sánh</p>
                </div>
            </div>
        );
    }

    const currentMetrics = data.current_period?.metrics || {};
    const previousMetrics = data.previous_period?.metrics || {};

    const comparisonStats = [
        {
            title: "Doanh Thu Thuần",
            currentValue: currentMetrics.net_revenue || 0,
            previousValue: previousMetrics.net_revenue || 0,
            formatValue: formatCurrency,
            icon: DollarSign,
        },
        {
            title: "Doanh Thu Gộp",
            currentValue: currentMetrics.gross_revenue || 0,
            previousValue: previousMetrics.gross_revenue || 0,
            formatValue: formatCurrency,
            icon: TrendingUp,
        },
        {
            title: "Số Booking",
            currentValue: currentMetrics.paid_bookings || 0,
            previousValue: previousMetrics.paid_bookings || 0,
            formatValue: (v) => formatNumber(v, "vé"),
            icon: ShoppingCart,
        },
        {
            title: "Tỷ Lệ Hủy",
            currentValue: currentMetrics.cancellation_rate || 0,
            previousValue: previousMetrics.cancellation_rate || 0,
            formatValue: formatPercentage,
            icon: Percent,
        },
    ];

    return (
        <div className="comparison-section">
            <div className="comparison-section__header">
                <h2 className="comparison-section__title">So Sánh Theo Kỳ</h2>
                <p className="comparison-section__subtitle">
                    So sánh các chỉ số giữa kỳ hiện tại và kỳ trước để đánh giá xu hướng tăng trưởng
                </p>
            </div>

            {/* Period Info */}
            <div className="comparison-section__period-info">
                <div className="period-info-card">
                    <div className="period-info-card__label">Kỳ Hiện Tại</div>
                    <div className="period-info-card__dates">
                        {data.current_period?.from} - {data.current_period?.to}
                    </div>
                    <div className="period-info-card__description">
                        Kỳ hiện tại theo đơn vị đã chọn
                    </div>
                </div>
                <div className="period-info-card period-info-card--previous">
                    <div className="period-info-card__label">Kỳ Trước</div>
                    <div className="period-info-card__dates">
                        {data.previous_period?.from} - {data.previous_period?.to}
                    </div>
                    <div className="period-info-card__description">
                        {period === "day" && "Hôm qua"}
                        {period === "week" && "Tuần trước"}
                        {period === "month" && "Tháng trước"}
                        {period === "quarter" && "Quý trước"}
                        {period === "year" && "Năm trước"}
                        {!["day", "week", "month", "quarter", "year"].includes(period) && 
                            "Kỳ trước tương ứng"}
                    </div>
                </div>
            </div>

            {/* Comparison Stats */}
            <div className="comparison-section__stats">
                {comparisonStats.map((stat, index) => (
                    <ComparisonCard
                        key={index}
                        title={stat.title}
                        currentValue={stat.currentValue}
                        previousValue={stat.previousValue}
                        formatValue={stat.formatValue}
                        icon={stat.icon}
                    />
                ))}
            </div>

            {/* Chart */}
            <div className="comparison-section__chart">
                <div className="chart-card">
                    <div className="chart-card__header">
                        <h3 className="chart-card__title">Xu Hướng Doanh Thu</h3>
                        <div className="chart-card__type-selector">
                            {CHART_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        className={`chart-type-btn ${chartType === type.value
                                            ? "chart-type-btn--active"
                                            : ""
                                            }`}
                                        onClick={() => setChartType(type.value)}
                                        title={type.label}
                                    >
                                        <Icon size={18} />
                                        <span>{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div key={chartType}>
                        {renderChart()}
                    </div>
                </div>
            </div>
        </div>
    );
}

