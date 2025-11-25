import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import locationReducer from "./slices/locationSlice";
import routeReducer from "./slices/routeSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        location: locationReducer,
        route: routeReducer,
    },
});
