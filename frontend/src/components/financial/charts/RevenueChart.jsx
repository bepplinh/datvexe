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
    Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
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
    Filler
);

export default function RevenueChart({ data, period = "month", type = "line" }) {
    if (!data || !data.by_period || data.by_period.length === 0) {
        return (
            <div className="chart-empty">
                <p>Không có dữ liệu để hiển thị</p>
            </div>
        );
    }

    const labels = data.by_period.map((item) => formatPeriodLabel(item.period, period));
    const grossRevenueData = data.by_period.map((item) => item.gross_revenue);
    const netRevenueData = data.by_period.map((item) => item.net_revenue);
    const refundsData = data.by_period.map((item) => item.total_refunds || 0);

    const chartData = {
        labels,
        datasets: [
            {
                label: "Doanh thu gộp",
                data: grossRevenueData,
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                fill: type === "line",
                tension: 0.4,
            },
            {
                label: "Doanh thu thuần",
                data: netRevenueData,
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: type === "line",
                tension: 0.4,
            },
            {
                label: "Hoàn tiền",
                data: refundsData,
                borderColor: "rgb(239, 68, 68)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: type === "line",
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return formatCurrency(value, false);
                    },
                },
            },
        },
    };

    const ChartComponent = type === "bar" ? Bar : Line;

    return (
        <div className="revenue-chart" style={{ height: "400px" }}>
            <ChartComponent data={chartData} options={options} />
        </div>
    );
}

