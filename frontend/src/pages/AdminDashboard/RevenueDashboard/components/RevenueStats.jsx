import { DollarSign, TrendingUp, TrendingDown, Calendar, Bus } from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/formatUtils";
import { PERIOD_OPTIONS } from "../constants";

export default function RevenueStats({ dashboardData, period }) {
    if (!dashboardData) return null;

    const comparison = dashboardData.comparison || {};
    const currentPeriod = dashboardData.current_period || {};
    const previousPeriod = dashboardData.previous_period || {};

    return (
        <div className="revenue-dashboard__stats">
            <div className="revenue-stat-card revenue-stat-card--primary">
                <div className="revenue-stat-card__icon">
                    <DollarSign size={24} />
                </div>
                <div className="revenue-stat-card__content">
                    <div className="revenue-stat-card__label">
                        Doanh thu{" "}
                        {PERIOD_OPTIONS.find((p) => p.value === period)?.label.toLowerCase()}
                    </div>
                    <div className="revenue-stat-card__value">
                        {formatCurrency(currentPeriod.revenue)}
                    </div>
                    <div
                        className={`revenue-stat-card__change ${
                            comparison.revenue_change >= 0
                                ? "revenue-stat-card__change--up"
                                : "revenue-stat-card__change--down"
                        }`}
                    >
                        {comparison.revenue_change >= 0 ? (
                            <TrendingUp size={14} />
                        ) : (
                            <TrendingDown size={14} />
                        )}
                        <span>
                            {Math.abs(comparison.revenue_change || 0).toFixed(2)}%
                        </span>
                        <span className="revenue-stat-card__change-label">
                            ({formatCurrency(Math.abs(comparison.revenue_change_amount || 0))})
                        </span>
                    </div>
                </div>
            </div>

            <div className="revenue-stat-card revenue-stat-card--secondary">
                <div className="revenue-stat-card__icon">
                    <Bus size={24} />
                </div>
                <div className="revenue-stat-card__content">
                    <div className="revenue-stat-card__label">Số vé đã bán</div>
                    <div className="revenue-stat-card__value">
                        {formatNumber(currentPeriod.booking_count)}
                    </div>
                    <div
                        className={`revenue-stat-card__change ${
                            comparison.booking_change >= 0
                                ? "revenue-stat-card__change--up"
                                : "revenue-stat-card__change--down"
                        }`}
                    >
                        {comparison.booking_change >= 0 ? (
                            <TrendingUp size={14} />
                        ) : (
                            <TrendingDown size={14} />
                        )}
                        <span>
                            {Math.abs(comparison.booking_change || 0).toFixed(2)}%
                        </span>
                        <span className="revenue-stat-card__change-label">
                            ({comparison.booking_change_amount || 0} vé)
                        </span>
                    </div>
                </div>
            </div>

            <div className="revenue-stat-card revenue-stat-card--info">
                <div className="revenue-stat-card__icon">
                    <Calendar size={24} />
                </div>
                <div className="revenue-stat-card__content">
                    <div className="revenue-stat-card__label">Kỳ trước</div>
                    <div className="revenue-stat-card__value">
                        {formatCurrency(previousPeriod.revenue)}
                    </div>
                    <div className="revenue-stat-card__change-label">
                        {formatNumber(previousPeriod.booking_count)} vé
                    </div>
                </div>
            </div>
        </div>
    );
}

