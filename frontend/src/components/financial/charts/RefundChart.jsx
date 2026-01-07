import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatPeriod as formatPeriodLabel } from "../../../utils/formatDate";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function RefundChart({ data, period = "month", chartType = "line" }) {
    if (!data) {
        return (
            <div className="chart-empty">
                <p>Không có dữ liệu để hiển thị</p>
            </div>
        );
    }

    // Chart theo thời gian
    if (data.by_period && data.by_period.length > 0 && chartType !== "pie") {
        const labels = data.by_period.map((item) => formatPeriodLabel(item.period, period));
        const refundAmountData = data.by_period.map((item) => item.total_refund || 0);
        const refundCountData = data.by_period.map((item) => item.refund_count || 0);

        const chartData = {
            labels,
            datasets: [
                {
                    label: "Tổng hoàn tiền",
                    data: refundAmountData,
                    borderColor: "rgb(239, 68, 68)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    fill: chartType === "line",
                    tension: 0.4,
                    yAxisID: "y",
                },
                {
                    label: "Số lượng hoàn tiền",
                    data: refundCountData,
                    borderColor: "rgb(99, 102, 241)",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    fill: false,
                    tension: 0.4,
                    yAxisID: "y1",
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false,
            },
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (context.datasetIndex === 0) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value, false);
                        },
                    },
                },
                y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
        };

        const ChartComponent = chartType === "bar" ? Bar : Line;

        return (
            <div className="refund-chart" style={{ height: "400px" }}>
                <ChartComponent data={chartData} options={options} />
            </div>
        );
    }

    // Chart theo loại (pie/doughnut)
    if (data.by_type && chartType === "pie") {
        const chartData = {
            labels: Object.keys(data.by_type).map((key) => {
                const labels = {
                    price_difference: "Hoàn chênh lệch",
                    full_booking_refund: "Hoàn toàn bộ",
                    other: "Khác",
                };
                return labels[key] || key;
            }),
            datasets: [
                {
                    data: Object.values(data.by_type).map((item) => item.amount),
                    backgroundColor: [
                        "rgba(239, 68, 68, 0.8)",
                        "rgba(99, 102, 241, 0.8)",
                        "rgba(156, 163, 175, 0.8)",
                    ],
                    borderColor: [
                        "rgb(239, 68, 68)",
                        "rgb(99, 102, 241)",
                        "rgb(156, 163, 175)",
                    ],
                    borderWidth: 2,
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || "";
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        },
                    },
                },
            },
        };

        return (
            <div className="refund-chart" style={{ height: "400px" }}>
                <Doughnut data={chartData} options={options} />
            </div>
        );
    }

    return (
        <div className="chart-empty">
            <p>Không có dữ liệu để hiển thị</p>
        </div>
    );
}

