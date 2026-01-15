import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LabelList,
} from "recharts";
import "./BarChart.scss";

const GRADIENT_COLORS = [
    { start: "#3b82f6", end: "#1d4ed8" },
    { start: "#10b981", end: "#059669" },
    { start: "#f59e0b", end: "#d97706" },
    { start: "#8b5cf6", end: "#6d28d9" },
    { start: "#ec4899", end: "#be185d" },
    { start: "#06b6d4", end: "#0891b2" },
    { start: "#84cc16", end: "#65a30d" },
    { start: "#ef4444", end: "#dc2626" },
];

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
    layout = "horizontal",
    showLabels = false,
    animated = true,
    colorful = true,
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
                    <div className="bar-chart__tooltip-header">
                        <span className="bar-chart__tooltip-label">
                            {formatLabel ? formatLabel(label) : label}
                        </span>
                    </div>
                    <div className="bar-chart__tooltip-content">
                        {payload.map((entry, index) => (
                            <div
                                key={index}
                                className="bar-chart__tooltip-item"
                            >
                                <span
                                    className="bar-chart__tooltip-dot"
                                    style={{ background: entry.fill || entry.color }}
                                />
                                <span className="bar-chart__tooltip-name">
                                    {entry.name}
                                </span>
                                <span className="bar-chart__tooltip-value">
                                    {formatTooltipValue(entry.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderGradientDefs = () => (
        <defs>
            {GRADIENT_COLORS.map((color, index) => (
                <linearGradient
                    key={`barGradient-${index}`}
                    id={`barGradient-${index}`}
                    x1="0"
                    y1="0"
                    x2={layout === "vertical" ? "1" : "0"}
                    y2={layout === "vertical" ? "0" : "1"}
                >
                    <stop offset="0%" stopColor={color.start} stopOpacity={1} />
                    <stop offset="100%" stopColor={color.end} stopOpacity={0.9} />
                </linearGradient>
            ))}
        </defs>
    );

    const renderBars = () => {
        if (bars.length > 0) {
            return bars.map((bar, barIndex) => (
                <Bar
                    key={bar.key || barIndex}
                    dataKey={bar.key}
                    name={bar.name}
                    fill={colorful ? `url(#barGradient-${barIndex % GRADIENT_COLORS.length})` : bar.fill || bar.color}
                    radius={layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                    animationDuration={animated ? 1200 : 0}
                    animationBegin={barIndex * 100}
                >
                    {showLabels && (
                        <LabelList
                            dataKey={bar.key}
                            position={layout === "vertical" ? "right" : "top"}
                            formatter={formatTooltipValue}
                            style={{
                                fontSize: 11,
                                fill: "#64748b",
                                fontWeight: 500,
                            }}
                        />
                    )}
                </Bar>
            ));
        }

        return (
            <Bar
                dataKey={dataKey}
                fill={colorful ? undefined : "#3b82f6"}
                radius={layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                animationDuration={animated ? 1200 : 0}
            >
                {colorful &&
                    data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={`url(#barGradient-${index % GRADIENT_COLORS.length})`}
                        />
                    ))}
                {showLabels && (
                    <LabelList
                        dataKey={dataKey}
                        position={layout === "vertical" ? "right" : "top"}
                        formatter={formatTooltipValue}
                        style={{
                            fontSize: 11,
                            fill: "#64748b",
                            fontWeight: 500,
                        }}
                    />
                )}
            </Bar>
        );
    };

    return (
        <div className={`bar-chart ${animated ? "bar-chart--animated" : ""}`}>
            {title && <h4 className="bar-chart__title">{title}</h4>}
            <ResponsiveContainer width="100%" height={height}>
                <RechartsBarChart
                    data={data}
                    layout={layout}
                    margin={{
                        top: 10,
                        right: showLabels ? 50 : 20,
                        bottom: 5,
                        left: layout === "vertical" ? 10 : 0,
                    }}
                    barCategoryGap="20%"
                >
                    {renderGradientDefs()}
                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            horizontal={layout === "horizontal"}
                            vertical={layout === "vertical"}
                        />
                    )}
                    {layout === "vertical" ? (
                        <>
                            <XAxis
                                type="number"
                                stroke="#94a3b8"
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                tickFormatter={formatTooltipValue}
                                axisLine={{ stroke: "#e2e8f0" }}
                                tickLine={false}
                            />
                            <YAxis
                                dataKey={xKey}
                                type="category"
                                stroke="#94a3b8"
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                tickFormatter={formatLabel}
                                axisLine={false}
                                tickLine={false}
                                width={120}
                            />
                        </>
                    ) : (
                        <>
                            <XAxis
                                dataKey={xKey}
                                stroke="#94a3b8"
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                tickFormatter={formatLabel}
                                axisLine={{ stroke: "#e2e8f0" }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                tickFormatter={formatTooltipValue}
                                axisLine={false}
                                tickLine={false}
                                width={70}
                            />
                        </>
                    )}
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                            fill: "rgba(59, 130, 246, 0.08)",
                            radius: 4,
                        }}
                    />
                    {showLegend && (
                        <Legend
                            wrapperStyle={{ paddingTop: "20px" }}
                            iconType="square"
                            iconSize={12}
                        />
                    )}
                    {renderBars()}
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
}
