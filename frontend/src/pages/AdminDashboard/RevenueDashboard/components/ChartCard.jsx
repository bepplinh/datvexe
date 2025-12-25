export default function ChartCard({ title, children }) {
    return (
        <div className="revenue-dashboard__chart-card">
            <div className="revenue-dashboard__chart-header">
                <h3 className="revenue-dashboard__chart-title">{title}</h3>
            </div>
            <div className="revenue-dashboard__chart-body">{children}</div>
        </div>
    );
}

