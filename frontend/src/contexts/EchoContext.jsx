import React, { createContext, useContext, useEffect, useRef } from "react";
import { createEchoInstance } from "../lib/echo";

const EchoContext = createContext(null);

export const EchoProvider = ({ children }) => {
    const echoInstance = useRef(null);

    if (!echoInstance.current) {
        echoInstance.current = createEchoInstance();
    }

    return (
        <EchoContext.Provider value={echoInstance.current}>
            {children}
        </EchoContext.Provider>
    );
};

export const useEcho = () => {
    return useContext(EchoContext);
};
