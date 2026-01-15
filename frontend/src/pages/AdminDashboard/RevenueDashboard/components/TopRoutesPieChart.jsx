import PieChart from "../../../../components/shared/charts/PieChart/PieChart";
import { formatCurrency } from "../utils/formatUtils";

export default function TopRoutesPieChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">
                Không có dữ liệu phân bổ doanh thu
            </div>
        );
    }

    const chartData = data.map((route) => ({
        name: route.route_name || `${route.from_city} → ${route.to_city}`,
        value: route.revenue,
    }));

    return (
        <PieChart
            data={chartData}
            dataKey="value"
            nameKey="name"
            height={320}
            formatValue={formatCurrency}
            showLegend={true}
            innerRadius="55%"
            outerRadius="80%"
            showCenterLabel={true}
            centerLabelTitle="Tổng DT"
            paddingAngle={3}
            animated={true}
        />
    );
}
