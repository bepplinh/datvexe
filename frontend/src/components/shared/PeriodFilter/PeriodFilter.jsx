import { Calendar } from "lucide-react";
import "./PeriodFilter.scss";

const PERIOD_OPTIONS = [
    { value: "day", label: "Ngày" },
    { value: "week", label: "Tuần" },
    { value: "month", label: "Tháng" },
    { value: "quarter", label: "Quý" },
    { value: "year", label: "Năm" },
];

export default function PeriodFilter({
    period,
    date,
    onPeriodChange,
    onDateChange,
    className = "",
}) {
    return (
        <div className={`period-filter ${className}`}>
            <div className="period-filter__group">
                <label className="period-filter__label">
                    <Calendar size={16} />
                    Kỳ báo cáo
                </label>
                <select
                    value={period}
                    onChange={(e) => onPeriodChange(e.target.value)}
                    className="period-filter__select"
                >
                    {PERIOD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="period-filter__group">
                <label className="period-filter__label">Ngày</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="period-filter__input"
                    max={new Date().toISOString().split("T")[0]}
                />
            </div>
        </div>
    );
}

