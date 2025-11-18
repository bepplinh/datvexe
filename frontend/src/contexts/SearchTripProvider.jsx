import { createContext, useContext, useState, useEffect } from "react";
import dayjs from "dayjs";
import { saveToStorage, loadFromStorage } from "../utils/searchTripStorage";
import { searchTripsApi } from "../services/tripService";

const SearchTripContext = createContext(null);

export const SearchTripProvider = ({ children }) => {
    // 1. Khởi tạo State từ Storage
    const savedState = loadFromStorage();
    
    const [tripType, setTripType] = useState(savedState?.tripType || "oneway");
    const [from, setFrom] = useState(savedState?.from || "");
    const [to, setTo] = useState(savedState?.to || "");
    const [departDate, setDepartDate] = useState(savedState?.departDate || null);
    const [returnDate, setReturnDate] = useState(savedState?.returnDate || null);

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    // 2. Effect: Tự động lưu Storage khi state thay đổi
    useEffect(() => {
        saveToStorage({ tripType, from, to, departDate, returnDate });
    }, [tripType, from, to, departDate, returnDate]);

    // 3. Logic xử lý Search
    const handleSearchTrip = async () => {
        // --- Validation ---
        if (!from) return { ok: false, message: "Vui lòng chọn điểm đi" };
        if (!to) return { ok: false, message: "Vui lòng chọn điểm đến" };

        // --- Logic mặc định ngày (Default Date Logic) ---
        let finalDepartDate = departDate;
        if (!finalDepartDate) {
            finalDepartDate = dayjs().startOf('day');
            setDepartDate(finalDepartDate);
        }

        let finalReturnDate = returnDate;
        if (tripType === "roundtrip" && !finalReturnDate) {
            finalReturnDate = dayjs(finalDepartDate).add(1, 'day').startOf('day');
            setReturnDate(finalReturnDate);
        }

        // --- Chuẩn bị Payload ---
        const payload = {
            from_location_id: from.id,
            to_location_id: to.id,
            date: dayjs(finalDepartDate).format("YYYY-MM-DD"),
        };

        if (tripType === "roundtrip" && finalReturnDate) {
            payload.return_date = (dayjs(finalReturnDate).format("YYYY-MM-DD"));
        }

        // --- Gọi API Service ---
        setLoading(true);
        try {
            const result = await searchTripsApi(payload);
            
            if (result.success) {
                setResults(result.data);
            }
            return result; // Trả về kết quả cho component gọi hàm này xử lý tiếp (nếu cần)

        } finally {
            setLoading(false);
        }
    };

    const value = {
        tripType, setTripType,
        from, setFrom,
        to, setTo,
        departDate, setDepartDate,
        returnDate, setReturnDate,
        loading, 
        results, setResults, 
        handleSearchTrip,
        // Trả về luôn payload hiện tại để dễ dùng ở nơi khác (như Route Guard)
        payload: { pointStart: from, pointEnd: to, date: departDate } 
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