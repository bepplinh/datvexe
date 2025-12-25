import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import "./StatsCard.scss";

export default function StatsCard({
    title,
    value,
    previousValue,
    unit = "",
    icon: Icon,
    trend,
    trendLabel,
    className = "",
    formatValue,
}) {
    const formatNumber = (num) => {
        if (formatValue) return formatValue(num);
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num?.toLocaleString("vi-VN") || 0;
    };

    const getTrendIcon = () => {
        if (trend > 0) return <TrendingUp size={16} className="stats-card__trend-icon--up" />;
        if (trend < 0) return <TrendingDown size={16} className="stats-card__trend-icon--down" />;
        return <Minus size={16} className="stats-card__trend-icon--neutral" />;
    };

    const getTrendClass = () => {
        if (trend > 0) return "stats-card__trend--up";
        if (trend < 0) return "stats-card__trend--down";
        return "stats-card__trend--neutral";
    };

    return (
        <div className={`stats-card ${className}`}>
            <div className="stats-card__header">
                <div className="stats-card__title">{title}</div>
                {Icon && (
                    <div className="stats-card__icon">
                        <Icon size={20} />
                    </div>
                )}
            </div>
            <div className="stats-card__value">
                {formatNumber(value)}
                {unit && <span className="stats-card__unit">{unit}</span>}
            </div>
            {trend !== undefined && trend !== null && (
                <div className={`stats-card__trend ${getTrendClass()}`}>
                    {getTrendIcon()}
                    <span className="stats-card__trend-value">
                        {Math.abs(trend).toFixed(1)}%
                    </span>
                    {trendLabel && (
                        <span className="stats-card__trend-label">{trendLabel}</span>
                    )}
                </div>
            )}
            {previousValue !== undefined && previousValue !== null && (
                <div className="stats-card__previous">
                    Kỳ trước: {formatNumber(previousValue)}{unit}
                </div>
            )}
        </div>
    );
}

