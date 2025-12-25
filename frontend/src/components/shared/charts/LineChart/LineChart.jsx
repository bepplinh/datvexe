import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import "./LineChart.scss";

export default function LineChart({
    data = [],
    dataKey = "value",
    xKey = "label",
    lines = [],
    title,
    height = 300,
    showGrid = true,
    showLegend = true,
    formatValue,
    formatLabel,
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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="line-chart__tooltip">
                    <p className="line-chart__tooltip-label">
                        {formatLabel ? formatLabel(label) : label}
                    </p>
                    {payload.map((entry, index) => (
                        <p
                            key={index}
                            className="line-chart__tooltip-item"
                            style={{ color: entry.color }}
                        >
                            <span className="line-chart__tooltip-name">
                                {entry.name}:
                            </span>
                            <span className="line-chart__tooltip-value">
                                {formatTooltipValue(entry.value)}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="line-chart">
            {title && <h4 className="line-chart__title">{title}</h4>}
            <ResponsiveContainer width="100%" height={height}>
                <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                    <XAxis
                        dataKey={xKey}
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatLabel}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatTooltipValue}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && <Legend />}
                    {lines.length > 0 ? (
                        lines.map((line, index) => (
                            <Line
                                key={line.key || index}
                                type="monotone"
                                dataKey={line.key}
                                name={line.name}
                                stroke={line.color || "#3b82f6"}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))
                    ) : (
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    );
}

