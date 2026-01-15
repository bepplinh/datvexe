import { useState, useCallback } from "react";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Sector,
} from "recharts";
import "./PieChart.scss";

const GRADIENT_COLORS = [
    { start: "#3b82f6", end: "#60a5fa" },
    { start: "#10b981", end: "#34d399" },
    { start: "#f59e0b", end: "#fbbf24" },
    { start: "#ef4444", end: "#f87171" },
    { start: "#8b5cf6", end: "#a78bfa" },
    { start: "#ec4899", end: "#f472b6" },
    { start: "#06b6d4", end: "#22d3ee" },
    { start: "#84cc16", end: "#a3e635" },
];

// Active sector rendering with expanded effect
const renderActiveShape = (props) => {
    const {
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
        payload,
        percent,
        value,
    } = props;

    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{
                    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))",
                    transition: "all 0.3s ease",
                }}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 14}
                fill={fill}
            />
        </g>
    );
};

export default function PieChart({
    data = [],
    dataKey = "value",
    nameKey = "name",
    title,
    height = 300,
    showLegend = true,
    formatValue,
    innerRadius = "60%",
    outerRadius = "80%",
    showCenterLabel = true,
    centerLabelTitle = "Tổng",
    paddingAngle = 2,
    animated = true,
}) {
    const [activeIndex, setActiveIndex] = useState(null);

    const formatTooltipValue = useCallback((value) => {
        if (formatValue) return formatValue(value);
        if (typeof value === "number") {
            if (value >= 1000000000)
                return (value / 1000000000).toFixed(1) + "B";
            if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
            if (value >= 1000) return (value / 1000).toFixed(1) + "K";
            return value.toLocaleString("vi-VN");
        }
        return value;
    }, [formatValue]);

    const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

            return (
                <div className="pie-chart__tooltip">
                    <div
                        className="pie-chart__tooltip-header"
                        style={{ borderLeftColor: item.payload.fill }}
                    >
                        <span className="pie-chart__tooltip-name">{item.name}</span>
                    </div>
                    <div className="pie-chart__tooltip-content">
                        <div className="pie-chart__tooltip-row">
                            <span className="pie-chart__tooltip-label">Giá trị</span>
                            <span className="pie-chart__tooltip-value">
                                {formatTooltipValue(item.value)}
                            </span>
                        </div>
                        <div className="pie-chart__tooltip-row">
                            <span className="pie-chart__tooltip-label">Tỷ lệ</span>
                            <span className="pie-chart__tooltip-percent">
                                {percentage}%
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }) => {
        return (
            <div className="pie-chart__legend">
                {payload.map((entry, index) => {
                    const percentage =
                        total > 0
                            ? ((entry.payload[dataKey] / total) * 100).toFixed(1)
                            : 0;
                    return (
                        <div
                            key={`legend-${index}`}
                            className={`pie-chart__legend-item ${activeIndex === index ? "pie-chart__legend-item--active" : ""
                                }`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <div className="pie-chart__legend-info">
                                <span
                                    className="pie-chart__legend-dot"
                                    style={{ background: entry.color }}
                                />
                                <span className="pie-chart__legend-name">
                                    {entry.value}
                                </span>
                            </div>
                            <div className="pie-chart__legend-bar-wrapper">
                                <div
                                    className="pie-chart__legend-bar"
                                    style={{
                                        width: `${percentage}%`,
                                        background: entry.color,
                                    }}
                                />
                            </div>
                            <span className="pie-chart__legend-percent">
                                {percentage}%
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderGradientDefs = () => (
        <defs>
            {GRADIENT_COLORS.map((color, index) => (
                <linearGradient
                    key={`pieGradient-${index}`}
                    id={`pieGradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop offset="0%" stopColor={color.start} stopOpacity={1} />
                    <stop offset="100%" stopColor={color.end} stopOpacity={0.9} />
                </linearGradient>
            ))}
        </defs>
    );

    // Calculate center position for label
    const CenterLabel = ({ viewBox }) => {
        const { cx, cy } = viewBox;
        return (
            <g>
                <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pie-chart__center-title"
                    style={{
                        fontSize: "13px",
                        fill: "#64748b",
                        fontWeight: 500,
                    }}
                >
                    {centerLabelTitle}
                </text>
                <text
                    x={cx}
                    y={cy + 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pie-chart__center-value"
                    style={{
                        fontSize: "20px",
                        fill: "#1e293b",
                        fontWeight: 700,
                    }}
                >
                    {formatTooltipValue(total)}
                </text>
            </g>
        );
    };

    return (
        <div className={`pie-chart ${animated ? "pie-chart--animated" : ""}`}>
            {title && <h4 className="pie-chart__title">{title}</h4>}
            <div className="pie-chart__container">
                <div className="pie-chart__chart-wrapper">
                    <ResponsiveContainer width="100%" height={height}>
                        <RechartsPieChart>
                            {renderGradientDefs()}
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                fill="#8884d8"
                                dataKey={dataKey}
                                nameKey={nameKey}
                                paddingAngle={paddingAngle}
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                                animationDuration={animated ? 1000 : 0}
                                animationBegin={0}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            entry.color ||
                                            `url(#pieGradient-${index % GRADIENT_COLORS.length})`
                                        }
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.3s ease",
                                        }}
                                    />
                                ))}
                            </Pie>
                            {showCenterLabel && (
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                >
                                    <tspan
                                        x="50%"
                                        dy="-12"
                                        style={{
                                            fontSize: "13px",
                                            fill: "#64748b",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {centerLabelTitle}
                                    </tspan>
                                    <tspan
                                        x="50%"
                                        dy="28"
                                        style={{
                                            fontSize: "18px",
                                            fill: "#1e293b",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {formatTooltipValue(total)}
                                    </tspan>
                                </text>
                            )}
                            <Tooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>
                {showLegend && (
                    <CustomLegend
                        payload={data.map((item, index) => ({
                            value: item[nameKey],
                            color: item.color || GRADIENT_COLORS[index % GRADIENT_COLORS.length].start,
                            payload: item,
                        }))}
                    />
                )}
            </div>
        </div>
    );
}
