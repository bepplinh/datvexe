import { Calendar, HelpCircle } from "lucide-react";
import { useState } from "react";
import "./PeriodSelector.scss";

const PERIOD_OPTIONS = [
    {
        value: "day",
        label: "Ngày",
        description: "So sánh hôm nay với hôm qua"
    },
    {
        value: "week",
        label: "Tuần",
        description: "So sánh tuần này với tuần trước"
    },
    {
        value: "month",
        label: "Tháng",
        description: "So sánh tháng này với tháng trước"
    },
    {
        value: "quarter",
        label: "Quý",
        description: "So sánh quý này với quý trước"
    },
    {
        value: "year",
        label: "Năm",
        description: "So sánh năm nay với năm trước"
    },
];

export default function PeriodSelector({ value, onChange, className = "" }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const selectedOption = PERIOD_OPTIONS.find((opt) => opt.value === value);

    return (
        <div className={`period-selector ${className}`}>
            <div className="period-selector__header">
                <label className="period-selector__label">
                    <Calendar size={16} />
                    Đơn vị so sánh
                </label>
                <div
                    className="period-selector__help"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <HelpCircle size={16} />
                    {showTooltip && (
                        <div className="period-selector__tooltip">
                            <p>
                                Chọn đơn vị thời gian để so sánh. Date Range sẽ tự động được cập nhật theo đơn vị đã chọn.
                                <br /><br />
                                <strong>Ví dụ:</strong>
                                <br />• Chọn "Tháng" → Date Range: Tháng này (01/12 - 31/12)
                                <br />• Chọn "Tuần" → Date Range: Tuần này
                                <br />• Chọn "Quý" → Date Range: Quý này
                                <br /><br />
                                Hệ thống sẽ so sánh kỳ hiện tại với kỳ trước tương ứng.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="period-selector__select"
            >
                {PERIOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {selectedOption && (
                <div className="period-selector__description">
                    {selectedOption.description}
                </div>
            )}
        </div>
    );
}

