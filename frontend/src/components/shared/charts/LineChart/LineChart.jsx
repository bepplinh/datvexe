import { useMemo } from "react";
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine,
} from "recharts";
import "./LineChart.scss";

const GRADIENT_COLORS = {
    blue: { start: "#3b82f6", end: "#93c5fd" },
    green: { start: "#10b981", end: "#6ee7b7" },
    purple: { start: "#8b5cf6", end: "#c4b5fd" },
    orange: { start: "#f59e0b", end: "#fcd34d" },
    pink: { start: "#ec4899", end: "#f9a8d4" },
};

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
    showArea = true,
    showAverage = false,
    animated = true,
    gradientId = "lineGradient",
    colorScheme = "blue",
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

    // Calculate average for reference line
    const average = useMemo(() => {
        if (!showAverage || !data.length) return 0;
        const key = lines.length > 0 ? lines[0].key : dataKey;
        const sum = data.reduce((acc, item) => acc + (item[key] || 0), 0);
        return sum / data.length;
    }, [data, lines, dataKey, showAverage]);

    const colors = GRADIENT_COLORS[colorScheme] || GRADIENT_COLORS.blue;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="line-chart__tooltip">
                    <div className="line-chart__tooltip-header">
                        <span className="line-chart__tooltip-label">
                            {formatLabel ? formatLabel(label) : label}
                        </span>
                    </div>
                    <div className="line-chart__tooltip-content">
                        {payload.map((entry, index) => (
                            <div
                                key={index}
                                className="line-chart__tooltip-item"
                            >
                                <span
                                    className="line-chart__tooltip-dot"
                                    style={{ background: entry.color }}
                                />
                                <span className="line-chart__tooltip-name">
                                    {entry.name}
                                </span>
                                <span className="line-chart__tooltip-value">
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
            {lines.length > 0 ? (
                lines.map((line, index) => {
                    const lineColors =
                        GRADIENT_COLORS[line.colorScheme] || colors;
                    return (
                        <linearGradient
                            key={`gradient-${index}`}
                            id={`${gradientId}-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor={line.stroke || lineColors.start}
                                stopOpacity={0.4}
                            />
                            <stop
                                offset="100%"
                                stopColor={line.stroke || lineColors.end}
                                stopOpacity={0.05}
                            />
                        </linearGradient>
                    );
                })
            ) : (
                <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop
                        offset="0%"
                        stopColor={colors.start}
                        stopOpacity={0.4}
                    />
                    <stop
                        offset="100%"
                        stopColor={colors.end}
                        stopOpacity={0.05}
                    />
                </linearGradient>
            )}
        </defs>
    );

    // Use AreaChart instead of LineChart for gradient fill effect
    const ChartComponent = showArea ? AreaChart : RechartsLineChart;

    return (
        <div className={`line-chart ${animated ? "line-chart--animated" : ""}`}>
            {title && <h4 className="line-chart__title">{title}</h4>}
            <ResponsiveContainer width="100%" height={height}>
                <ChartComponent
                    data={data}
                    margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                >
                    {renderGradientDefs()}
                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                        />
                    )}
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
                        width={80}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                            stroke: "#3b82f6",
                            strokeWidth: 1,
                            strokeDasharray: "5 5",
                        }}
                    />
                    {showLegend && (
                        <Legend
                            wrapperStyle={{
                                paddingTop: "20px",
                            }}
                            iconType="circle"
                            iconSize={8}
                        />
                    )}
                    {showAverage && average > 0 && (
                        <ReferenceLine
                            y={average}
                            stroke="#94a3b8"
                            strokeDasharray="5 5"
                            label={{
                                value: `TB: ${formatTooltipValue(average)}`,
                                position: "right",
                                fill: "#64748b",
                                fontSize: 11,
                            }}
                        />
                    )}
                    {lines.length > 0 ? (
                        lines.map((line, index) => (
                            showArea ? (
                                <Area
                                    key={line.key || index}
                                    type="monotone"
                                    dataKey={line.key}
                                    name={line.name}
                                    stroke={line.stroke || colors.start}
                                    strokeWidth={line.strokeWidth || 2.5}
                                    fill={`url(#${gradientId}-${index})`}
                                    dot={false}
                                    activeDot={{
                                        r: 6,
                                        fill: line.stroke || colors.start,
                                        stroke: "#fff",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={animated ? 1500 : 0}
                                    animationBegin={index * 200}
                                />
                            ) : (
                                <Line
                                    key={line.key || index}
                                    type="monotone"
                                    dataKey={line.key}
                                    name={line.name}
                                    stroke={line.stroke || colors.start}
                                    strokeWidth={line.strokeWidth || 2.5}
                                    dot={false}
                                    activeDot={{
                                        r: 6,
                                        fill: line.stroke || colors.start,
                                        stroke: "#fff",
                                        strokeWidth: 2,
                                    }}
                                    animationDuration={animated ? 1500 : 0}
                                    animationBegin={index * 200}
                                />
                            )
                        ))
                    ) : showArea ? (
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={colors.start}
                            strokeWidth={2.5}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: colors.start,
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                            animationDuration={animated ? 1500 : 0}
                        />
                    ) : (
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={colors.start}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: colors.start,
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                            animationDuration={animated ? 1500 : 0}
                        />
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
}
