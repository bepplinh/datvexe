import LineChart from "../../../../components/shared/charts/LineChart/LineChart";
import { formatCurrency } from "../utils/formatUtils";

export default function RevenueTrendChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">Không có dữ liệu</div>
        );
    }

    return (
        <LineChart
            data={data}
            xKey="label"
            dataKey="revenue"
            lines={[
                {
                    key: "revenue",
                    name: "Doanh thu",
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                },
            ]}
            height={350}
            formatValue={formatCurrency}
        />
    );
}

