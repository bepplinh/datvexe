import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { formatCurrency, formatPeriodLabel } from "../../../utils/dashboardFormatters";
import "./ChartStyles.scss";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function RevenueStackedBarChart({ data = [], periodType = "month" }) {
    if (!data || data.length === 0) {
        return (
            <div className="chart-empty">
                <p>Chưa có dữ liệu để hiển thị</p>
            </div>
        );
    }

    const chartData = {
        labels: data.map((item) => formatPeriodLabel(item.period, periodType)),
        datasets: [
            {
                label: "Doanh Thu Thuần",
                data: data.map((item) => item.net_revenue || 0),
                backgroundColor: "rgba(16, 185, 129, 0.8)",
                borderColor: "rgb(16, 185, 129)",
                borderWidth: 1,
            },
            {
                label: "Hoàn Tiền",
                data: data.map((item) => item.total_refunds || 0),
                backgroundColor: "rgba(245, 158, 11, 0.8)",
                borderColor: "rgb(245, 158, 11)",
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                    },
                    footer: function (tooltipItems) {
                        let total = 0;
                        tooltipItems.forEach((item) => {
                            total += item.parsed.y;
                        });
                        return `Tổng: ${formatCurrency(total)}`;
                    },
                },
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                },
            },
            y: {
                beginAtZero: true,
                stacked: true,
                grid: {
                    color: "rgba(0, 0, 0, 0.05)",
                },
                ticks: {
                    callback: function (value) {
                        if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
                        if (value >= 1000) return (value / 1000).toFixed(1) + "K";
                        return value;
                    },
                    font: {
                        size: 11,
                    },
                },
            },
        },
        interaction: {
            mode: "index",
            intersect: false,
        },
    };

    return (
        <div className="chart-container">
            <Bar data={chartData} options={options} />
        </div>
    );
}

