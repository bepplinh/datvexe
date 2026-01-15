import { useState, useEffect, useRef } from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Ticket } from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatUtils";
import { PERIOD_OPTIONS } from "../constants";

// Animated counter hook
function useCountUp(end, duration = 1500) {
    const [count, setCount] = useState(0);
    const animationFrame = useRef(null);

    useEffect(() => {
        // Cancel any existing animation
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }

        // Check if value is valid
        const endValue = Number(end) || 0;

        // Skip animation if end is 0 or equal to current count
        if (endValue === 0) {
            setCount(0);
            return;
        }

        let startTime = null;
        const startValue = 0; // Always start from 0 for clean animation

        const animate = (currentTime) => {
            if (!startTime) {
                startTime = currentTime;
            }

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + easeOut * (endValue - startValue));

            setCount(currentValue);

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                setCount(endValue);
            }
        };

        animationFrame.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [end, duration]);

    return count;
}

function StatCard({ icon: Icon, label, value, change, changeAmount, variant = "primary", formatFn }) {
    const animatedValue = useCountUp(value || 0, 1500);
    const formattedValue = formatFn ? formatFn(animatedValue) : animatedValue;
    const isPositive = change >= 0;

    return (
        <div className={`revenue-stat-card revenue-stat-card--${variant}`}>
            <div className="revenue-stat-card__icon-wrapper">
                <div className="revenue-stat-card__icon">
                    <Icon size={24} />
                </div>
                <div className="revenue-stat-card__glow" />
            </div>
            <div className="revenue-stat-card__content">
                <div className="revenue-stat-card__label">{label}</div>
                <div className="revenue-stat-card__value">{formattedValue}</div>
                {change !== undefined && (
                    <div
                        className={`revenue-stat-card__change ${isPositive
                            ? "revenue-stat-card__change--up"
                            : "revenue-stat-card__change--down"
                            }`}
                    >
                        <span className="revenue-stat-card__change-icon">
                            {isPositive ? (
                                <TrendingUp size={14} />
                            ) : (
                                <TrendingDown size={14} />
                            )}
                        </span>
                        <span className="revenue-stat-card__change-value">
                            {Math.abs(change || 0).toFixed(1)}%
                        </span>
                        {changeAmount !== undefined && (
                            <span className="revenue-stat-card__change-amount">
                                {changeAmount}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RevenueStats({ dashboardData, period }) {
    if (!dashboardData) return null;

    const comparison = dashboardData.comparison || {};
    const currentPeriod = dashboardData.current_period || {};
    const previousPeriod = dashboardData.previous_period || {};

    const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label?.toLowerCase() || "";

    return (
        <div className="revenue-dashboard__stats">
            <StatCard
                icon={DollarSign}
                label={`Doanh thu ${periodLabel}`}
                value={currentPeriod.revenue}
                change={comparison.revenue_change}
                changeAmount={formatCurrency(Math.abs(comparison.revenue_change_amount || 0))}
                variant="primary"
                formatFn={formatCurrency}
            />

            <StatCard
                icon={Ticket}
                label="Số vé đã bán"
                value={currentPeriod.booking_count}
                change={comparison.booking_change}
                changeAmount={`${Math.abs(comparison.booking_change_amount || 0)} vé`}
                variant="secondary"
                formatFn={formatNumber}
            />

            <StatCard
                icon={Calendar}
                label="Kỳ trước"
                value={previousPeriod.revenue}
                variant="info"
                formatFn={formatCurrency}
            />
        </div>
    );
}
