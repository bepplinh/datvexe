import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import "./PeriodRangeSelector.scss";

export default function PeriodRangeSelector({
    period,
    fromValue,
    toValue,
    onFromChange,
    onToChange,
    className = "",
}) {
    const [fromOptions, setFromOptions] = useState([]);
    const [toOptions, setToOptions] = useState([]);

    // Generate options based on period type
    useEffect(() => {
        const options = generatePeriodOptions(period);
        setFromOptions(options);
        setToOptions(options);
    }, [period]);

    // Generate period options
    const generatePeriodOptions = (periodType) => {
        const options = [];
        const today = dayjs();
        let current, endDate, formatFunc, labelFunc;

        switch (periodType) {
            case "day":
                // Last 12 months of days
                endDate = today;
                current = today.subtract(365, "day");
                formatFunc = (d) => d.format("YYYY-MM-DD");
                labelFunc = (d) => d.format("DD/MM/YYYY");
                break;
            case "week":
                // Last 52 weeks
                endDate = today.endOf("week");
                current = today.subtract(52, "week").startOf("week");
                formatFunc = (d) => {
                    const weekStart = d.startOf("week");
                    return `${weekStart.format("YYYY-MM-DD")}_${weekStart.format("WW")}`;
                };
                labelFunc = (d) => {
                    const weekStart = d.startOf("week");
                    return `Tuần ${weekStart.format("WW")} (${weekStart.format("DD/MM")} - ${weekStart.add(6, "day").format("DD/MM/YYYY")})`;
                };
                break;
            case "month":
                // Last 24 months
                endDate = today.endOf("month");
                current = today.subtract(24, "month").startOf("month");
                formatFunc = (d) => d.format("YYYY-MM");
                labelFunc = (d) => d.format("MM/YYYY");
                break;
            case "quarter":
                // Last 8 quarters
                endDate = today.endOf("quarter");
                current = today.subtract(8, "quarter").startOf("quarter");
                formatFunc = (d) => {
                    const quarter = Math.floor(d.month() / 3) + 1;
                    return `${d.year()}-Q${quarter}`;
                };
                labelFunc = (d) => {
                    const quarter = Math.floor(d.month() / 3) + 1;
                    return `Q${quarter}/${d.year()}`;
                };
                break;
            case "year":
                // Last 10 years
                endDate = today.endOf("year");
                current = today.subtract(10, "year").startOf("year");
                formatFunc = (d) => d.format("YYYY");
                labelFunc = (d) => d.format("YYYY");
                break;
            default:
                return [];
        }

        while (current.isBefore(endDate) || current.isSame(endDate, periodType === "day" ? "day" : periodType === "week" ? "week" : periodType === "month" ? "month" : periodType === "quarter" ? "quarter" : "year")) {
            const value = formatFunc(current);
            const label = labelFunc(current);
            options.push({ value, label, date: current.clone() });
            
            // Move to next period
            switch (periodType) {
                case "day":
                    current = current.add(1, "day");
                    break;
                case "week":
                    current = current.add(1, "week");
                    break;
                case "month":
                    current = current.add(1, "month");
                    break;
                case "quarter":
                    current = current.add(1, "quarter");
                    break;
                case "year":
                    current = current.add(1, "year");
                    break;
            }
        }

        return options.reverse(); // Most recent first
    };

    // Convert period value to date range
    const periodValueToDateRange = (value, periodType) => {
        if (!value) return { from: null, to: null };

        switch (periodType) {
            case "day":
                const day = dayjs(value);
                return {
                    from: day.format("YYYY-MM-DD"),
                    to: day.format("YYYY-MM-DD"),
                };
            case "week":
                const [weekDate] = value.split("_");
                const weekStart = dayjs(weekDate);
                return {
                    from: weekStart.format("YYYY-MM-DD"),
                    to: weekStart.add(6, "day").format("YYYY-MM-DD"),
                };
            case "month":
                const month = dayjs(value + "-01");
                return {
                    from: month.startOf("month").format("YYYY-MM-DD"),
                    to: month.endOf("month").format("YYYY-MM-DD"),
                };
            case "quarter":
                const [year, quarter] = value.split("-Q");
                const quarterStart = dayjs(`${year}-${(parseInt(quarter) - 1) * 3 + 1}-01`);
                return {
                    from: quarterStart.startOf("quarter").format("YYYY-MM-DD"),
                    to: quarterStart.endOf("quarter").format("YYYY-MM-DD"),
                };
            case "year":
                const yearDate = dayjs(value + "-01-01");
                return {
                    from: yearDate.startOf("year").format("YYYY-MM-DD"),
                    to: yearDate.endOf("year").format("YYYY-MM-DD"),
                };
            default:
                return { from: null, to: null };
        }
    };

    // Convert date range to period value
    const dateRangeToPeriodValue = (fromDate, toDate, periodType) => {
        if (!fromDate) return "";

        const from = dayjs(fromDate);

        switch (periodType) {
            case "day":
                return from.format("YYYY-MM-DD");
            case "week":
                const weekStart = from.startOf("week");
                return `${weekStart.format("YYYY-MM-DD")}_${weekStart.format("WW")}`;
            case "month":
                return from.format("YYYY-MM");
            case "quarter":
                const quarter = Math.floor(from.month() / 3) + 1;
                return `${from.year()}-Q${quarter}`;
            case "year":
                return from.format("YYYY");
            default:
                return "";
        }
    };

    // No need to initialize, values come from props

    const handleFromChange = (e) => {
        const value = e.target.value;
        if (!value) {
            onFromChange("");
            return;
        }
        const { from, to } = periodValueToDateRange(value, period);
        if (from && to) {
            onFromChange(from);
            // Auto set to same period if to is not set
            if (!toValue) {
                onToChange(to);
            } else {
                // Validate: to must be >= from
                const toDate = dayjs(toValue);
                const fromDate = dayjs(from);
                if (toDate.isBefore(fromDate, period === "day" ? "day" : period === "week" ? "week" : period === "month" ? "month" : period === "quarter" ? "quarter" : "year")) {
                    onToChange(to);
                }
            }
        }
    };

    const handleToChange = (e) => {
        const value = e.target.value;
        if (!value) {
            onToChange("");
            return;
        }
        const { from, to } = periodValueToDateRange(value, period);
        if (from && to) {
            onToChange(to);
        }
    };

    // Get current period values from date range
    const currentFromValue = fromValue ? dateRangeToPeriodValue(fromValue, fromValue, period) : "";
    const currentToValue = toValue ? dateRangeToPeriodValue(toValue, toValue, period) : "";

    // Filter to options based on from selection
    const filteredToOptions = currentFromValue
        ? toOptions.filter((opt) => {
              const fromOption = fromOptions.find(o => o.value === currentFromValue);
              if (!fromOption) return true;
              
              const optDate = opt.date;
              const fromDate = fromOption.date;
              
              // Compare based on period type
              if (period === "day") {
                  return optDate.isSameOrAfter(fromDate, "day");
              } else if (period === "week") {
                  return optDate.isSameOrAfter(fromDate, "week");
              } else if (period === "month") {
                  return optDate.isSameOrAfter(fromDate, "month");
              } else if (period === "quarter") {
                  return optDate.isSameOrAfter(fromDate, "quarter");
              } else if (period === "year") {
                  return optDate.isSameOrAfter(fromDate, "year");
              }
              return true;
          })
        : toOptions;

    const getPeriodLabel = () => {
        switch (period) {
            case "day":
                return "Ngày";
            case "week":
                return "Tuần";
            case "month":
                return "Tháng";
            case "quarter":
                return "Quý";
            case "year":
                return "Năm";
            default:
                return "Kỳ";
        }
    };

    return (
        <div className={`period-range-selector ${className}`}>
            <div className="period-range-selector__header">
                <label className="period-range-selector__label">
                    <Calendar size={16} />
                    Chọn {getPeriodLabel()}
                </label>
            </div>
            <div className="period-range-selector__inputs">
                <div className="period-range-selector__input-group">
                    <label className="period-range-selector__input-label">Từ {getPeriodLabel()}</label>
                    <select
                        value={currentFromValue}
                        onChange={handleFromChange}
                        className="period-range-selector__select"
                    >
                        <option value="">-- Chọn --</option>
                        {fromOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="period-range-selector__separator">→</div>
                <div className="period-range-selector__input-group">
                    <label className="period-range-selector__input-label">Đến {getPeriodLabel()}</label>
                    <select
                        value={currentToValue}
                        onChange={handleToChange}
                        className="period-range-selector__select"
                        disabled={!currentFromValue}
                    >
                        <option value="">-- Chọn --</option>
                        {filteredToOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

