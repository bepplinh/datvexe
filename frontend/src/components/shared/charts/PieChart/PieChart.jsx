import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import "./PieChart.scss";

const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
];

export default function PieChart({
    data = [],
    dataKey = "value",
    nameKey = "name",
    title,
    height = 300,
    showLegend = true,
    formatValue,
    innerRadius = 0,
    outerRadius = 80,
}) {
    const formatTooltipValue = (value) => {
        if (formatValue) return formatValue(value);
        if (typeof value === "number") {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
            if (value >= 1000) return (value / 1000).toFixed(1) + "K";
            return value.toLocaleString("vi-VN");
        }
        return value;
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const total = data.payload.total || data.payload.value;
            const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

            return (
                <div className="pie-chart__tooltip">
                    <p className="pie-chart__tooltip-name">{data.name}</p>
                    <p className="pie-chart__tooltip-value">
                        {formatTooltipValue(data.value)} ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="pie-chart">
            {title && <h4 className="pie-chart__title">{title}</h4>}
            <ResponsiveContainer width="100%" height={height}>
                <RechartsPieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={outerRadius}
                        innerRadius={innerRadius}
                        fill="#8884d8"
                        dataKey={dataKey}
                        nameKey={nameKey}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color || COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && <Legend />}
                </RechartsPieChart>
            </ResponsiveContainer>
        </div>
    );
}

