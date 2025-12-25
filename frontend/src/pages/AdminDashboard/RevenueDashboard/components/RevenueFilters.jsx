import { PERIOD_OPTIONS } from "../constants";

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
        <>
            <div className="revenue-dashboard__filters">
                <div className="revenue-dashboard__filter-group">
                    <label>Kỳ báo cáo:</label>
                    <select
                        value={period}
                        onChange={(e) => onPeriodChange(e.target.value)}
                        className="revenue-dashboard__select"
                    >
                        {PERIOD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="revenue-dashboard__filter-group">
                    <label>Ngày:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="revenue-dashboard__input"
                    />
                </div>
            </div>

            {showDateRange && (
                <div className="revenue-dashboard__chart-filters">
                    <div className="revenue-dashboard__filter-group">
                        <label>Từ ngày:</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => onFromDateChange(e.target.value)}
                            className="revenue-dashboard__input"
                        />
                    </div>
                    <div className="revenue-dashboard__filter-group">
                        <label>Đến ngày:</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => onToDateChange(e.target.value)}
                            className="revenue-dashboard__input"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

