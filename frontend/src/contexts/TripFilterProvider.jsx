import { createContext, useState, useContext } from "react";

const TripFilterContext = createContext();

export const TripFilterProvider = ({ children }) => {
    const [giuongNam, setGiuongNam] = useState(false);
    const [limousineCabin, setLimousineCabin] = useState(false);
    const [timeMin, setTimeMin] = useState(0);
    const [timeMax, setTimeMax] = useState(1439);
    const [seatMin, setSeatMin] = useState(0);
    const [seatMax, setSeatMax] = useState(60);

    const reset = () => {
        setGiuongNam(false);
        setLimousineCabin(false);
        setTimeMin(0);
        setTimeMax(1439);
        setSeatMin(0);
        setSeatMax(60);
    };

    const value = {
        giuongNam,
        setGiuongNam,
        limousineCabin,
        setLimousineCabin,
        timeMin,
        setTimeMin,
        timeMax,
        setTimeMax,
        seatMin,
        setSeatMin,
        seatMax,
        setSeatMax,
        reset,
    };

    return (
        <TripFilterContext.Provider value={value}>
            {children}
        </TripFilterContext.Provider>
    );
};

export const useTripFilter = () => {
    const ctx = useContext(TripFilterContext);
    if (!ctx) {
        throw new Error("useTripFilter must be used within TripFilterProvider");
    }
    return ctx;
};

