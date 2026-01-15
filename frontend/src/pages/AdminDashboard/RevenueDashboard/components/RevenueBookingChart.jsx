import LineChart from "../../../../components/shared/charts/LineChart/LineChart";

export default function RevenueBookingChart({ data }) {
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
                    key: "booking_count",
                    name: "Số vé",
                    stroke: "#10b981",
                    strokeWidth: 2.5,
                    colorScheme: "green",
                },
            ]}
            height={350}
            showArea={true}
            animated={true}
            colorScheme="green"
            showLegend={false}
        />
    );
}
