import StatsCard from "../../shared/StatsCard/StatsCard";
import {
    DollarSign,
    TrendingUp,
    RefreshCw,
    ShoppingCart,
    XCircle,
    Percent,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "../../../utils/dashboardFormatters";
import "./OverviewSection.scss";

export default function OverviewSection({ data, loading }) {
    if (loading) {
        return (
            <div className="overview-section">
                <div className="overview-section__skeleton">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-card" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="overview-section">
                <div className="overview-section__empty">
                    <p>Chưa có dữ liệu để hiển thị</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: "Doanh Thu Thuần",
            value: data.revenue?.net_revenue || 0,
            formatValue: formatCurrency,
            icon: DollarSign,
            iconColor: "#3b82f6",
        },
        {
            title: "Doanh Thu Gộp",
            value: data.revenue?.gross_revenue || 0,
            formatValue: formatCurrency,
            icon: TrendingUp,
            iconColor: "#10b981",
        },
        {
            title: "Tổng Hoàn Tiền",
            value: data.revenue?.total_refunds || 0,
            formatValue: formatCurrency,
            icon: RefreshCw,
            iconColor: "#f59e0b",
        },
        {
            title: "Số Booking Đã Trả",
            value: data.bookings?.paid_count || 0,
            unit: "vé",
            formatValue: (v) => formatNumber(v, "vé"),
            icon: ShoppingCart,
            iconColor: "#8b5cf6",
        },
        {
            title: "Số Đã Hủy",
            value: data.bookings?.cancelled_count || 0,
            unit: "vé",
            formatValue: (v) => formatNumber(v, "vé"),
            icon: XCircle,
            iconColor: "#ef4444",
        },
        {
            title: "Tỷ Lệ Hủy",
            value: data.bookings?.cancellation_rate || 0,
            formatValue: formatPercentage,
            icon: Percent,
            iconColor: "#64748b",
        },
    ];

    return (
        <div className="overview-section">
            <h2 className="overview-section__title">Tổng Quan Theo Thời Gian</h2>
            <div className="overview-section__grid">
                {stats.map((stat, index) => (
                    <StatsCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        unit={stat.unit}
                        icon={stat.icon}
                        formatValue={stat.formatValue}
                        className="overview-section__card"
                    />
                ))}
            </div>
        </div>
    );
}

