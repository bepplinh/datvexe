// SearchTripContext.jsx
import React, { createContext, useContext, useState } from "react";
import dayjs from "dayjs";

const SearchTripContext = createContext(null);

export const SearchTripProvider = ({ children }) => {
    const [tripType, setTripType] = useState("oneway");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [departDate, setDepartDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);

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
