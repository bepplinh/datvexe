import dayjs from "dayjs";

const STORAGE_KEY = "searchTripState";

export const saveToStorage = (state) => {
    try {
        const dataToSave = {
            tripType: state.tripType,
            from: state.from
                ? {
                      id: state.from.id,
                      name: state.from.name,
                      type: state.from.type,
                  }
                : null,
            to: state.to
                ? { id: state.to.id, name: state.to.name, type: state.to.type }
                : null,
            departDate: state.departDate
                ? state.departDate.toISOString()
                : null,
            returnDate: state.returnDate
                ? state.returnDate.toISOString()
                : null,
        };
        // Thay localStorage bằng sessionStorage
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.warn("Failed to save to sessionStorage:", error);
    }
};

export const loadFromStorage = () => {
    try {
        // Thay localStorage bằng sessionStorage
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        const data = JSON.parse(saved);
        return {
            tripType: data.tripType || "oneway",
            from: data.from || "",
            to: data.to || "",
            departDate: data.departDate ? dayjs(data.departDate) : null,
            returnDate: data.returnDate ? dayjs(data.returnDate) : null,
        };
    } catch (error) {
        console.warn("Failed to load from sessionStorage:", error);
        return null;
    }
};
