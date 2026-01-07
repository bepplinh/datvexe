import { PERIOD_OPTIONS } from "../constants";
import DateRangeFilter from "../../../../components/shared/DateRangeFilter/DateRangeFilter";

export default function RevenueFilters({
    period,
    date,
    fromDate,
    toDate,
    onPeriodChange,
    onDateChange,
    onFromDateChange,
    onToDateChange,
    showDateRange = false,
}) {
    return (
        <div className="revenue-dashboard__filters-wrapper">
            {!showDateRange && (
                <div className="revenue-dashboard__filters">
                    <div className="revenue-dashboard__filter-group">
                        <label className="revenue-dashboard__filter-label">Kỳ:</label>
                        <select
                            value={period}
                            onChange={(e) => onPeriodChange(e.target.value)}
                            className="revenue-dashboard__select"
                        >
                            {PERIOD_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="revenue-dashboard__filter-group">
                        <label className="revenue-dashboard__filter-label">Ngày:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="revenue-dashboard__input"
                        />
                    </div>
                </div>
            )}

            {showDateRange && (
                <div className="revenue-dashboard__chart-filters">
                    <div className="revenue-dashboard__filter-group">
                        <label className="revenue-dashboard__filter-label">Kỳ:</label>
                        <select
                            value={period}
                            onChange={(e) => onPeriodChange(e.target.value)}
                            className="revenue-dashboard__input"
                        >
                            {PERIOD_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <DateRangeFilter
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={onFromDateChange}
                        onToDateChange={onToDateChange}
                    />
                </div>
            )}
        </div>
    );
}

