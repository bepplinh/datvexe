import axiosClient from "../apis/axiosClient";

export const conversationService = {
    getConversations: async (params = {}) => {
        const response = await axiosClient.get("/conversations", { params });
        return response.data;
    },

    getConversation: async (conversationId) => {
        const response = await axiosClient.get(`/conversations/${conversationId}`);
        return response.data;
    },

    createConversation: async (payload) => {
        const response = await axiosClient.post("/conversations", payload);
        return response.data;
    },

    sendMessage: async (conversationId, payload) => {
        const response = await axiosClient.post(
            `/conversations/${conversationId}/messages`,
            payload
        );
        return response.data;
    },

    updateStatus: async (conversationId, payload) => {
        const response = await axiosClient.patch(
            `/conversations/${conversationId}/status`,
            payload
        );
        return response.data;
    },
};

