import PieChart from "../../../../components/shared/charts/PieChart/PieChart";
import { formatCurrency } from "../utils/formatUtils";

export default function TopRoutesPieChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">Không có dữ liệu</div>
        );
    }

    const total = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const chartData = data.map((route) => ({
        name: route.route_name || `${route.from_city} → ${route.to_city}`,
        value: route.revenue,
        total,
    }));

    return (
        <PieChart
            data={chartData}
            dataKey="value"
            nameKey="name"
            height={350}
            formatValue={formatCurrency}
            showLegend={true}
        />
    );
}

