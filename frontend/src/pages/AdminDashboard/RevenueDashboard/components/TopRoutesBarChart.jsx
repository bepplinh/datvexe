import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatNumber } from "../utils/formatUtils";

export default function TopRoutesBarChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">Không có dữ liệu</div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ left: 100 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                        formatNumber(value / 1000000) + "M"
                    }
                />
                <YAxis
                    type="category"
                    dataKey="route_name"
                    tick={{ fontSize: 12 }}
                    width={100}
                />
                <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ color: "#333" }}
                />
                <Legend />
                <Bar
                    dataKey="revenue"
                    fill="#8884D8"
                    name="Doanh thu"
                    radius={[0, 8, 8, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

