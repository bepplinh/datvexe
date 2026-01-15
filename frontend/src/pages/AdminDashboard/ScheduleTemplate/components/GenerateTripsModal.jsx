import React, { useState } from "react";
import {
    X,
    Play,
    Calendar,
    CalendarDays,
    CalendarRange,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader,
} from "lucide-react";
import { useAppSelector } from "../../../../store/hooks";
import "./GenerateTripsModal.scss";

const GenerateTripsModal = ({ open, onClose, onGenerate, templates }) => {
    const [range, setRange] = useState("day"); // day, week, month
    const [date, setDate] = useState(getTomorrow());
    const [startDate, setStartDate] = useState(getTomorrow());
    const [month, setMonth] = useState(getCurrentMonth());
    const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
    const [useAllTemplates, setUseAllTemplates] = useState(true);

    const { generateLoading, generateResult, generateError } = useAppSelector(
        (state) => state.scheduleTemplate
    );

    function getTomorrow() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    }

    function getCurrentMonth() {
        return new Date().toISOString().slice(0, 7);
    }

    const handleGenerate = async () => {
        const data = { range };

        switch (range) {
            case "day":
                data.date = date;
                break;
            case "week":
                data.start_date = startDate;
                break;
            case "month":
                data.month = month;
                break;
        }

        if (!useAllTemplates && selectedTemplateIds.length > 0) {
            data.template_ids = selectedTemplateIds;
        }

        try {
            await onGenerate(data);
        } catch (err) {
            console.error("Generate failed:", err);
        }
    };

    const handleTemplateToggle = (templateId) => {
        setSelectedTemplateIds((prev) =>
            prev.includes(templateId)
                ? prev.filter((id) => id !== templateId)
                : [...prev, templateId]
        );
    };

    // Calculate summary from result
    const getSummary = () => {
        if (!generateResult) return null;
        let totalCreated = 0;
        let totalSkipped = 0;
        Object.values(generateResult).forEach((dayResult) => {
            totalCreated += dayResult.created || 0;
            totalSkipped += dayResult.skipped || 0;
        });
        return { totalCreated, totalSkipped, days: Object.keys(generateResult).length };
    };

    const summary = getSummary();

    if (!open) return null;

    return (
        <div className="generate-trips-modal">
            <div className="generate-trips-modal__backdrop" onClick={onClose} />
            <div className="generate-trips-modal__container">
                <div className="generate-trips-modal__header">
                    <div className="generate-trips-modal__header-content">
                        <Play size={24} className="generate-trips-modal__icon" />
                        <h2>Sinh Chuyến Xe Từ Lịch Mẫu</h2>
                    </div>
                    <button
                        className="generate-trips-modal__close-btn"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="generate-trips-modal__content">
                    {/* Range Selection */}
                    <div className="generate-trips-modal__section">
                        <h3>Chọn phạm vi</h3>
                        <div className="generate-trips-modal__range-options">
                            <button
                                type="button"
                                className={`generate-trips-modal__range-btn ${range === "day" ? "active" : ""
                                    }`}
                                onClick={() => setRange("day")}
                            >
                                <Calendar size={20} />
                                <span>Một ngày</span>
                            </button>
                            <button
                                type="button"
                                className={`generate-trips-modal__range-btn ${range === "week" ? "active" : ""
                                    }`}
                                onClick={() => setRange("week")}
                            >
                                <CalendarDays size={20} />
                                <span>Một tuần</span>
                            </button>
                            <button
                                type="button"
                                className={`generate-trips-modal__range-btn ${range === "month" ? "active" : ""
                                    }`}
                                onClick={() => setRange("month")}
                            >
                                <CalendarRange size={20} />
                                <span>Một tháng</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Selection based on range */}
                    <div className="generate-trips-modal__section">
                        <h3>
                            {range === "day" && "Chọn ngày"}
                            {range === "week" && "Chọn ngày bắt đầu tuần"}
                            {range === "month" && "Chọn tháng"}
                        </h3>
                        <div className="generate-trips-modal__date-input">
                            {range === "day" && (
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={getTomorrow()}
                                />
                            )}
                            {range === "week" && (
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={getTomorrow()}
                                />
                            )}
                            {range === "month" && (
                                <input
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="generate-trips-modal__section">
                        <h3>Chọn lịch mẫu</h3>
                        <label className="generate-trips-modal__checkbox-label">
                            <input
                                type="checkbox"
                                checked={useAllTemplates}
                                onChange={(e) => setUseAllTemplates(e.target.checked)}
                            />
                            <span>Sử dụng tất cả lịch mẫu đang hoạt động</span>
                        </label>

                        {!useAllTemplates && (
                            <div className="generate-trips-modal__template-list">
                                {templates
                                    .filter((t) => t.active)
                                    .map((template) => (
                                        <label
                                            key={template.id}
                                            className="generate-trips-modal__template-item"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTemplateIds.includes(template.id)}
                                                onChange={() => handleTemplateToggle(template.id)}
                                            />
                                            <span>
                                                {template.route?.name || `Route #${template.route_id}`}{" "}
                                                - {template.departure_time?.slice(0, 5)}
                                            </span>
                                        </label>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Result Display */}
                    {generateResult && summary && (
                        <div className="generate-trips-modal__result">
                            <div className="generate-trips-modal__result-header">
                                <CheckCircle size={20} />
                                <span>Kết quả sinh chuyến xe</span>
                            </div>
                            <div className="generate-trips-modal__result-stats">
                                <div className="generate-trips-modal__result-stat success">
                                    <span className="value">{summary.totalCreated}</span>
                                    <span className="label">Đã tạo</span>
                                </div>
                                <div className="generate-trips-modal__result-stat warning">
                                    <span className="value">{summary.totalSkipped}</span>
                                    <span className="label">Đã bỏ qua</span>
                                </div>
                                <div className="generate-trips-modal__result-stat info">
                                    <span className="value">{summary.days}</span>
                                    <span className="label">Ngày</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {generateError && (
                        <div className="generate-trips-modal__error">
                            <AlertCircle size={18} />
                            <span>{generateError}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="generate-trips-modal__actions">
                    <button
                        type="button"
                        className="generate-trips-modal__btn generate-trips-modal__btn--secondary"
                        onClick={onClose}
                    >
                        {generateResult ? "Đóng" : "Hủy"}
                    </button>
                    {!generateResult && (
                        <button
                            type="button"
                            className="generate-trips-modal__btn generate-trips-modal__btn--primary"
                            onClick={handleGenerate}
                            disabled={generateLoading}
                        >
                            {generateLoading ? (
                                <>
                                    <Loader size={18} className="spin" />
                                    <span>Đang sinh...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={18} />
                                    <span>Sinh chuyến xe</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerateTripsModal;
