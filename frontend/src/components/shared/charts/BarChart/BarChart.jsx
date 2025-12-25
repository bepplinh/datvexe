import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import "./BarChart.scss";

export default function BarChart({
    data = [],
    dataKey = "value",
    xKey = "label",
    bars = [],
    title,
    height = 300,
    showGrid = true,
    showLegend = true,
    formatValue,
    formatLabel,
    layout = "vertical", // vertical or horizontal
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
                <div className="bar-chart__tooltip">
                    <p className="bar-chart__tooltip-label">
                        {formatLabel ? formatLabel(label) : label}
                    </p>
                    {payload.map((entry, index) => (
                        <p
                            key={index}
                            className="bar-chart__tooltip-item"
                            style={{ color: entry.color }}
                        >
                            <span className="bar-chart__tooltip-name">{entry.name}:</span>
                            <span className="bar-chart__tooltip-value">
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
        <div className="bar-chart">
            {title && <h4 className="bar-chart__title">{title}</h4>}
            <ResponsiveContainer width="100%" height={height}>
                <RechartsBarChart
                    data={data}
                    layout={layout}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                    <XAxis
                        dataKey={layout === "vertical" ? xKey : dataKey}
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatLabel}
                    />
                    <YAxis
                        dataKey={layout === "vertical" ? dataKey : xKey}
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatTooltipValue}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {showLegend && <Legend />}
                    {bars.length > 0 ? (
                        bars.map((bar, index) => (
                            <Bar
                                key={bar.key || index}
                                dataKey={bar.key}
                                name={bar.name}
                                fill={bar.color || "#3b82f6"}
                                radius={[4, 4, 0, 0]}
                            />
                        ))
                    ) : (
                        <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    )}
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
}

