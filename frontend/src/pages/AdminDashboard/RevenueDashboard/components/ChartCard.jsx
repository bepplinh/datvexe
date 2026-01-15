import { TrendingUp, BarChart2, PieChart, Table2, Activity } from "lucide-react";

const ICONS = {
    trend: TrendingUp,
    bar: BarChart2,
    pie: PieChart,
    table: Table2,
    activity: Activity,
};

export default function ChartCard({ title, subtitle, icon = null, children, loading = false }) {
    const IconComponent = typeof icon === "string" ? ICONS[icon] : icon;

    return (
        <div className="revenue-dashboard__chart-card">
            <div className="revenue-dashboard__chart-header">
                <div className="revenue-dashboard__chart-header-content">
                    {IconComponent && (
                        <div className="revenue-dashboard__chart-icon">
                            <IconComponent size={18} />
                        </div>
                    )}
                    <div>
                        <h3 className="revenue-dashboard__chart-title">{title}</h3>
                        {subtitle && (
                            <p className="revenue-dashboard__chart-subtitle">{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="revenue-dashboard__chart-body">
                {loading ? (
                    <div className="revenue-dashboard__chart-loading">
                        <div className="revenue-dashboard__chart-spinner" />
                        <span>Đang tải...</span>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
