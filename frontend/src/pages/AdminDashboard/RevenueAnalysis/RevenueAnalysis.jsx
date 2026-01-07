import { useState, useEffect, useCallback } from "react";
import { revenueService } from "../../../services/admin/revenueService";
import { toast } from "react-toastify";
import { Loader2, Filter } from "lucide-react";
import dayjs from "dayjs";
import DateRangeFilter from "../../../components/shared/DateRangeFilter/DateRangeFilter";
import StatsCard from "../../../components/shared/StatsCard/StatsCard";
import LineChart from "../../../components/shared/charts/LineChart/LineChart";
import BarChart from "../../../components/shared/charts/BarChart/BarChart";
import PieChart from "../../../components/shared/charts/PieChart/PieChart";
import DataTable from "../../../components/shared/DataTable/DataTable";
import { formatCurrency } from "../../../utils/formatUtils";
import "./RevenueAnalysis.scss";

const GROUP_BY_OPTIONS = [
    { value: "route", label: "Theo tuyến đường" },
    { value: "bus_type", label: "Theo loại xe" },
    { value: "payment_method", label: "Theo phương thức thanh toán" },
    { value: "source", label: "Theo nguồn đặt" },
    { value: "hour", label: "Theo giờ trong ngày" },
];

export default function RevenueAnalysis() {
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(
        dayjs().subtract(30, "day").format("YYYY-MM-DD")
    );
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [groupBy, setGroupBy] = useState("route");
    const [analysisData, setAnalysisData] = useState([]);
    const [summary, setSummary] = useState(null);

    const loadAnalysis = useCallback(async () => {
        try {
            setLoading(true);
            const response = await revenueService.getAnalysis({
                group_by: groupBy,
                from_date: fromDate,
                to_date: toDate,
            });

            if (response.success) {
                setAnalysisData(response.data.analysis || []);
                calculateSummary(response.data.analysis || []);
            }
        } catch (error) {
            console.error("Error loading analysis:", error);
            toast.error("Không thể tải dữ liệu phân tích");
        } finally {
            setLoading(false);
        }
    }, [groupBy, fromDate, toDate]);

    const calculateSummary = (data) => {
        if (!data || data.length === 0) {
            setSummary(null);
            return;
        }

        const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalBookings = data.reduce(
            (sum, item) => sum + (item.booking_count || 0),
            0
        );
        const avgRevenue = totalRevenue / data.length;

        setSummary({
            totalRevenue,
            totalBookings,
            avgRevenue,
            itemsCount: data.length,
        });
    };

    useEffect(() => {
        loadAnalysis();
    }, [loadAnalysis]);

    const getColumns = () => {
        const baseColumns = [
            {
                key: "name",
                header: getGroupByLabel(),
                width: "30%",
            },
            {
                key: "revenue",
                header: "Doanh thu",
                format: formatCurrency,
                sortable: true,
            },
            {
                key: "booking_count",
                header: "Số lượng đặt",
                sortable: true,
            },
        ];

        if (groupBy === "route") {
            return [
                {
                    key: "route_name",
                    header: "Tuyến đường",
                    width: "25%",
                },
                {
                    key: "from_city_name",
                    header: "Điểm đi",
                },
                {
                    key: "to_city_name",
                    header: "Điểm đến",
                },
                ...baseColumns.slice(1),
                {
                    key: "leg_count",
                    header: "Số chặng",
                },
            ];
        }

        if (groupBy === "bus_type") {
            return [
                {
                    key: "bus_type_name",
                    header: "Loại xe",
                    width: "25%",
                },
                {
                    key: "seat_count",
                    header: "Số ghế",
                },
                ...baseColumns.slice(1),
                {
                    key: "trip_count",
                    header: "Số chuyến",
                },
            ];
        }

        if (groupBy === "payment_method") {
            return [
                {
                    key: "payment_method",
                    header: "Phương thức",
                    width: "25%",
                },
                ...baseColumns.slice(1),
                {
                    key: "total_fee",
                    header: "Tổng phí",
                    format: formatCurrency,
                },
                {
                    key: "total_refund",
                    header: "Tổng hoàn",
                    format: formatCurrency,
                },
            ];
        }

        if (groupBy === "source") {
            return [
                {
                    key: "source_label",
                    header: "Nguồn",
                    width: "25%",
                },
                ...baseColumns.slice(1),
            ];
        }

        if (groupBy === "hour") {
            return [
                {
                    key: "hour_label",
                    header: "Giờ",
                    width: "15%",
                },
                ...baseColumns.slice(1),
            ];
        }

        return baseColumns;
    };

    const getGroupByLabel = () => {
        const option = GROUP_BY_OPTIONS.find((opt) => opt.value === groupBy);
        return option ? option.label : "Nhóm";
    };

    const getChartData = () => {
        if (groupBy === "hour") {
            return analysisData;
        }
        return analysisData.slice(0, 10); // Top 10 for charts
    };

    const getPieData = () => {
        const top10 = analysisData.slice(0, 10);
        const total = top10.reduce((sum, item) => sum + (item.revenue || 0), 0);
        return top10.map((item) => ({
            name:
                item.route_name ||
                item.bus_type_name ||
                item.payment_method ||
                item.source_label ||
                item.hour_label ||
                "Khác",
            value: item.revenue || 0,
            total,
        }));
    };

    const getXKey = () => {
        if (groupBy === "hour") return "hour_label";
        if (groupBy === "route") return "route_name";
        if (groupBy === "bus_type") return "bus_type_name";
        if (groupBy === "payment_method") return "payment_method";
        return "source_label";
    };

    if (loading && !analysisData.length) {
        return (
            <div className="revenue-analysis revenue-analysis--loading">
                <Loader2 className="revenue-analysis__loader" size={48} />
                <p>Đang tải dữ liệu phân tích...</p>
            </div>
        );
    }

    return (
        <div className="revenue-analysis">
            <div className="revenue-analysis__header">
                <div>
                    <h1 className="revenue-analysis__title">Phân tích Doanh thu Chi tiết</h1>
                    <p className="revenue-analysis__subtitle">
                        Phân tích doanh thu theo nhiều tiêu chí khác nhau
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="revenue-analysis__filters">
                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                />
                <div className="revenue-analysis__group-by">
                    <label className="revenue-analysis__group-label">
                        <Filter size={16} />
                        Nhóm theo:
                    </label>
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="revenue-analysis__group-select"
                    >
                        {GROUP_BY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="revenue-analysis__summary">
                    <StatsCard
                        title="Tổng doanh thu"
                        value={summary.totalRevenue}
                        unit="đ"
                        formatValue={formatCurrency}
                    />
                    <StatsCard
                        title="Tổng số đặt"
                        value={summary.totalBookings}
                        unit="đặt"
                    />
                    <StatsCard
                        title="Doanh thu trung bình"
                        value={summary.avgRevenue}
                        unit="đ"
                        formatValue={formatCurrency}
                    />
                    <StatsCard
                        title="Số nhóm"
                        value={summary.itemsCount}
                        unit="nhóm"
                    />
                </div>
            )}

            {/* Charts */}
            <div className="revenue-analysis__charts">
                <div className="revenue-analysis__chart-card">
                    <BarChart
                        title={`Top 10 ${getGroupByLabel()}`}
                        data={getChartData()}
                        dataKey="revenue"
                        xKey={getXKey()}
                        height={350}
                        formatValue={formatCurrency}
                    />
                </div>
                <div className="revenue-analysis__chart-card">
                    <PieChart
                        title="Phân bổ Doanh thu"
                        data={getPieData()}
                        dataKey="value"
                        nameKey="name"
                        height={350}
                        formatValue={formatCurrency}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="revenue-analysis__table">
                <DataTable
                    title={`Chi tiết ${getGroupByLabel()}`}
                    data={analysisData}
                    columns={getColumns()}
                    searchable
                    sortable
                    exportable
                    pageSize={15}
                />
            </div>
        </div>
    );
}

