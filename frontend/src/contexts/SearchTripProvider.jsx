// SearchTripContext.jsx
import { createContext, useContext, useState } from "react";
import dayjs from "dayjs";
import axiosClient from "../apis/axiosClient";

const SearchTripContext = createContext(null);

export const SearchTripProvider = ({ children }) => {
    const [tripType, setTripType] = useState("oneway");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [departDate, setDepartDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const handleSearchTrip = async () => {
        if (!from) {
            return { ok: false, message: "Vui lòng chọn điểm đi" };
        }
        if (!to) {
            return { ok: false, message: "Vui lòng chọn điểm đến" };
        }
        if (!departDate) {
            return { ok: false, message: "Vui lòng chọn ngày đi" };
        }
        if (tripType === "roundtrip" && !returnDate) {
            return { ok: false, message: "Vui lòng chọn ngày về" };
        }

        const payload = {
            from_location_id: from.id,
            to_location_id: to.id,
            date: dayjs(departDate).format("YYYY-MM-DD"),
        };

        if (tripType === "roundtrip" && returnDate) {
            payload.return_date = (dayjs(returnDate).format("YYYY-MM-DD"));
        }

        setLoading(true);
        try {
            const res = await axiosClient.post("/client/trips/search", payload);
            if (res.data?.success) {
                setResults(res.data.data);
                return { success: true, data: res.data.data };
            }

            return {
                success: false,
                message: res.data?.message || "Có lỗi xảy ra khi tìm chuyến",
            };
        } catch (error) {
            // 404: không có chuyến xe nào
            if (error.response) {
                const { status, data } = error.response;
                if (status === 404 && data?.message) {
                    return { success: false, message: data.message };
                }
                return {
                    success: false,
                    message: data?.message || "Có lỗi xảy ra khi tìm chuyến",
                };
            }
            return { success: false, message: "Không thể kết nối tới máy chủ" };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        tripType,
        setTripType,
        from,
        setFrom,
        to,
        setTo,
        departDate,
        setDepartDate,
        returnDate,
        setReturnDate,
        loading, results, setResults, handleSearchTrip,
    };

    return (
        <SearchTripContext.Provider value={value}>
            {children}
        </SearchTripContext.Provider>
    );
};

export const useSearchTrip = () => {
    const ctx = useContext(SearchTripContext);
    if (!ctx) {
        throw new Error("useSearchTrip must be used within SearchTripProvider");
    }
    return ctx;
};
