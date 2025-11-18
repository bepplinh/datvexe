import { createContext, useState, useContext } from "react";

const ActiveTabWayContext = createContext();

export const ActiveTabWayProvider = ({children}) => {
    const [isActiveTabWay, setIsActiveTabWay] = useState("outboundTrip")

    const value = {
        isActiveTabWay,
        setIsActiveTabWay,
    };

    return <ActiveTabWayContext.Provider value={value}>
        {children}
    </ActiveTabWayContext.Provider>
}

export const useActiveTabWay = () => {
    const ctx = useContext(ActiveTabWayContext);
    if (!ctx) {
        throw new Error("useActiveTabWay must be used within ActiveTabWayContext");
    }
    return ctx;
};
