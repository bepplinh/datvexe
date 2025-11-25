export const getErrorMessage = (error, fallback = "Có lỗi xảy ra") => {
    if (!error) return fallback;
    if (typeof error === "string") return error;

    const responseData = error.response?.data;

    if (typeof responseData === "string") {
        return responseData;
    }

    if (responseData?.message) {
        return responseData.message;
    }

    const responseMessage = error.response?.message;
    if (responseMessage) {
        return responseMessage;
    }

    if (error.message) {
        return error.message;
    }

    if (responseData?.errors) {
        const errors = responseData.errors;
        const firstKey = Object.keys(errors)[0];
        if (firstKey) {
            const messages = errors[firstKey];
            if (Array.isArray(messages) && messages.length > 0) {
                return messages[0];
            }
            if (typeof messages === "string") {
                return messages;
            }
        }
    }

    return fallback;
};

