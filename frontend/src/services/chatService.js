import axiosClient from "../apis/axiosClient";

export const chatService = {
    sendMessage: async (message) => {
        const response = await axiosClient.post("/ai/chat", {
            message: message,
        });
        return response.data;
    },
};
