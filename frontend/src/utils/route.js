const isPrimitiveId = (value) =>
    typeof value === "number" || (typeof value === "string" && value !== "");

const extractIdFromValue = (value) => {
    if (isPrimitiveId(value)) {
        return value;
    }
    if (
        value &&
        typeof value === "object" &&
        value.id !== undefined &&
        value.id !== null
    ) {
        return value.id;
    }
    return "";
};

const getCityEntity = (route, prefix) => {
    if (!route) return null;
    const camelKey = `${prefix}City`;
    if (route[camelKey]) {
        return route[camelKey];
    }
    const snakeKey = `${prefix}_city`;
    const snakeValue = route[snakeKey];
    if (snakeValue && typeof snakeValue === "object") {
        return snakeValue;
    }
    return null;
};

export const getRouteCityId = (route, prefix) => {
    if (!route) return "";
    const snakeKey = `${prefix}_city`;
    const directValue = route[snakeKey];
    const idFromDirect = extractIdFromValue(directValue);
    if (idFromDirect !== "") {
        return idFromDirect;
    }
    const camelKey = `${prefix}City`;
    const camelValue = route[camelKey];
    const idFromCamel = extractIdFromValue(camelValue);
    if (idFromCamel !== "") {
        return idFromCamel;
    }
    return "";
};

export const getRouteCityName = (route, prefix, fallback = "N/A") => {
    const city = getCityEntity(route, prefix);
    return city?.name || fallback;
};

export const getRouteCityEntity = (route, prefix) => getCityEntity(route, prefix);




