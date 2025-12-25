import { useState } from "react";
import dayjs from "dayjs";
import { Calendar, X } from "lucide-react";
import "./DateRangeFilter.scss";

const QUICK_RANGES = [
    { label: "Hôm nay", days: 0 },
    { label: "7 ngày qua", days: 7 },
    { label: "30 ngày qua", days: 30 },
    { label: "90 ngày qua", days: 90 },
    { label: "Tháng này", type: "month" },
    { label: "Tháng trước", type: "lastMonth" },
    { label: "Quý này", type: "quarter" },
    { label: "Năm này", type: "year" },
];

export default function DateRangeFilter({
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
    showQuickRanges = true,
    className = "",
}) {
    const [isOpen, setIsOpen] = useState(false);

    const handleQuickRange = (range) => {
        const today = dayjs();
        let newFromDate, newToDate;

        if (range.days !== undefined) {
            newFromDate = today.subtract(range.days, "day");
            newToDate = today;
        } else {
            switch (range.type) {
                case "month":
                    newFromDate = today.startOf("month");
                    newToDate = today.endOf("month");
                    break;
                case "lastMonth":
                    newFromDate = today.subtract(1, "month").startOf("month");
                    newToDate = today.subtract(1, "month").endOf("month");
                    break;
                case "quarter":
                    newFromDate = today.startOf("quarter");
                    newToDate = today.endOf("quarter");
                    break;
                case "year":
                    newFromDate = today.startOf("year");
                    newToDate = today.endOf("year");
                    break;
                default:
                    return;
            }
        }

        onFromDateChange(newFromDate.format("YYYY-MM-DD"));
        onToDateChange(newToDate.format("YYYY-MM-DD"));
        setIsOpen(false);
    };

    const clearDates = () => {
        const today = dayjs();
        onFromDateChange(today.subtract(30, "day").format("YYYY-MM-DD"));
        onToDateChange(today.format("YYYY-MM-DD"));
    };

    return (
        <div className={`date-range-filter ${className}`}>
            <div className="date-range-filter__inputs">
                <div className="date-range-filter__input-group">
                    <label className="date-range-filter__label">
                        <Calendar size={16} />
                        Từ ngày
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => onFromDateChange(e.target.value)}
                        className="date-range-filter__input"
                        max={toDate}
                    />
                </div>
                <div className="date-range-filter__separator">→</div>
                <div className="date-range-filter__input-group">
                    <label className="date-range-filter__label">
                        <Calendar size={16} />
                        Đến ngày
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => onToDateChange(e.target.value)}
                        className="date-range-filter__input"
                        min={fromDate}
                        max={dayjs().format("YYYY-MM-DD")}
                    />
                </div>
                <button
                    type="button"
                    onClick={clearDates}
                    className="date-range-filter__clear"
                    title="Đặt lại"
                >
                    <X size={16} />
                </button>
            </div>

            {showQuickRanges && (
                <div className="date-range-filter__quick-ranges">
                    <span className="date-range-filter__quick-label">Nhanh:</span>
                    {QUICK_RANGES.map((range) => (
                        <button
                            key={range.label}
                            type="button"
                            onClick={() => handleQuickRange(range)}
                            className="date-range-filter__quick-btn"
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

