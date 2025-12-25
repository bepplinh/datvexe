import { useState } from "react";
import { exportService } from "../../../services/admin/exportService";
import { toast } from "react-toastify";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import DateRangeFilter from "../../../components/shared/DateRangeFilter/DateRangeFilter";
import PeriodFilter from "../../../components/shared/PeriodFilter/PeriodFilter";
import "./ExportReports.scss";

const EXPORT_TYPES = [
    { value: "revenue", label: "Doanh thu", icon: FileSpreadsheet },
    { value: "bookings", label: "Danh sách Booking", icon: FileText },
    { value: "payments", label: "Danh sách Payment", icon: FileSpreadsheet },
    { value: "financial", label: "Báo cáo Tài chính", icon: FileText },
];

const EXPORT_FORMATS = [
    { value: "excel", label: "Excel (.xlsx)", icon: FileSpreadsheet },
    { value: "pdf", label: "PDF (.pdf)", icon: FileText },
];

export default function ExportReports() {
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(
        dayjs().subtract(30, "day").format("YYYY-MM-DD")
    );
    const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [period, setPeriod] = useState("day");
    const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [exportType, setExportType] = useState("revenue");
    const [exportFormat, setExportFormat] = useState("excel");

    const handleExport = async () => {
        try {
            setLoading(true);
            const response = await exportService.exportData({
                type: exportType,
                format: exportFormat,
                from_date: fromDate,
                to_date: toDate,
                period,
            });

            if (response.success) {
                // Convert data to Excel/PDF
                // For now, we'll download as JSON and user can use Excel/PDF library
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${exportType}_${fromDate}_${toDate}.json`;
                link.click();
                URL.revokeObjectURL(url);

                toast.success("Xuất file thành công!");
            }
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Không thể xuất file");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="export-reports">
            <div className="export-reports__header">
                <div>
                    <h1 className="export-reports__title">Xuất Báo cáo</h1>
                    <p className="export-reports__subtitle">
                        Xuất dữ liệu báo cáo ra file Excel hoặc PDF
                    </p>
                </div>
            </div>

            <div className="export-reports__content">
                <div className="export-reports__filters">
                    <DateRangeFilter
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={setFromDate}
                        onToDateChange={setToDate}
                    />
                    <PeriodFilter
                        period={period}
                        date={date}
                        onPeriodChange={setPeriod}
                        onDateChange={setDate}
                    />
                </div>

                <div className="export-reports__options">
                    <div className="export-reports__option-group">
                        <h3 className="export-reports__option-title">Loại báo cáo</h3>
                        <div className="export-reports__option-grid">
                            {EXPORT_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setExportType(type.value)}
                                        className={`export-reports__option-btn ${
                                            exportType === type.value
                                                ? "export-reports__option-btn--active"
                                                : ""
                                        }`}
                                    >
                                        <Icon size={24} />
                                        <span>{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="export-reports__option-group">
                        <h3 className="export-reports__option-title">Định dạng file</h3>
                        <div className="export-reports__option-grid">
                            {EXPORT_FORMATS.map((format) => {
                                const Icon = format.icon;
                                return (
                                    <button
                                        key={format.value}
                                        type="button"
                                        onClick={() => setExportFormat(format.value)}
                                        className={`export-reports__option-btn ${
                                            exportFormat === format.value
                                                ? "export-reports__option-btn--active"
                                                : ""
                                        }`}
                                    >
                                        <Icon size={24} />
                                        <span>{format.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="export-reports__actions">
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={loading}
                        className="export-reports__export-btn"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Đang xuất...</span>
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                <span>Xuất file</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

