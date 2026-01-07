import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import { formatCurrency, formatPercentage } from "../../../utils/dashboardFormatters";
import "./ChartStyles.scss";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PaymentMethodPieChart({ data = [] }) {
    if (!data || data.length === 0) {
        return (
            <div className="chart-empty">
                <p>Chưa có dữ liệu để hiển thị</p>
            </div>
        );
    }

    // Calculate total count for percentage if not provided
    const totalCount = data.reduce((sum, item) => sum + (item.count || 0), 0);

    const chartData = {
        labels: data.map((item) => {
            const provider = item.provider === "payos" ? "PayOS" : "Tiền Mặt";
            const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
            return `${provider} (${formatPercentage(percentage)})`;
        }),
        datasets: [
            {
                data: data.map((item) => item.count || 0),
                backgroundColor: [
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(139, 92, 246, 0.8)",
                ],
                borderColor: [
                    "rgb(59, 130, 246)",
                    "rgb(16, 185, 129)",
                    "rgb(245, 158, 11)",
                    "rgb(139, 92, 246)",
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
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || "";
                        const value = context.parsed || 0;
                        const item = data[context.dataIndex];
                        return [
                            label,
                            `Số lượng: ${value.toLocaleString("vi-VN")}`,
                            `Tổng tiền: ${formatCurrency(item.total_amount || 0)}`,
                        ];
                    },
                },
            },
        },
    };

    return (
        <div className="chart-container">
            <Pie data={chartData} options={options} />
        </div>
    );
}

