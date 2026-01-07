import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import "./StatCard.scss";

export default function StatCard({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    formatValue = (v) => v,
    className = "",
}) {
    const hasChange = change !== null && change !== undefined;
    const isPositive = change > 0;
    const isNegative = change < 0;
    const isNeutral = change === 0;

    return (
        <div className={`stat-card ${className}`}>
            <div className="stat-card__header">
                {Icon && <Icon className="stat-card__icon" size={20} />}
                <h3 className="stat-card__title">{title}</h3>
            </div>
            <div className="stat-card__value">{formatValue(value)}</div>
            {hasChange && (
                <div className="stat-card__change">
                    <div
                        className={`stat-card__change-indicator ${
                            isPositive
                                ? "stat-card__change-indicator--positive"
                                : isNegative
                                ? "stat-card__change-indicator--negative"
                                : "stat-card__change-indicator--neutral"
                        }`}
                    >
                        {isPositive && <TrendingUp size={14} />}
                        {isNegative && <TrendingDown size={14} />}
                        {isNeutral && <Minus size={14} />}
                        <span>{Math.abs(change).toFixed(2)}%</span>
                    </div>
                    {changeLabel && (
                        <span className="stat-card__change-label">
                            {changeLabel}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

