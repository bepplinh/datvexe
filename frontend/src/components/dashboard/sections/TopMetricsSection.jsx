import { Award, TrendingUp } from "lucide-react";
import PaymentMethodPieChart from "../charts/PaymentMethodPieChart";
import DataTable from "../../shared/DataTable/DataTable";
import { formatCurrency, formatDate } from "../../../utils/dashboardFormatters";
import "./TopMetricsSection.scss";

export default function TopMetricsSection({ data, loading }) {
    if (loading) {
        return (
            <div className="top-metrics-section">
                <div className="top-metrics-section__skeleton">
                    <div className="skeleton-card" style={{ height: "150px" }} />
                    <div className="skeleton-card" style={{ height: "150px" }} />
                    <div className="skeleton-card" style={{ height: "300px" }} />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="top-metrics-section">
                <div className="top-metrics-section__empty">
                    <p>Chưa có dữ liệu top metrics</p>
                </div>
            </div>
        );
    }

    const topBookingsColumns = [
        {
            key: "code",
            header: "Mã Booking",
            width: "20%",
        },
        {
            key: "total_price",
            header: "Giá Trị",
            format: (value) => formatCurrency(value),
            width: "20%",
        },
        {
            key: "passenger_name",
            header: "Khách Hàng",
            width: "25%",
        },
        {
            key: "passenger_phone",
            header: "Số Điện Thoại",
            width: "20%",
        },
        {
            key: "created_at",
            header: "Ngày Đặt",
            format: (value) => formatDate(value, "date"),
            width: "15%",
        },
    ];

    return (
        <div className="top-metrics-section">
            <h2 className="top-metrics-section__title">Top Metrics</h2>

            {/* Top Cards */}
            <div className="top-metrics-section__top-cards">
                {/* Highest Value Booking */}
                {data.highest_value_booking && (
                    <div className="metric-card">
                        <div className="metric-card__header">
                            <Award size={20} className="metric-card__icon" />
                            <h3 className="metric-card__title">Booking Giá Trị Cao Nhất</h3>
                        </div>
                        <div className="metric-card__content">
                            <div className="metric-card__value">
                                {formatCurrency(data.highest_value_booking.total_price)}
                            </div>
                            <div className="metric-card__details">
                                <div>
                                    <span className="metric-card__label">Mã:</span>{" "}
                                    {data.highest_value_booking.code}
                                </div>
                                <div>
                                    <span className="metric-card__label">Khách:</span>{" "}
                                    {data.highest_value_booking.passenger_name}
                                </div>
                                <div>
                                    <span className="metric-card__label">Ngày:</span>{" "}
                                    {formatDate(data.highest_value_booking.created_at, "date")}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Highest Revenue Period */}
                {data.highest_revenue_period && (
                    <div className="metric-card">
                        <div className="metric-card__header">
                            <TrendingUp size={20} className="metric-card__icon" />
                            <h3 className="metric-card__title">Kỳ Doanh Thu Cao Nhất</h3>
                        </div>
                        <div className="metric-card__content">
                            <div className="metric-card__value">
                                {formatCurrency(data.highest_revenue_period.net_revenue)}
                            </div>
                            <div className="metric-card__details">
                                <div>
                                    <span className="metric-card__label">Kỳ:</span>{" "}
                                    {data.highest_revenue_period.period}
                                </div>
                                <div>
                                    <span className="metric-card__label">Số giao dịch:</span>{" "}
                                    {data.highest_revenue_period.payment_count}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Method Chart */}
            {data.payment_methods && data.payment_methods.length > 0 && (
                <div className="top-metrics-section__chart">
                    <div className="chart-card">
                        <h3 className="chart-card__title">
                            Phương Thức Thanh Toán Phổ Biến
                        </h3>
                        <PaymentMethodPieChart data={data.payment_methods} />
                    </div>
                </div>
            )}

            {/* Top Bookings Table */}
            {data.top_value_bookings && data.top_value_bookings.length > 0 && (
                <div className="top-metrics-section__table">
                    <div className="chart-card">
                        <h3 className="chart-card__title">
                            Top {data.top_value_bookings.length} Bookings Giá Trị Cao Nhất
                        </h3>
                        <DataTable
                            data={data.top_value_bookings}
                            columns={topBookingsColumns}
                            searchable
                            sortable
                            pageSize={10}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

