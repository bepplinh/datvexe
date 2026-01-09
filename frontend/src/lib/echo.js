import Echo from "laravel-echo";
import Pusher from "pusher-js";
import Cookies from "js-cookie";
import axiosClient from "../apis/axiosClient";
Pusher.logToConsole = false;

export const createEchoInstance = () => {
    return new Echo({
        broadcaster: "pusher",
        key: import.meta.env.VITE_REVERB_APP_KEY,
        cluster: import.meta.env.VITE_REVERB_CLUSTER || "mt1",
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT,
        wssPort: import.meta.env.VITE_REVERB_PORT,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
        encrypted: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
        enableStats: false,
        enabledTransports: ["ws", "wss"],
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                const token = Cookies.get("access_token");

                if (!token) {
                    console.error("Echo Auth: Token not found for channel", channel.name);
                    return callback(true, "Token not found");
                }

                axiosClient
                    .post(
                        "/broadcasting/auth",
                        {
                            socket_id: socketId,
                            channel_name: channel.name,
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    )
                    .then((response) => {
                        callback(false, response.data);
                    })
                    .catch((error) => {
                        console.error("Echo Auth Error for channel", channel.name, ":", error.response?.data || error.message);
                        callback(true, error);
                    });
            },
        }),
    });
};
