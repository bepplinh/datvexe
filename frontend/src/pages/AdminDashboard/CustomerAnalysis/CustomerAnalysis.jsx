import { useState, useEffect, useCallback } from "react";
import { statisticsService } from "../../../services/admin/statisticsService";
import { toast } from "react-toastify";
import { Loader2, Users, UserPlus, UserCheck, MapPin, History } from "lucide-react";
import dayjs from "dayjs";
import DateRangeFilter from "../../../components/shared/DateRangeFilter/DateRangeFilter";
import StatsCard from "../../../components/shared/StatsCard/StatsCard";
import BarChart from "../../../components/shared/charts/BarChart/BarChart";
import PieChart from "../../../components/shared/charts/PieChart/PieChart";
import DataTable from "../../../components/shared/DataTable/DataTable";
import { formatCurrency, formatNumber } from "../../../utils/formatUtils";
import "./CustomerAnalysis.scss";

export default function CustomerAnalysis() {
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(
        dayjs().subtract(30, "day").format("YYYY-MM-DD")
    );
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [sortBy, setSortBy] = useState("booking_count");
    const [topCustomers, setTopCustomers] = useState([]);
    const [segmentation, setSegmentation] = useState(null);
    const [distribution, setDistribution] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerHistory, setCustomerHistory] = useState([]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [topRes, segRes, distRes] = await Promise.all([
                statisticsService.getTopCustomers({
                    from_date: fromDate,
                    to_date: toDate,
                    limit: 20,
                    sort_by: sortBy,
                }),
                statisticsService.getCustomerSegmentation({
                    from_date: fromDate,
                    to_date: toDate,
                }),
                statisticsService.getCustomerDistribution({
                    from_date: fromDate,
                    to_date: toDate,
                }),
            ]);

            if (topRes.success) {
                setTopCustomers(topRes.data.top_customers || []);
            }
            if (segRes.success) {
                setSegmentation(segRes.data.segmentation);
            }
            if (distRes.success) {
                setDistribution(distRes.data.distribution || []);
            }
        } catch (error) {
            console.error("Error loading customer data:", error);
            toast.error("Không thể tải dữ liệu khách hàng");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, sortBy]);

    const loadCustomerHistory = useCallback(
        async (userId) => {
            try {
                const response = await statisticsService.getCustomerHistory(userId, {
                    from_date: fromDate,
                    to_date: toDate,
                });
                if (response.success) {
                    setCustomerHistory(response.data.history || []);
                }
            } catch (error) {
                console.error("Error loading customer history:", error);
                toast.error("Không thể tải lịch sử khách hàng");
            }
        },
        [fromDate, toDate]
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (selectedCustomer) {
            loadCustomerHistory(selectedCustomer);
        }
    }, [selectedCustomer, loadCustomerHistory]);

    const customerColumns = [
        {
            key: "username",
            header: "Tên khách hàng",
            width: "20%",
        },
        {
            key: "email",
            header: "Email",
            width: "20%",
        },
        {
            key: "phone",
            header: "Số điện thoại",
            width: "15%",
        },
        {
            key: "booking_count",
            header: "Số lượt đặt",
            sortable: true,
            format: formatNumber,
        },
        {
            key: "revenue",
            header: "Doanh thu",
            sortable: true,
            format: formatCurrency,
        },
        {
            key: "last_booking_at",
            header: "Đặt gần nhất",
            format: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-"),
        },
        {
            key: "actions",
            header: "Thao tác",
            render: (_, row) => (
                <button
                    onClick={() => setSelectedCustomer(row.user_id)}
                    className="customer-analysis__view-btn"
                >
                    <History size={16} />
                    Xem lịch sử
                </button>
            ),
        },
    ];

    const historyColumns = [
        {
            key: "booking_code",
            header: "Mã booking",
            width: "15%",
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (value) => (
                <span
                    className={`status-badge status-badge--${value}`}
                >
                    {value === "paid" ? "Đã thanh toán" : value === "pending" ? "Đang chờ" : "Đã hủy"}
                </span>
            ),
        },
        {
            key: "total_price",
            header: "Tổng tiền",
            format: formatCurrency,
        },
        {
            key: "payment_amount",
            header: "Đã thanh toán",
            format: formatCurrency,
        },
        {
            key: "routes",
            header: "Tuyến đường",
            render: (value) => (value && value.length > 0 ? value.join(", ") : "-"),
        },
        {
            key: "created_at",
            header: "Ngày đặt",
            format: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
        },
    ];

    const getSegmentationChartData = () => {
        if (!segmentation) return [];
        return [
            {
                name: "Khách hàng mới",
                value: segmentation.new_customers || 0,
                color: "#3b82f6",
            },
            {
                name: "Khách hàng quay lại",
                value: segmentation.returning_customers || 0,
                color: "#10b981",
            },
        ];
    };

    const getDistributionChartData = () => {
        return distribution.slice(0, 10).map((item) => ({
            name: item.location_name || "N/A",
            value: item.customer_count || 0,
        }));
    };

    if (loading && !topCustomers.length) {
        return (
            <div className="customer-analysis customer-analysis--loading">
                <Loader2 className="customer-analysis__loader" size={48} />
                <p>Đang tải dữ liệu khách hàng...</p>
            </div>
        );
    }

    return (
        <div className="customer-analysis">
            <div className="customer-analysis__header">
                <div>
                    <h1 className="customer-analysis__title">Phân tích Khách hàng</h1>
                    <p className="customer-analysis__subtitle">
                        Thống kê và phân tích hành vi khách hàng
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="customer-analysis__filters">
                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                />
                <div className="customer-analysis__sort-filter">
                    <label className="customer-analysis__sort-label">Sắp xếp theo:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="customer-analysis__sort-select"
                    >
                        <option value="booking_count">Số lượt đặt</option>
                        <option value="revenue">Doanh thu</option>
                    </select>
                </div>
            </div>

            {/* Segmentation Stats */}
            {segmentation && (
                <div className="customer-analysis__segmentation">
                    <StatsCard
                        title="Khách hàng mới"
                        value={segmentation.new_customers || 0}
                        unit="khách hàng"
                        icon={UserPlus}
                    />
                    <StatsCard
                        title="Khách hàng quay lại"
                        value={segmentation.returning_customers || 0}
                        unit="khách hàng"
                        icon={UserCheck}
                    />
                    <StatsCard
                        title="Tổng khách hàng"
                        value={segmentation.total_customers || 0}
                        unit="khách hàng"
                        icon={Users}
                    />
                    <StatsCard
                        title="Tỷ lệ khách mới"
                        value={segmentation.new_customer_rate || 0}
                        unit="%"
                    />
                </div>
            )}

            {/* Charts */}
            <div className="customer-analysis__charts">
                {segmentation && (
                    <div className="customer-analysis__chart-card">
                        <PieChart
                            title="Phân bổ Khách hàng Mới vs Quay lại"
                            data={getSegmentationChartData()}
                            dataKey="value"
                            nameKey="name"
                            height={300}
                        />
                    </div>
                )}
                {distribution.length > 0 && (
                    <div className="customer-analysis__chart-card">
                        <BarChart
                            title="Top 10 Địa điểm Khách hàng"
                            data={getDistributionChartData()}
                            dataKey="value"
                            xKey="name"
                            height={300}
                        />
                    </div>
                )}
            </div>

            {/* Top Customers Table */}
            <div className="customer-analysis__table-card">
                <DataTable
                    title="Top Khách hàng"
                    data={topCustomers}
                    columns={customerColumns}
                    searchable
                    sortable
                    exportable
                    pageSize={15}
                />
            </div>

            {/* Customer History Modal */}
            {selectedCustomer && (
                <div className="customer-analysis__modal">
                    <div className="customer-analysis__modal-content">
                        <div className="customer-analysis__modal-header">
                            <h3>Lịch sử đặt vé</h3>
                            <button
                                onClick={() => {
                                    setSelectedCustomer(null);
                                    setCustomerHistory([]);
                                }}
                                className="customer-analysis__modal-close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="customer-analysis__modal-body">
                            <DataTable
                                data={customerHistory}
                                columns={historyColumns}
                                searchable
                                sortable
                                pageSize={10}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

