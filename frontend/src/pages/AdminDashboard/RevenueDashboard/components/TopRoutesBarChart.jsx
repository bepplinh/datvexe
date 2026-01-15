import BarChart from "../../../../components/shared/charts/BarChart/BarChart";
import { formatCurrency } from "../utils/formatUtils";

export default function TopRoutesBarChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">
                Không có dữ liệu về tuyến đường
            </div>
        );
    }

    const chartData = data.map((route) => ({
        name: route.route_name || `${route.from_city} → ${route.to_city}`,
        revenue: route.revenue,
        booking_count: route.booking_count,
    }));

    return (
        <BarChart
            data={chartData}
            xKey="name"
            bars={[
                {
                    key: "revenue",
                    name: "Doanh thu",
                },
            ]}
            height={350}
            formatValue={formatCurrency}
            layout="vertical"
            showLabels={true}
            showLegend={false}
            animated={true}
            colorful={true}
        />
    );
}
