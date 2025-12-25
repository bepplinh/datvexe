import { useEffect, useRef, useState, useCallback } from "react";
import locationService from "../../../../../../services/locationService";

const useLocationSuggestions = (keyword, isOpen) => {
    const timeoutRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (!isOpen) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const trimmed = (keyword || "").trim();
        if (!trimmed) {
            setSuggestions([]);
            return;
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                const results = await locationService.searchLocations(trimmed);
                setSuggestions(results || []);
            } catch {
                setSuggestions([]);
            }
        }, 300);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [keyword, isOpen]);

    const clear = useCallback(() => setSuggestions([]), []);

    return { suggestions, clear };
};

export default useLocationSuggestions;

