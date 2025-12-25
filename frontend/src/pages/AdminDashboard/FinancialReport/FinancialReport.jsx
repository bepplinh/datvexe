import { useState, useEffect, useCallback } from "react";
import { financialService } from "../../../services/admin/financialService";
import { toast } from "react-toastify";
import { Loader2, DollarSign, CreditCard, Gift, TrendingUp } from "lucide-react";
import dayjs from "dayjs";
import DateRangeFilter from "../../../components/shared/DateRangeFilter/DateRangeFilter";
import PeriodFilter from "../../../components/shared/PeriodFilter/PeriodFilter";
import StatsCard from "../../../components/shared/StatsCard/StatsCard";
import LineChart from "../../../components/shared/charts/LineChart/LineChart";
import BarChart from "../../../components/shared/charts/BarChart/BarChart";
import DataTable from "../../../components/shared/DataTable/DataTable";
import { formatCurrency } from "../../../utils/formatUtils";
import "./FinancialReport.scss";

export default function FinancialReport() {
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(
        dayjs().subtract(30, "day").format("YYYY-MM-DD")
    );
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [period, setPeriod] = useState("day");
    const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [paymentReport, setPaymentReport] = useState(null);
    const [couponAnalysis, setCouponAnalysis] = useState(null);
    const [topCoupons, setTopCoupons] = useState([]);
    const [financialByPeriod, setFinancialByPeriod] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [paymentRes, couponRes, topRes, periodRes] = await Promise.all([
                financialService.getPaymentReport({
                    from_date: fromDate,
                    to_date: toDate,
                }),
                financialService.getCouponAnalysis({
                    from_date: fromDate,
                    to_date: toDate,
                }),
                financialService.getTopCoupons({
                    from_date: fromDate,
                    to_date: toDate,
                    limit: 20,
                }),
                financialService.getReportByPeriod({
                    from_date: fromDate,
                    to_date: toDate,
                    period,
                }),
            ]);

            if (paymentRes.success) {
                setPaymentReport(paymentRes.data.payment_report);
            }
            if (couponRes.success) {
                setCouponAnalysis(couponRes.data.coupon_analysis);
            }
            if (topRes.success) {
                setTopCoupons(topRes.data.top_coupons || []);
            }
            if (periodRes.success) {
                setFinancialByPeriod(periodRes.data.financial_report || []);
            }
        } catch (error) {
            console.error("Error loading financial data:", error);
            toast.error("Không thể tải dữ liệu tài chính");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, period]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const couponColumns = [
        {
            key: "coupon_code",
            header: "Mã coupon",
            width: "15%",
        },
        {
            key: "discount_type",
            header: "Loại giảm",
            render: (value) => (value === "percentage" ? "Phần trăm" : "Cố định"),
        },
        {
            key: "discount_value",
            header: "Giá trị",
            format: (value, row) =>
                row.discount_type === "percentage"
                    ? `${value}%`
                    : formatCurrency(value),
        },
        {
            key: "usage_count",
            header: "Số lần dùng",
            sortable: true,
        },
        {
            key: "total_discount",
            header: "Tổng giảm giá",
            format: formatCurrency,
            sortable: true,
        },
        {
            key: "total_revenue",
            header: "Tổng doanh thu",
            format: formatCurrency,
            sortable: true,
        },
    ];

    if (loading && !paymentReport) {
        return (
            <div className="financial-report financial-report--loading">
                <Loader2 className="financial-report__loader" size={48} />
                <p>Đang tải báo cáo tài chính...</p>
            </div>
        );
    }

    return (
        <div className="financial-report">
            <div className="financial-report__header">
                <div>
                    <h1 className="financial-report__title">Báo cáo Tài chính</h1>
                    <p className="financial-report__subtitle">
                        Phân tích thanh toán, phí giao dịch và hiệu quả coupon
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="financial-report__filters">
                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                />
                <PeriodFilter
                    period={period}
                    date={date}
                    onPeriodChange={setPeriod}
                    onDateChange={setDate}
                />
            </div>

            {/* Tabs */}
            <div className="financial-report__tabs">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`financial-report__tab ${activeTab === "overview" ? "financial-report__tab--active" : ""
                        }`}
                >
                    Tổng quan
                </button>
                <button
                    onClick={() => setActiveTab("payments")}
                    className={`financial-report__tab ${activeTab === "payments" ? "financial-report__tab--active" : ""
                        }`}
                >
                    Thanh toán
                </button>
                <button
                    onClick={() => setActiveTab("coupons")}
                    className={`financial-report__tab ${activeTab === "coupons" ? "financial-report__tab--active" : ""
                        }`}
                >
                    Coupon
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && paymentReport && (
                <>
                    <div className="financial-report__stats">
                        <StatsCard
                            title="Tổng doanh thu"
                            value={paymentReport.total_revenue || 0}
                            unit="đ"
                            formatValue={formatCurrency}
                            icon={DollarSign}
                        />
                        <StatsCard
                            title="Doanh thu thực tế"
                            value={paymentReport.actual_revenue || 0}
                            unit="đ"
                            formatValue={formatCurrency}
                            icon={TrendingUp}
                        />
                        <StatsCard
                            title="Tổng phí giao dịch"
                            value={paymentReport.total_fee || 0}
                            unit="đ"
                            formatValue={formatCurrency}
                            icon={CreditCard}
                        />
                        <StatsCard
                            title="Tổng hoàn tiền"
                            value={paymentReport.total_refund || 0}
                            unit="đ"
                            formatValue={formatCurrency}
                        />
                    </div>

                    <div className="financial-report__metrics">
                        <StatsCard
                            title="Tỷ lệ thành công"
                            value={paymentReport.success_rate || 0}
                            unit="%"
                        />
                        <StatsCard
                            title="Tỷ lệ thất bại"
                            value={paymentReport.failure_rate || 0}
                            unit="%"
                        />
                        {couponAnalysis && (
                            <>
                                <StatsCard
                                    title="Coupon đã dùng"
                                    value={couponAnalysis.total_coupons_used || 0}
                                    unit="coupon"
                                    icon={Gift}
                                />
                                <StatsCard
                                    title="Tỷ lệ dùng coupon"
                                    value={couponAnalysis.coupon_usage_rate || 0}
                                    unit="%"
                                />
                            </>
                        )}
                    </div>

                    <div className="financial-report__charts">
                        <div className="financial-report__chart-card">
                            <LineChart
                                title="Báo cáo Tài chính theo Thời gian"
                                data={financialByPeriod}
                                lines={[
                                    { key: "total_revenue", name: "Tổng doanh thu", color: "#3b82f6" },
                                    { key: "actual_revenue", name: "Doanh thu thực", color: "#10b981" },
                                    { key: "total_fee", name: "Phí giao dịch", color: "#f59e0b" },
                                ]}
                                xKey="label"
                                height={350}
                                formatValue={formatCurrency}
                            />
                        </div>
                        <div className="financial-report__chart-card">
                            <BarChart
                                title="Tổng giảm giá từ Coupon"
                                data={financialByPeriod}
                                dataKey="total_discount_amount"
                                xKey="label"
                                height={350}
                                formatValue={formatCurrency}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && paymentReport && (
                <div className="financial-report__payment-details">
                    <div className="financial-report__detail-card">
                        <h3>Chi tiết Thanh toán</h3>
                        <div className="financial-report__detail-grid">
                            <div className="financial-report__detail-item">
                                <span className="financial-report__detail-label">
                                    Tổng doanh thu:
                                </span>
                                <span className="financial-report__detail-value">
                                    {formatCurrency(paymentReport.total_revenue)}
                                </span>
                            </div>
                            <div className="financial-report__detail-item">
                                <span className="financial-report__detail-label">
                                    Tổng phí giao dịch:
                                </span>
                                <span className="financial-report__detail-value">
                                    {formatCurrency(paymentReport.total_fee)}
                                </span>
                            </div>
                            <div className="financial-report__detail-item">
                                <span className="financial-report__detail-label">
                                    Tổng hoàn tiền:
                                </span>
                                <span className="financial-report__detail-value">
                                    {formatCurrency(paymentReport.total_refund)}
                                </span>
                            </div>
                            <div className="financial-report__detail-item">
                                <span className="financial-report__detail-label">
                                    Doanh thu thực tế:
                                </span>
                                <span className="financial-report__detail-value financial-report__detail-value--highlight">
                                    {formatCurrency(paymentReport.actual_revenue)}
                                </span>
                            </div>
                            <div className="financial-report__detail-item">
                                <span className="financial-report__detail-label">
                                    Thanh toán thành công:
                                </span>
                                <span className="financial-report__detail-value">
                                    {paymentReport.succeeded_count || 0}
                                </span>
                            </div>
                            <div className="financial-report__detail-item">
                                <span className="financial-report__detail-label">
                                    Thanh toán thất bại:
                                </span>
                                <span className="financial-report__detail-value">
                                    {paymentReport.failed_count || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coupons Tab */}
            {activeTab === "coupons" && (
                <>
                    {couponAnalysis && (
                        <div className="financial-report__coupon-stats">
                            <StatsCard
                                title="Tổng coupon đã dùng"
                                value={couponAnalysis.total_coupons_used || 0}
                                unit="coupon"
                                icon={Gift}
                            />
                            <StatsCard
                                title="Tổng giá trị giảm"
                                value={couponAnalysis.total_discount_amount || 0}
                                unit="đ"
                                formatValue={formatCurrency}
                            />
                            <StatsCard
                                title="Tỷ lệ sử dụng"
                                value={couponAnalysis.coupon_usage_rate || 0}
                                unit="%"
                            />
                        </div>
                    )}

                    <div className="financial-report__table-card">
                        <DataTable
                            title="Top Coupon Hiệu quả nhất"
                            data={topCoupons}
                            columns={couponColumns}
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

