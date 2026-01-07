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

export default function RevenueBarChart({ data = [], periodType = "month" }) {
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
                label: "Doanh Thu Gộp",
                data: data.map((item) => item.gross_revenue || 0),
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 1,
            },
            {
                label: "Doanh Thu Thuần",
                data: data.map((item) => item.net_revenue || 0),
                backgroundColor: "rgba(16, 185, 129, 0.8)",
                borderColor: "rgb(16, 185, 129)",
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
                },
            },
        },
        scales: {
            x: {
                stacked: false,
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
                stacked: false,
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

