import LineChart from "../../../../components/shared/charts/LineChart/LineChart";

export default function RevenueBookingChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="revenue-dashboard__empty">Không có dữ liệu</div>
        );
    }

    return (
        <LineChart
            data={data}
            xKey="label"
            dataKey="booking_count"
            lines={[
                {
                    key: "booking_count",
                    name: "Số vé",
                    stroke: "#10b981",
                    strokeWidth: 2,
                },
            ]}
            height={350}
        />
    );
}

