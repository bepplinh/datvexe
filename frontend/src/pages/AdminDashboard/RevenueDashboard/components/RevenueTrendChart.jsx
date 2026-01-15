import LineChart from "../../../../components/shared/charts/LineChart/LineChart";
import { formatCurrency } from "../utils/formatUtils";

export default function RevenueTrendChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">
                Không có dữ liệu trong khoảng thời gian này
            </div>
        );
    }

    return (
        <LineChart
            data={data}
            xKey="label"
            lines={[
                {
                    key: "revenue",
                    name: "Doanh thu",
                    stroke: "#3b82f6",
                    strokeWidth: 2.5,
                },
            ]}
            height={350}
            formatValue={formatCurrency}
            showArea={true}
            showAverage={true}
            animated={true}
            colorScheme="blue"
            showLegend={false}
        />
    );
}
