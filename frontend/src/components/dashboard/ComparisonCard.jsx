import StatsCard from "../shared/StatsCard/StatsCard";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage, calculateTrend } from "../../utils/dashboardFormatters";
import "./ComparisonCard.scss";

export default function ComparisonCard({
    title,
    currentValue,
    previousValue,
    unit = "",
    formatValue,
    icon: Icon,
}) {
    const trend = calculateTrend(currentValue, previousValue);

    const getTrendIcon = () => {
        if (trend.isPositive) return <TrendingUp size={16} />;
        if (trend.isNegative) return <TrendingDown size={16} />;
        return <Minus size={16} />;
    };

    const getTrendClass = () => {
        if (trend.isPositive) return "comparison-card__trend--up";
        if (trend.isNegative) return "comparison-card__trend--down";
        return "comparison-card__trend--neutral";
    };

    const displayValue = formatValue
        ? formatValue(currentValue)
        : formatNumber(currentValue, unit);

    return (
        <div className="comparison-card">
            <StatsCard
                title={title}
                value={currentValue}
                previousValue={previousValue}
                unit={unit}
                icon={Icon}
                formatValue={formatValue}
                trend={trend.isPositive ? trend.value : trend.isNegative ? -trend.value : 0}
                trendLabel="so với kỳ trước"
            />
        </div>
    );
}

